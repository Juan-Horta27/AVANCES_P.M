import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { registrarManejadorSesionInvalida } from '../services/api';
import * as authApi from '../services/auth';
import * as habitosApi from '../services/habitos';
import * as metasApi from '../services/metas';
import * as registrosApi from '../services/registros';
import * as reportesApi from '../services/reportes';
import * as cache from '../storage/cache';
import {
  RegistroPendiente,
  borrarPendientes,
  guardarPendientes,
  leerPendientes,
} from '../storage/pendientes';
import { borrarToken, guardarToken, leerToken } from '../storage/seguro';
import type {
  CategoriaHabito,
  DatosNuevaCuenta,
  Habito,
  Meta,
  Racha,
  RegistroDiario,
  Usuario,
} from '../types';
import { hoyISO, semanaDe } from '../utils/date';
import { calcularRacha } from '../utils/racha';

/**
 * Estado global de la aplicacion (ADR-001).
 *
 * Los datos vienen del API a traves de los modulos de `services/` (ADR-005). Las pantallas no
 * saben de donde salen: siguen llamando las mismas acciones, que ahora son asincronas. Las
 * reglas de negocio las impone el servidor; aqui solo se muestra su respuesta.
 */

/** iniciando: leyendo el token guardado al abrir la app (ADR-004, estado "hidratando"). */
export type EstadoSesion = 'iniciando' | 'sin-sesion' | 'con-sesion';

/** Resultado que las pantallas ya consumian: la pantalla decide como comunicarlo. */
export interface Respuesta {
  ok: boolean;
  mensaje?: string;
  /** true si el registro quedo en la cola sin conexion en vez de llegar al servidor (S-06). */
  pendiente?: boolean;
}

/** Cada cuanto se reintenta subir la cola de pendientes mientras no este vacia (S-06). */
const INTERVALO_REENVIO_MS = 15_000;

/** offline-sync.md: si el servidor ya tenia un registro ese dia, gana el servidor. */
const MENSAJE_CONFLICTO_PENDIENTE =
  'Ya existía un registro sincronizado para este hábito en esa fecha. Se mantuvo el registro del servidor.';

interface ResumenDia {
  fecha: string;
  total: number;
  cumplidas: number;
  porcentaje: number;
}

interface AppState {
  estadoSesion: EstadoSesion;
  usuario: Usuario | null;
  categorias: CategoriaHabito[];
  /** Todos, incluidos los archivados (el historial necesita sus nombres). */
  habitos: Habito[];
  /** Los que se muestran en listas, selectores y dashboard (ADR-008, D-10). */
  habitosActivos: Habito[];
  metas: Meta[];
  registros: RegistroDiario[];

  // Carga de datos tras iniciar sesion: la navegacion muestra carga o error en un solo lugar.
  cargandoDatos: boolean;
  errorDatos: string | null;
  recargarDatos: () => Promise<void>;

  // Sin conexion (S-05): la app sigue mostrando lo que tenia en cache.
  /** true si la ultima actualizacion fallo por falta de red y se muestran datos de la cache. */
  sinConexion: boolean;
  /** Instante (ISO) de la ultima vez que los datos llegaron del servidor. */
  sincronizado: string | null;
  /** Intenta traer datos frescos sin ocultar los que ya se muestran. */
  reintentarConexion: () => Promise<void>;

  // Registros hechos sin conexion que esperan subir al servidor (S-06).
  pendientes: RegistroPendiente[];
  /** Aviso para la persona cuando un pendiente no se pudo subir (p. ej. ya existia ese dia). */
  avisoPendientes: string | null;
  descartarAvisoPendientes: () => void;

  // Datos derivados
  rachas: Racha[];
  actividadSemanal: ResumenDia[];
  registrosDeHoy: RegistroDiario[];

  // Sesion
  iniciarSesion: (correo: string, contrasena: string) => Promise<Respuesta>;
  crearCuenta: (datos: DatosNuevaCuenta) => Promise<Respuesta>;
  cerrarSesion: () => Promise<void>;

  // Habitos
  crearHabito: (datos: habitosApi.DatosNuevoHabito) => Promise<Respuesta>;
  editarHabito: (id: number, cambios: habitosApi.CambiosHabito) => Promise<Respuesta>;
  eliminarHabito: (id: number) => Promise<Respuesta>;

  // Metas
  crearMeta: (datos: metasApi.DatosNuevaMeta) => Promise<Respuesta>;
  editarMeta: (id: number, cambios: metasApi.CambiosMeta) => Promise<Respuesta>;
  eliminarMeta: (id: number) => Promise<Respuesta>;
  alternarMeta: (id: number) => Promise<Respuesta>;

  // Registros
  crearRegistro: (datos: registrosApi.DatosNuevoRegistro) => Promise<Respuesta>;
  editarRegistro: (id: number, cambios: registrosApi.CambiosRegistro) => Promise<Respuesta>;
  eliminarRegistro: (id: number) => Promise<Respuesta>;

  // Panel del profesional (M-09): consultas de solo lectura, sin caché ni cola sin conexión
  listarPacientes: typeof reportesApi.listarPacientes;
  obtenerProgreso: typeof reportesApi.obtenerProgreso;

  // Consultas de apoyo
  habitoPorId: (id: number) => Habito | undefined;
  categoriaPorId: (id: number) => CategoriaHabito | undefined;
  metaActivaDe: (habitoId: number) => Meta | undefined;
  rachaDe: (habitoId: number) => Racha;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [estadoSesion, setEstadoSesion] = useState<EstadoSesion>('iniciando');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [categorias, setCategorias] = useState<CategoriaHabito[]>([]);
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState<string | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [sincronizado, setSincronizado] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState<RegistroPendiente[]>([]);
  const [avisoPendientes, setAvisoPendientes] = useState<string | null>(null);
  // La cola tambien vive en una referencia: el reenvio corre en segundo plano y necesita la
  // version mas reciente, no la que existia cuando empezo (S-06).
  const colaRef = useRef<{ usuarioId: number | null; registros: RegistroPendiente[] }>({
    usuarioId: null,
    registros: [],
  });
  const enviandoColaRef = useRef(false);

  // ------------------------------------------------------------------ sesion

  /** Cerrar sesion limpia todo: token, cache local y estado en memoria (security-rules.md). */
  const limpiarSesion = useCallback(async () => {
    try {
      await borrarToken();
      await cache.limpiarCache();
      await borrarPendientes();
    } catch {
      // Aunque el almacenamiento del telefono falle, la sesion en memoria se cierra igual:
      // dejar la app con la sesion abierta seria peor (no hay token valido que usar).
    }
    setUsuario(null);
    setCategorias([]);
    setHabitos([]);
    setMetas([]);
    setRegistros([]);
    setErrorDatos(null);
    setCargandoDatos(false);
    setSinConexion(false);
    setSincronizado(null);
    colaRef.current = { usuarioId: null, registros: [] };
    setPendientes([]);
    setAvisoPendientes(null);
    setEstadoSesion('sin-sesion');
  }, []);

  // ------------------------------------------------------- cola sin conexion (S-06)

  /** Reemplaza la cola en memoria y en el dispositivo. */
  const fijarCola = useCallback((usuarioId: number, registros: RegistroPendiente[]) => {
    colaRef.current = { usuarioId, registros };
    setPendientes(registros);
    void guardarPendientes(usuarioId, registros);
  }, []);

  /** Recupera la cola guardada de esta persona al empezar o restaurar su sesion. */
  const cargarCola = useCallback(async (usuarioId: number) => {
    const registros = await leerPendientes(usuarioId);
    colaRef.current = { usuarioId, registros };
    setPendientes(registros);
  }, []);

  /**
   * Sube los pendientes en orden, cada uno con su clienteId: el servidor no los duplica aunque
   * alguno ya hubiera llegado (D-17). Si sigue sin red, se detiene y lo intenta mas tarde. Si el
   * servidor los rechaza (409 porque ya habia registro ese dia, 422, 404...), gana el servidor:
   * el pendiente se descarta y se avisa a la persona (offline-sync.md).
   */
  const enviarPendientes = useCallback(async () => {
    const { usuarioId, registros: cola } = colaRef.current;
    if (enviandoColaRef.current || usuarioId === null || cola.length === 0) return;
    enviandoColaRef.current = true;

    const procesados = new Set<string>();
    const enviados: RegistroDiario[] = [];
    const avisos: string[] = [];
    for (const { clienteId, ...datos } of cola) {
      const resultado = await registrosApi.crearRegistro(datos, clienteId);
      if (!resultado.ok && resultado.status === undefined) break; // sigue sin red
      procesados.add(clienteId);
      if (resultado.ok) enviados.push(resultado.datos);
      else if (resultado.code === 'DUPLICATE_DAILY_LOG') avisos.push(MENSAJE_CONFLICTO_PENDIENTE);
      else avisos.push(`No se pudo subir un registro pendiente: ${resultado.mensaje}`);
    }
    enviandoColaRef.current = false;

    // Si la sesion se cerro mientras tanto, no se toca la cola de esa persona.
    if (colaRef.current.usuarioId !== usuarioId) return;
    // Se quitan solo los procesados: pudo entrar un pendiente nuevo durante el envio.
    fijarCola(
      usuarioId,
      colaRef.current.registros.filter((p) => !procesados.has(p.clienteId)),
    );
    if (enviados.length > 0) {
      setRegistros((previos) => [
        ...previos.filter((r) => !enviados.some((e) => e.id === r.id)),
        ...enviados,
      ]);
      setSinConexion(false);
    }
    if (avisos.length > 0) setAvisoPendientes(avisos.join('\n'));
  }, [fijarCola]);

  /** Muestra lo guardado en el dispositivo mientras llegan los datos frescos. */
  const aplicarCache = useCallback((guardado: cache.Dominio) => {
    setUsuario(guardado.usuario);
    setCategorias(guardado.categorias);
    setHabitos(guardado.habitos);
    setMetas(guardado.metas);
    setRegistros(guardado.registros);
    setSincronizado(guardado.sincronizado);
  }, []);

  /**
   * Trae todo lo que la app muestra.
   * - En primer plano (no hay nada que mostrar): pantalla de carga y, si falla, de error.
   * - En segundo plano (ya se muestran datos de la cache): sin bloquear la interfaz; si falla
   *   por falta de red, se siguen mostrando los datos guardados y se marca `sinConexion`.
   */
  const cargarDatos = useCallback(async (enSegundoPlano: boolean) => {
    if (!enSegundoPlano) {
      setCargandoDatos(true);
      setErrorDatos(null);
    }
    const [rCategorias, rHabitos, rMetas, rRegistros] = await Promise.all([
      habitosApi.listarCategorias(),
      habitosApi.listarHabitos(),
      metasApi.listarMetas(),
      registrosApi.listarRegistros(),
    ]);
    setCargandoDatos(false);

    if (!rCategorias.ok || !rHabitos.ok || !rMetas.ok || !rRegistros.ok) {
      const fallo = [rCategorias, rHabitos, rMetas, rRegistros].find((r) => !r.ok);
      if (!fallo || fallo.ok) return;
      // Sin código HTTP = no hubo respuesta (sin red o servidor caído). Un 401 ya cerró la sesión.
      const esFalloDeRed = fallo.status === undefined;
      if (enSegundoPlano) {
        if (esFalloDeRed) setSinConexion(true);
      } else {
        setErrorDatos(fallo.mensaje);
      }
      return;
    }
    setCategorias(rCategorias.datos);
    setHabitos(rHabitos.datos);
    setMetas(rMetas.datos);
    setRegistros(rRegistros.datos);
    setSinConexion(false);
    setSincronizado(new Date().toISOString());
    // Hay red: es el momento de subir lo que se registro sin conexion.
    void enviarPendientes();
  }, [enviarPendientes]);

  /** Pide al servidor el perfil y los datos (al arrancar, o al reintentar la conexion). */
  const actualizarDesdeServidor = useCallback(
    async (enSegundoPlano: boolean) => {
      if (!enSegundoPlano) {
        setCargandoDatos(true);
        setErrorDatos(null);
      }
      const perfil = await authApi.obtenerPerfil();
      if (!perfil.ok) {
        // Un 401 ya cerro la sesion (manejador registrado abajo). Otro fallo es de red: no se
        // borra el token, para no obligar a escribir la contrasena cuando vuelva la conexion.
        if (perfil.status === 401) return;
        setCargandoDatos(false);
        if (!enSegundoPlano) setErrorDatos(perfil.mensaje);
        else if (perfil.status === undefined) setSinConexion(true);
        return;
      }
      setUsuario(perfil.datos);
      if (perfil.datos.rol === 'paciente') {
        await cargarCola(perfil.datos.id);
        await cargarDatos(enSegundoPlano);
      } else {
        setCargandoDatos(false);
      }
    },
    [cargarCola, cargarDatos],
  );

  /** Al abrir la app con sesion guardada: primero la cache (al instante), luego el servidor. */
  const restaurarSesion = useCallback(async () => {
    const guardado = await cache.leerDominio();
    if (guardado) {
      aplicarCache(guardado);
      // Sin red tambien hay que ver (y conservar) lo que quedo pendiente de subir.
      await cargarCola(guardado.usuario.id);
    }
    await actualizarDesdeServidor(guardado !== null);
  }, [aplicarCache, cargarCola, actualizarDesdeServidor]);

  useEffect(() => {
    // Ante un 401 en cualquier peticion protegida: token vencido o invalido → al login.
    registrarManejadorSesionInvalida(() => {
      void limpiarSesion();
    });

    void (async () => {
      let token: string | null;
      try {
        await cache.descartarVersionesAnteriores();
        token = await leerToken();
      } catch {
        // Si el almacenamiento del telefono falla, se pide iniciar sesion en lugar de dejar la
        // app congelada en la pantalla de "Abriendo tu sesion".
        token = null;
      }
      if (!token) {
        setEstadoSesion('sin-sesion');
        return;
      }
      setEstadoSesion('con-sesion');
      await restaurarSesion();
    })();

    return () => registrarManejadorSesionInvalida(null);
  }, [limpiarSesion, restaurarSesion]);

  const recargarDatos = useCallback(
    () => actualizarDesdeServidor(false),
    [actualizarDesdeServidor],
  );

  const reintentarConexion = useCallback(
    () => actualizarDesdeServidor(true),
    [actualizarDesdeServidor],
  );

  const empezarSesion = useCallback(
    async (sesion: authApi.Sesion) => {
      await guardarToken(sesion.token);
      setUsuario(sesion.usuario);
      setEstadoSesion('con-sesion');
      // El profesional no precarga nada: sus pantallas consultan el API cada vez (ADR-011).
      if (sesion.usuario.rol === 'paciente') {
        await cargarCola(sesion.usuario.id);
        await cargarDatos(false);
      }
    },
    [cargarCola, cargarDatos],
  );

  // -------------------------------------------------------- cache del dominio

  // Cada coleccion se reescribe en la cache solo cuando cambia (persistence.md). No se guarda
  // nada antes de tener datos cargados ni despues de cerrar sesion. Solo el paciente usa cache:
  // el telefono del profesional no conserva datos de salud de otras personas (ADR-011).
  const persistir =
    estadoSesion === 'con-sesion' && sincronizado !== null && usuario?.rol === 'paciente';

  useEffect(() => {
    if (persistir && usuario) void cache.guardarColeccion('usuario', usuario);
  }, [persistir, usuario]);
  useEffect(() => {
    if (persistir) void cache.guardarColeccion('categorias', categorias);
  }, [persistir, categorias]);
  useEffect(() => {
    if (persistir) void cache.guardarColeccion('habitos', habitos);
  }, [persistir, habitos]);
  useEffect(() => {
    if (persistir) void cache.guardarColeccion('metas', metas);
  }, [persistir, metas]);
  useEffect(() => {
    if (persistir) void cache.guardarColeccion('registros', registros);
  }, [persistir, registros]);
  useEffect(() => {
    if (persistir && sincronizado) void cache.guardarColeccion('sincronizado', sincronizado);
  }, [persistir, sincronizado]);

  const iniciarSesion = useCallback(
    async (correo: string, contrasena: string): Promise<Respuesta> => {
      const resultado = await authApi.iniciarSesion(correo, contrasena);
      if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
      await empezarSesion(resultado.datos);
      return { ok: true };
    },
    [empezarSesion],
  );

  const crearCuenta = useCallback(
    async (datos: DatosNuevaCuenta): Promise<Respuesta> => {
      const resultado = await authApi.crearCuenta(datos);
      if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
      await empezarSesion(resultado.datos);
      return { ok: true };
    },
    [empezarSesion],
  );

  // ---------------------------------------------------------------- consultas

  const habitosActivos = useMemo(() => habitos.filter((h) => h.activo), [habitos]);

  const habitoPorId = useCallback(
    (id: number) => habitos.find((h) => h.id === id),
    [habitos],
  );

  const categoriaPorId = useCallback(
    (id: number) => categorias.find((c) => c.id === id),
    [categorias],
  );

  const metaActivaDe = useCallback(
    (habitoId: number) => metas.find((m) => m.habitoId === habitoId && m.activa),
    [metas],
  );

  // La racha se deriva de los registros con el mismo algoritmo que usa el servidor (D-19).
  const rachas = useMemo(
    () => habitos.map((h) => calcularRacha(h.id, registros)),
    [habitos, registros],
  );

  const rachaDe = useCallback(
    (habitoId: number): Racha =>
      rachas.find((r) => r.habitoId === habitoId) ?? {
        habitoId,
        rachaActual: 0,
        rachaMaxima: 0,
      },
    [rachas],
  );

  const registrosDeHoy = useMemo(() => {
    const hoy = hoyISO();
    return registros.filter((r) => r.fecha === hoy);
  }, [registros]);

  const actividadSemanal = useMemo<ResumenDia[]>(() => {
    return semanaDe().map((fecha) => {
      const delDia = registros.filter((r) => r.fecha === fecha);
      const cumplidas = delDia.filter((r) => r.metaCumplida).length;
      return {
        fecha,
        total: delDia.length,
        cumplidas,
        porcentaje: delDia.length > 0 ? Math.round((cumplidas / delDia.length) * 100) : 0,
      };
    });
  }, [registros]);

  // Mientras haya pendientes, se reintenta subirlos cada cierto tiempo (S-06).
  useEffect(() => {
    if (usuario?.rol !== 'paciente' || pendientes.length === 0) return;
    const temporizador = setInterval(() => void enviarPendientes(), INTERVALO_REENVIO_MS);
    return () => clearInterval(temporizador);
  }, [usuario?.rol, pendientes.length, enviarPendientes]);

  const descartarAvisoPendientes = useCallback(() => setAvisoPendientes(null), []);

  // ----------------------------------------------------------------- acciones

  const crearHabito = useCallback(
    async (datos: habitosApi.DatosNuevoHabito): Promise<Respuesta> => {
      const resultado = await habitosApi.crearHabito(datos);
      if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
      setHabitos((previos) => [...previos, resultado.datos]);
      return { ok: true };
    },
    [],
  );

  const editarHabito = useCallback(
    async (id: number, cambios: habitosApi.CambiosHabito): Promise<Respuesta> => {
      const resultado = await habitosApi.editarHabito(id, cambios);
      if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
      setHabitos((previos) => previos.map((h) => (h.id === id ? resultado.datos : h)));
      return { ok: true };
    },
    [],
  );

  /**
   * El servidor decide si borra o archiva (D-10); por eso, en vez de repetir esa regla aqui,
   * se vuelven a pedir hábitos y metas y se informa lo que ocurrio.
   */
  const eliminarHabito = useCallback(async (id: number): Promise<Respuesta> => {
    const resultado = await habitosApi.eliminarHabito(id);
    if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };

    const [rHabitos, rMetas] = await Promise.all([
      habitosApi.listarHabitos(),
      metasApi.listarMetas(),
    ]);
    if (rHabitos.ok) setHabitos(rHabitos.datos);
    if (rMetas.ok) setMetas(rMetas.datos);

    const archivado = rHabitos.ok && rHabitos.datos.some((h) => h.id === id);
    return {
      ok: true,
      mensaje: archivado
        ? 'El hábito tenía registros: se archivó y su historial se conserva.'
        : 'Hábito eliminado.',
    };
  }, []);

  const crearMeta = useCallback(async (datos: metasApi.DatosNuevaMeta): Promise<Respuesta> => {
    const resultado = await metasApi.crearMeta(datos);
    if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
    setMetas((previas) => [...previas, resultado.datos]);
    return { ok: true };
  }, []);

  const editarMeta = useCallback(
    async (id: number, cambios: metasApi.CambiosMeta): Promise<Respuesta> => {
      const resultado = await metasApi.editarMeta(id, cambios);
      if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
      setMetas((previas) => previas.map((m) => (m.id === id ? resultado.datos : m)));
      return { ok: true };
    },
    [],
  );

  const eliminarMeta = useCallback(async (id: number): Promise<Respuesta> => {
    const resultado = await metasApi.eliminarMeta(id);
    if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
    setMetas((previas) => previas.filter((m) => m.id !== id));
    return { ok: true };
  }, []);

  const alternarMeta = useCallback(
    async (id: number): Promise<Respuesta> => {
      const meta = metas.find((m) => m.id === id);
      if (!meta) return { ok: false, mensaje: 'Meta no encontrada.' };

      const resultado = await metasApi.cambiarEstadoMeta(id, !meta.activa);
      if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
      setMetas((previas) => previas.map((m) => (m.id === id ? resultado.datos : m)));
      return { ok: true };
    },
    [metas],
  );

  /** Deja un registro en la cola cuando no hay red (S-06). */
  const encolar = useCallback(
    (pendiente: RegistroPendiente): Respuesta => {
      const { usuarioId, registros: cola } = colaRef.current;
      if (usuarioId === null) {
        return { ok: false, mensaje: 'No pudimos conectar. Revisa tu conexión e intenta de nuevo.' };
      }
      const repetido = cola.some(
        (p) => p.habitoId === pendiente.habitoId && p.fecha === pendiente.fecha,
      );
      if (repetido) {
        return {
          ok: false,
          mensaje: 'Ya tienes un registro pendiente de subir para este hábito en esa fecha.',
        };
      }
      fijarCola(usuarioId, [...cola, pendiente]);
      setSinConexion(true);
      return {
        ok: true,
        pendiente: true,
        mensaje: 'Sin conexión: el registro quedó pendiente y se subirá solo al recuperar la conexión.',
      };
    },
    [fijarCola],
  );

  const crearRegistro = useCallback(
    async (datos: registrosApi.DatosNuevoRegistro): Promise<Respuesta> => {
      const clienteId = registrosApi.nuevoClienteId();
      const resultado = await registrosApi.crearRegistro(datos, clienteId);
      if (!resultado.ok) {
        // Sin respuesta del servidor (sin red): el registro espera en la cola (S-06). Si el
        // servidor respondio con un error, es una regla de negocio y se muestra tal cual.
        if (resultado.status !== undefined) return { ok: false, mensaje: resultado.mensaje };
        return encolar({ ...datos, clienteId });
      }

      // metaCumplida la decide el servidor contra la meta activa (ADR-008, D-18).
      const registro = resultado.datos;
      setRegistros((previos) => [...previos, registro]);
      return {
        ok: true,
        mensaje: registro.metaCumplida
          ? 'Registro guardado. ¡Meta cumplida!'
          : 'Registro guardado. Sigue esforzándote.',
      };
    },
    [encolar],
  );

  /** Al cambiar el valor, el servidor vuelve a decidir si se cumplió la meta (ADR-011). */
  const editarRegistro = useCallback(
    async (id: number, cambios: registrosApi.CambiosRegistro): Promise<Respuesta> => {
      const resultado = await registrosApi.editarRegistro(id, cambios);
      if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
      const registro = resultado.datos;
      setRegistros((previos) => previos.map((r) => (r.id === id ? registro : r)));
      return {
        ok: true,
        mensaje: registro.metaCumplida
          ? 'Registro actualizado. ¡Meta cumplida!'
          : 'Registro actualizado.',
      };
    },
    [],
  );

  const eliminarRegistro = useCallback(async (id: number): Promise<Respuesta> => {
    const resultado = await registrosApi.eliminarRegistro(id);
    if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje };
    setRegistros((previos) => previos.filter((r) => r.id !== id));
    return { ok: true };
  }, []);

  // ------------------------------------------------------------------- valor

  const valor = useMemo<AppState>(
    () => ({
      estadoSesion,
      usuario,
      categorias,
      habitos,
      habitosActivos,
      metas,
      registros,
      cargandoDatos,
      errorDatos,
      recargarDatos,
      sinConexion,
      sincronizado,
      reintentarConexion,
      pendientes,
      avisoPendientes,
      descartarAvisoPendientes,
      rachas,
      actividadSemanal,
      registrosDeHoy,
      iniciarSesion,
      crearCuenta,
      cerrarSesion: limpiarSesion,
      crearHabito,
      editarHabito,
      eliminarHabito,
      crearMeta,
      editarMeta,
      eliminarMeta,
      alternarMeta,
      crearRegistro,
      editarRegistro,
      eliminarRegistro,
      listarPacientes: reportesApi.listarPacientes,
      obtenerProgreso: reportesApi.obtenerProgreso,
      habitoPorId,
      categoriaPorId,
      metaActivaDe,
      rachaDe,
    }),
    [
      estadoSesion, usuario, categorias, habitos, habitosActivos, metas, registros,
      cargandoDatos, errorDatos, recargarDatos, sinConexion, sincronizado, reintentarConexion,
      pendientes, avisoPendientes, descartarAvisoPendientes,
      rachas, actividadSemanal, registrosDeHoy,
      iniciarSesion, crearCuenta, limpiarSesion, crearHabito, editarHabito, eliminarHabito,
      crearMeta, editarMeta, eliminarMeta, alternarMeta, crearRegistro, editarRegistro,
      eliminarRegistro, habitoPorId, categoriaPorId,
      metaActivaDe, rachaDe,
    ],
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

/** Hook de acceso al estado global. */
export function useApp(): AppState {
  const contexto = useContext(AppContext);
  if (!contexto) {
    throw new Error('useApp debe usarse dentro de <AppProvider>');
  }
  return contexto;
}
