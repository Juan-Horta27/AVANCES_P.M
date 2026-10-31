import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CLAVE_PENDIENTES,
  RegistroPendiente,
  borrarPendientes,
  guardarPendientes,
  leerPendientes,
} from './pendientes';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const PENDIENTE: RegistroPendiente = {
  habitoId: 7,
  fecha: '2026-11-03',
  valorRegistrado: 9,
  clienteId: '11111111-1111-4111-8111-111111111111',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('Cola de registros pendientes (S-06)', () => {
  test('guardarYLeer_delMismoUsuario_devuelveLaCola', async () => {
    await guardarPendientes(1, [PENDIENTE]);

    expect(await leerPendientes(1)).toEqual([PENDIENTE]);
  });

  test('leer_deOtroUsuario_noLaEntregaYLaBorra', async () => {
    await guardarPendientes(1, [PENDIENTE]);

    expect(await leerPendientes(2)).toEqual([]);
    expect(await AsyncStorage.getItem(CLAVE_PENDIENTES)).toBeNull();
  });

  test('leer_conColaCorrupta_devuelveVaciaYLaBorra', async () => {
    await AsyncStorage.setItem(CLAVE_PENDIENTES, '{no es json');

    expect(await leerPendientes(1)).toEqual([]);
    expect(await AsyncStorage.getItem(CLAVE_PENDIENTES)).toBeNull();
  });

  test('guardar_listaVacia_quitaLaClave', async () => {
    await guardarPendientes(1, [PENDIENTE]);

    await guardarPendientes(1, []);

    expect(await AsyncStorage.getItem(CLAVE_PENDIENTES)).toBeNull();
  });

  test('borrarPendientes_alCerrarSesion_quitaLaCola', async () => {
    await guardarPendientes(1, [PENDIENTE]);

    await borrarPendientes();

    expect(await leerPendientes(1)).toEqual([]);
  });

  test('laCola_noGuardaDatosDelPerfil', async () => {
    await guardarPendientes(1, [PENDIENTE]);

    const texto = (await AsyncStorage.getItem(CLAVE_PENDIENTES)) ?? '';
    expect(texto).not.toMatch(/peso|estatura|edad|correo/);
  });
});
