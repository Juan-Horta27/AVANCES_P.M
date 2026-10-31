import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import * as authApi from '../services/auth';
import * as habitosApi from '../services/habitos';
import * as metasApi from '../services/metas';
import * as registrosApi from '../services/registros';
import { guardarColeccion, leerDominio } from '../storage/cache';
import { borrarToken, leerToken } from '../storage/seguro';
import type { Habito, Usuario } from '../types';
import { AppProvider, useApp } from './AppContext';

// Prueba del arranque de la app (S-05): se simulan la red (services) y el token; la caché usa
// la simulación oficial de AsyncStorage, así que se prueba el módulo real de caché.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../storage/seguro');
jest.mock('../services/auth');
jest.mock('../services/habitos');
jest.mock('../services/metas');
jest.mock('../services/registros');

const SIN_RED = { ok: false as const, mensaje: 'No pudimos conectar. Revisa tu conexión e intenta de nuevo.' };

const USUARIO: Usuario = {
  id: 1,
  nombres: 'Ana',
  apellidos: null,
  correo: 'ana@correo.com',
  edad: 30,
  peso: 62.5,
  estatura: 1.7,
  rol: 'paciente',
};

const HABITO: Habito = {
  id: 7,
  categoriaHabitoId: 1,
  nombre: 'Beber agua',
  descripcion: null,
  unidadMedida: 'vasos',
  frecuencia: 'diaria',
  activo: true,
};

const simulado = <T extends (...args: never[]) => unknown>(fn: T) => fn as unknown as jest.Mock;

/** Configura qué responde "el servidor". */
function servidorConDatos() {
  simulado(authApi.obtenerPerfil).mockResolvedValue({ ok: true, datos: USUARIO });
  simulado(habitosApi.listarCategorias).mockResolvedValue({ ok: true, datos: [] });
  simulado(habitosApi.listarHabitos).mockResolvedValue({ ok: true, datos: [HABITO] });
  simulado(metasApi.listarMetas).mockResolvedValue({ ok: true, datos: [] });
  simulado(registrosApi.listarRegistros).mockResolvedValue({ ok: true, datos: [] });
}

function servidorSinRed() {
  for (const fn of [
    authApi.obtenerPerfil,
    habitosApi.listarCategorias,
    habitosApi.listarHabitos,
    metasApi.listarMetas,
    registrosApi.listarRegistros,
  ]) {
    simulado(fn).mockResolvedValue(SIN_RED);
  }
}

async function cacheConUnHabito() {
  await guardarColeccion('usuario', USUARIO);
  await guardarColeccion('categorias', []);
  await guardarColeccion('habitos', [{ ...HABITO, nombre: 'Beber agua (guardado)' }]);
  await guardarColeccion('metas', []);
  await guardarColeccion('registros', []);
  await guardarColeccion('sincronizado', '2026-10-25T21:10:00.000Z');
}

const abrirApp = () =>
  renderHook(() => useApp(), {
    wrapper: ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>,
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  simulado(leerToken).mockResolvedValue('token-guardado');
});

describe('Arranque de la app con sesión guardada', () => {
  test('arranque_conCacheYSinRed_muestraLosDatosGuardadosYMarcaSinConexion', async () => {
    await cacheConUnHabito();
    servidorSinRed();

    const { result } = abrirApp();

    await waitFor(() => expect(result.current.sinConexion).toBe(true));
    expect(result.current.estadoSesion).toBe('con-sesion');
    expect(result.current.habitos.map((h) => h.nombre)).toEqual(['Beber agua (guardado)']);
    expect(result.current.errorDatos).toBeNull(); // no se bloquea la app con la pantalla de error
    expect(result.current.cargandoDatos).toBe(false);
  });

  test('arranque_sinCacheYSinRed_muestraErrorConOpcionDeReintentar', async () => {
    servidorSinRed();

    const { result } = abrirApp();

    await waitFor(() => expect(result.current.errorDatos).not.toBeNull());
    expect(result.current.habitos).toEqual([]);
  });

  test('arranque_conRed_reemplazaLaCacheConLosDatosDelServidorYLosGuarda', async () => {
    await cacheConUnHabito();
    servidorConDatos();

    const { result } = abrirApp();

    await waitFor(() => expect(result.current.habitos[0]?.nombre).toBe('Beber agua'));
    expect(result.current.sinConexion).toBe(false);
    await waitFor(async () => {
      const guardado = await leerDominio();
      expect(guardado?.habitos[0]?.nombre).toBe('Beber agua');
      expect(guardado?.usuario.peso).toBeNull(); // el peso nunca va a AsyncStorage
    });
  });

  test('reintentarConexion_cuandoVuelveLaRed_quitaElAvisoDeSinConexion', async () => {
    await cacheConUnHabito();
    servidorSinRed();
    const { result } = abrirApp();
    await waitFor(() => expect(result.current.sinConexion).toBe(true));

    servidorConDatos();
    await act(() => result.current.reintentarConexion());

    expect(result.current.sinConexion).toBe(false);
    expect(result.current.habitos[0]?.nombre).toBe('Beber agua');
  });

  test('cerrarSesion_borraElTokenYLaCache', async () => {
    servidorConDatos();
    const { result } = abrirApp();
    await waitFor(() => expect(result.current.habitos).toHaveLength(1));

    await act(() => result.current.cerrarSesion());

    expect(result.current.estadoSesion).toBe('sin-sesion');
    expect(borrarToken).toHaveBeenCalled();
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });

  test('arranque_siElAlmacenSeguroFalla_vaAlLoginEnVezDeQuedarseCargando', async () => {
    simulado(leerToken).mockRejectedValue(new Error('Keystore no disponible'));

    const { result } = abrirApp();

    await waitFor(() => expect(result.current.estadoSesion).toBe('sin-sesion'));
  });

  test('cerrarSesion_aunqueFalleBorrarElToken_cierraLaSesionEnMemoria', async () => {
    servidorConDatos();
    const { result } = abrirApp();
    await waitFor(() => expect(result.current.habitos).toHaveLength(1));
    simulado(borrarToken).mockRejectedValueOnce(new Error('Keystore no disponible'));

    await act(() => result.current.cerrarSesion());

    expect(result.current.estadoSesion).toBe('sin-sesion');
    expect(result.current.habitos).toEqual([]);
  });

  test('arranque_sinTokenGuardado_vaAlLoginSinPedirDatos', async () => {
    simulado(leerToken).mockResolvedValue(null);

    const { result } = abrirApp();

    await waitFor(() => expect(result.current.estadoSesion).toBe('sin-sesion'));
    expect(authApi.obtenerPerfil).not.toHaveBeenCalled();
  });
});

describe('Sesión según el rol (ADR-011)', () => {
  const PROFESIONAL: Usuario = { ...USUARIO, id: 2, nombres: 'Laura', rol: 'profesional' };

  test('iniciarSesion_comoProfesional_noPideNiGuardaDatosDePaciente', async () => {
    simulado(leerToken).mockResolvedValue(null);
    simulado(authApi.iniciarSesion).mockResolvedValue({
      ok: true,
      datos: { token: 'token-profesional', usuario: PROFESIONAL },
    });
    const { result } = abrirApp();
    await waitFor(() => expect(result.current.estadoSesion).toBe('sin-sesion'));

    await act(async () => {
      await result.current.iniciarSesion('laura@centro.com', 'Segura123');
    });

    expect(result.current.estadoSesion).toBe('con-sesion');
    expect(result.current.usuario?.rol).toBe('profesional');
    expect(result.current.cargandoDatos).toBe(false);
    expect(habitosApi.listarHabitos).not.toHaveBeenCalled();
    expect(registrosApi.listarRegistros).not.toHaveBeenCalled();
    expect(await AsyncStorage.getAllKeys()).toEqual([]); // nada de pacientes en su teléfono
  });

  test('arranque_conTokenDeProfesional_restauraLaSesionSinCargarHabitos', async () => {
    simulado(authApi.obtenerPerfil).mockResolvedValue({ ok: true, datos: PROFESIONAL });

    const { result } = abrirApp();

    await waitFor(() => expect(result.current.usuario?.rol).toBe('profesional'));
    expect(result.current.cargandoDatos).toBe(false);
    expect(result.current.errorDatos).toBeNull();
    expect(habitosApi.listarHabitos).not.toHaveBeenCalled();
  });
});

describe('Edición (C-04)', () => {
  const META = { id: 3, habitoId: HABITO.id, valorObjetivo: 8, descripcion: '8 vasos', activa: true };
  const REGISTRO = {
    id: 9,
    habitoId: HABITO.id,
    fecha: '2026-10-26',
    valorRegistrado: 9,
    metaCumplida: true,
    notas: null,
  };

  async function sesionConDatos() {
    servidorConDatos();
    simulado(metasApi.listarMetas).mockResolvedValue({ ok: true, datos: [META] });
    simulado(registrosApi.listarRegistros).mockResolvedValue({ ok: true, datos: [REGISTRO] });
    const app = abrirApp();
    await waitFor(() => expect(app.result.current.registros).toHaveLength(1));
    return app;
  }

  test('editarRegistro_usaLaDecisionDelServidorSobreLaMeta', async () => {
    const { result } = await sesionConDatos();
    simulado(registrosApi.editarRegistro).mockResolvedValue({
      ok: true,
      datos: { ...REGISTRO, valorRegistrado: 5, metaCumplida: false },
    });

    let respuesta = { ok: false } as { ok: boolean; mensaje?: string };
    await act(async () => {
      respuesta = await result.current.editarRegistro(REGISTRO.id, { valorRegistrado: 5, notas: '' });
    });

    expect(respuesta).toEqual({ ok: true, mensaje: 'Registro actualizado.' });
    expect(result.current.registros[0]).toMatchObject({ valorRegistrado: 5, metaCumplida: false });
  });

  test('eliminarMeta_quitaLaMetaDeLaLista', async () => {
    const { result } = await sesionConDatos();
    simulado(metasApi.eliminarMeta).mockResolvedValue({ ok: true, datos: undefined });

    await act(async () => {
      await result.current.eliminarMeta(META.id);
    });

    expect(result.current.metas).toEqual([]);
  });

  test('editarHabito_conErrorDelServidor_devuelveSuMensajeSinCambiarNada', async () => {
    const { result } = await sesionConDatos();
    simulado(habitosApi.editarHabito).mockResolvedValue({
      ok: false,
      mensaje: 'El nombre debe tener entre 2 y 100 caracteres.',
      status: 400,
    });

    let respuesta = { ok: true } as { ok: boolean; mensaje?: string };
    await act(async () => {
      respuesta = await result.current.editarHabito(HABITO.id, {
        nombre: 'A',
        descripcion: '',
        unidadMedida: 'vasos',
      });
    });

    expect(respuesta).toEqual({ ok: false, mensaje: 'El nombre debe tener entre 2 y 100 caracteres.' });
    expect(result.current.habitos[0].nombre).toBe('Beber agua');
  });
});

describe('Registro sin conexión (S-06)', () => {
  const DATOS = { habitoId: HABITO.id, fecha: '2026-10-26', valorRegistrado: 9 };
  const CREADO = { id: 50, ...DATOS, metaCumplida: true, notas: null };

  async function sesionConDatos() {
    servidorConDatos();
    simulado(registrosApi.nuevoClienteId).mockReturnValue('cliente-1');
    const app = abrirApp();
    await waitFor(() => expect(app.result.current.habitos).toHaveLength(1));
    return app;
  }

  async function registrarSinRed(result: { current: ReturnType<typeof useApp> }) {
    simulado(registrosApi.crearRegistro).mockResolvedValue(SIN_RED);
    let respuesta = { ok: false } as { ok: boolean; mensaje?: string; pendiente?: boolean };
    await act(async () => {
      respuesta = await result.current.crearRegistro(DATOS);
    });
    return respuesta;
  }

  test('crearRegistro_sinRed_loDejaPendienteYGuardadoEnElDispositivo', async () => {
    const { result } = await sesionConDatos();

    const respuesta = await registrarSinRed(result);

    expect(respuesta).toMatchObject({ ok: true, pendiente: true });
    expect(result.current.pendientes).toEqual([{ ...DATOS, clienteId: 'cliente-1' }]);
    expect(result.current.sinConexion).toBe(true);
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('hst:v1:pendientes')).toContain('cliente-1'),
    );
  });

  test('crearRegistro_conErrorDeNegocio_noLoEncola', async () => {
    const { result } = await sesionConDatos();
    simulado(registrosApi.crearRegistro).mockResolvedValue({
      ok: false,
      mensaje: 'No se puede registrar una fecha futura.',
      status: 422,
    });

    let respuesta = { ok: true } as { ok: boolean; mensaje?: string };
    await act(async () => {
      respuesta = await result.current.crearRegistro(DATOS);
    });

    expect(respuesta).toEqual({ ok: false, mensaje: 'No se puede registrar una fecha futura.' });
    expect(result.current.pendientes).toEqual([]);
  });

  test('reintentarConexion_conRed_subeElPendienteConElMismoClienteId', async () => {
    const { result } = await sesionConDatos();
    await registrarSinRed(result);
    simulado(registrosApi.crearRegistro).mockResolvedValue({ ok: true, datos: CREADO });

    await act(() => result.current.reintentarConexion());

    await waitFor(() => expect(result.current.pendientes).toEqual([]));
    expect(registrosApi.crearRegistro).toHaveBeenLastCalledWith(DATOS, 'cliente-1');
    expect(result.current.registros).toContainEqual(CREADO);
    expect(result.current.sinConexion).toBe(false);
  });

  test('reenvio_conRegistroYaExistente409_descartaElPendienteYAvisa', async () => {
    const { result } = await sesionConDatos();
    await registrarSinRed(result);
    simulado(registrosApi.crearRegistro).mockResolvedValue({
      ok: false,
      mensaje: 'Ya existe un registro para este hábito en la fecha indicada.',
      code: 'DUPLICATE_DAILY_LOG',
      status: 409,
    });

    await act(() => result.current.reintentarConexion());

    await waitFor(() => expect(result.current.pendientes).toEqual([]));
    expect(result.current.avisoPendientes).toBe(
      'Ya existía un registro sincronizado para este hábito en esa fecha. Se mantuvo el registro del servidor.',
    );
  });

  test('crearRegistro_sinRedDosVecesElMismoDia_noDuplicaElPendiente', async () => {
    const { result } = await sesionConDatos();
    await registrarSinRed(result);

    const segunda = await registrarSinRed(result);

    expect(segunda.ok).toBe(false);
    expect(result.current.pendientes).toHaveLength(1);
  });

  test('cerrarSesion_conPendientes_borraLaCola', async () => {
    const { result } = await sesionConDatos();
    await registrarSinRed(result);

    await act(() => result.current.cerrarSesion());

    expect(result.current.pendientes).toEqual([]);
    expect(await AsyncStorage.getItem('hst:v1:pendientes')).toBeNull();
  });
});
