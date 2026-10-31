import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import * as mock from '../constants/mockData';
import type {
  CategoriaHabito,
  Habito,
  Meta,
  Racha,
  RegistroDiario,
  Usuario,
} from '../types';
import { hoyISO, semanaDe } from '../utils/date';
import { calcularRacha } from '../utils/racha';

/**
 * Estado global de la aplicacion.
 *
 * Version inicial: todo vive en memoria y se reinicia al cerrar la app.
 * El dia que exista API, solo cambian las implementaciones de estas acciones;
 * las pantallas no se tocan.
 */

interface DatosNuevoHabito {
  nombre: string;
  descripcion?: string;
  categoriaHabitoId: number;
  unidadMedida: string;
}

interface DatosNuevaMeta {
  habitoId: number;
  valorObjetivo: number;
  descripcion: string;
}

interface DatosNuevoRegistro {
  habitoId: number;
  fecha: string;
  valorRegistrado: number;
  notas?: string;
}

interface ResumenDia {
  fecha: string;
  total: number;
  cumplidas: number;
  porcentaje: number;
}

interface AppState {
  usuario: Usuario | null;
  categorias: CategoriaHabito[];
  habitos: Habito[];
  metas: Meta[];
  registros: RegistroDiario[];

  // Datos derivados
  rachas: Racha[];
  actividadSemanal: ResumenDia[];
  registrosDeHoy: RegistroDiario[];

  // Sesion
  iniciarSesion: (correo: string, contrasena: string) => boolean;
  crearCuenta: (datos: Omit<Usuario, 'id'>) => void;
  cerrarSesion: () => void;

  // Habitos
  crearHabito: (datos: DatosNuevoHabito) => void;
  eliminarHabito: (id: number) => { ok: boolean; mensaje?: string };

  // Metas
  crearMeta: (datos: DatosNuevaMeta) => { ok: boolean; mensaje?: string };
  alternarMeta: (id: number) => { ok: boolean; mensaje?: string };

  // Registros
  crearRegistro: (datos: DatosNuevoRegistro) => { ok: boolean; mensaje?: string };
  eliminarRegistro: (id: number) => void;

  // Consultas de apoyo
  habitoPorId: (id: number) => Habito | undefined;
  categoriaPorId: (id: number) => CategoriaHabito | undefined;
  metaActivaDe: (habitoId: number) => Meta | undefined;
  rachaDe: (habitoId: number) => Racha;
}

const AppContext = createContext<AppState | undefined>(undefined);

/** Genera el siguiente id disponible de una lista. */
function siguienteId(lista: Array<{ id: number }>): number {
  return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [categorias] = useState<CategoriaHabito[]>(mock.categorias);
  const [habitos, setHabitos] = useState<Habito[]>(mock.habitos);
  const [metas, setMetas] = useState<Meta[]>(mock.metas);
  const [registros, setRegistros] = useState<RegistroDiario[]>(mock.registros);

  // ---------------------------------------------------------------- consultas

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

  // ----------------------------------------------------------------- acciones

  const iniciarSesion = useCallback((correo: string, contrasena: string) => {
    // Sin backend todavia: cualquier credencial no vacia entra como usuario demo.
    if (!correo.trim() || !contrasena.trim()) return false;
    setUsuario({ ...mock.usuarioDemo, correo: correo.trim() });
    return true;
  }, []);

  const crearCuenta = useCallback((datos: Omit<Usuario, 'id'>) => {
    setUsuario({ ...datos, id: mock.usuarioDemo.id });
  }, []);

  const cerrarSesion = useCallback(() => setUsuario(null), []);

  const crearHabito = useCallback(
    (datos: DatosNuevoHabito) => {
      setHabitos((previos) => [
        ...previos,
        {
          id: siguienteId(previos),
          usuarioId: usuario?.id ?? mock.usuarioDemo.id,
          categoriaHabitoId: datos.categoriaHabitoId,
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion?.trim() || undefined,
          unidadMedida: datos.unidadMedida.trim(),
          frecuencia: 'diaria',
          activo: true,
        },
      ]);
    },
    [usuario],
  );

  const eliminarHabito = useCallback(
    (id: number) => {
      // Misma regla de negocio que el backend: no se borra si tiene registros.
      if (registros.some((r) => r.habitoId === id)) {
        return { ok: false, mensaje: 'No se puede eliminar: el habito tiene registros asociados.' };
      }
      setHabitos((previos) => previos.filter((h) => h.id !== id));
      setMetas((previas) => previas.filter((m) => m.habitoId !== id));
      return { ok: true };
    },
    [registros],
  );

  const crearMeta = useCallback(
    (datos: DatosNuevaMeta) => {
      // Regla de negocio: un habito solo puede tener una meta activa a la vez.
      if (metas.some((m) => m.habitoId === datos.habitoId && m.activa)) {
        return {
          ok: false,
          mensaje: 'Este habito ya tiene una meta activa. Desactivala antes de crear otra.',
        };
      }
      setMetas((previas) => [
        ...previas,
        {
          id: siguienteId(previas),
          habitoId: datos.habitoId,
          valorObjetivo: datos.valorObjetivo,
          descripcion: datos.descripcion.trim(),
          activa: true,
        },
      ]);
      return { ok: true };
    },
    [metas],
  );

  const alternarMeta = useCallback(
    (id: number) => {
      const meta = metas.find((m) => m.id === id);
      if (!meta) return { ok: false, mensaje: 'Meta no encontrada.' };

      // Al activar, se valida que no haya otra activa del mismo habito.
      if (!meta.activa) {
        const yaActiva = metas.find((m) => m.habitoId === meta.habitoId && m.activa);
        if (yaActiva) {
          return {
            ok: false,
            mensaje: 'Ya hay otra meta activa para este habito. Desactivala primero.',
          };
        }
      }

      setMetas((previas) =>
        previas.map((m) => (m.id === id ? { ...m, activa: !m.activa } : m)),
      );
      return { ok: true };
    },
    [metas],
  );

  const crearRegistro = useCallback(
    (datos: DatosNuevoRegistro) => {
      // Regla de negocio: un unico registro por habito y fecha.
      const duplicado = registros.some(
        (r) => r.habitoId === datos.habitoId && r.fecha === datos.fecha,
      );
      if (duplicado) {
        return { ok: false, mensaje: 'Ya existe un registro de este habito para esa fecha.' };
      }

      const meta = metas.find((m) => m.habitoId === datos.habitoId && m.activa);
      const metaCumplida = meta ? datos.valorRegistrado >= meta.valorObjetivo : false;

      setRegistros((previos) => [
        ...previos,
        {
          id: siguienteId(previos),
          habitoId: datos.habitoId,
          fecha: datos.fecha,
          valorRegistrado: datos.valorRegistrado,
          metaCumplida,
          notas: datos.notas?.trim() || undefined,
        },
      ]);

      return {
        ok: true,
        mensaje: metaCumplida
          ? 'Registro guardado. ¡Meta cumplida!'
          : 'Registro guardado. Sigue esforzandote.',
      };
    },
    [registros, metas],
  );

  const eliminarRegistro = useCallback((id: number) => {
    setRegistros((previos) => previos.filter((r) => r.id !== id));
  }, []);

  // ------------------------------------------------------------------- valor

  const valor = useMemo<AppState>(
    () => ({
      usuario,
      categorias,
      habitos,
      metas,
      registros,
      rachas,
      actividadSemanal,
      registrosDeHoy,
      iniciarSesion,
      crearCuenta,
      cerrarSesion,
      crearHabito,
      eliminarHabito,
      crearMeta,
      alternarMeta,
      crearRegistro,
      eliminarRegistro,
      habitoPorId,
      categoriaPorId,
      metaActivaDe,
      rachaDe,
    }),
    [
      usuario, categorias, habitos, metas, registros, rachas, actividadSemanal,
      registrosDeHoy, iniciarSesion, crearCuenta, cerrarSesion, crearHabito,
      eliminarHabito, crearMeta, alternarMeta, crearRegistro, eliminarRegistro,
      habitoPorId, categoriaPorId, metaActivaDe, rachaDe,
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
