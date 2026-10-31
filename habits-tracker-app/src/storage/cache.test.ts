import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Usuario } from '../types';
import {
  Dominio,
  descartarVersionesAnteriores,
  guardarColeccion,
  leerDominio,
  limpiarCache,
} from './cache';

// AsyncStorage se reemplaza por su simulación oficial en memoria.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

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

const DOMINIO: Dominio = {
  usuario: USUARIO,
  categorias: [{ id: 1, nombre: 'Hidratación', icono: '💧' }],
  habitos: [
    {
      id: 1,
      categoriaHabitoId: 1,
      nombre: 'Beber agua',
      descripcion: null,
      unidadMedida: 'vasos',
      frecuencia: 'diaria',
      activo: true,
    },
  ],
  metas: [{ id: 1, habitoId: 1, valorObjetivo: 8, descripcion: null, activa: true }],
  registros: [
    { id: 1, habitoId: 1, fecha: '2026-10-25', valorRegistrado: 9, metaCumplida: true, notas: null },
  ],
  sincronizado: '2026-10-25T21:10:00.000Z',
};

async function guardarTodo(dominio: Dominio): Promise<void> {
  await guardarColeccion('usuario', dominio.usuario);
  await guardarColeccion('categorias', dominio.categorias);
  await guardarColeccion('habitos', dominio.habitos);
  await guardarColeccion('metas', dominio.metas);
  await guardarColeccion('registros', dominio.registros);
  await guardarColeccion('sincronizado', dominio.sincronizado);
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('caché del dominio', () => {
  test('leerDominio_despuesDeGuardarTodo_devuelveLasColecciones', async () => {
    await guardarTodo(DOMINIO);

    const leido = await leerDominio();

    expect(leido).toMatchObject({
      habitos: DOMINIO.habitos,
      metas: DOMINIO.metas,
      registros: DOMINIO.registros,
      sincronizado: DOMINIO.sincronizado,
    });
  });

  test('guardarColeccion_delUsuario_noGuardaDatosDeSalud', async () => {
    await guardarColeccion('usuario', USUARIO);

    const guardado = JSON.parse((await AsyncStorage.getItem('hst:v1:usuario')) as string);

    expect(guardado).toEqual({ ...USUARIO, edad: null, peso: null, estatura: null });
  });

  test('leerDominio_conAlgunaColeccionFaltante_devuelveNull', async () => {
    await guardarTodo(DOMINIO);
    await AsyncStorage.removeItem('hst:v1:metas');

    expect(await leerDominio()).toBeNull();
  });

  test('leerDominio_conContenidoCorrupto_devuelveNullYLimpiaLaCache', async () => {
    await guardarTodo(DOMINIO);
    await AsyncStorage.setItem('hst:v1:registros', '{esto no es json');

    expect(await leerDominio()).toBeNull();
    expect(await AsyncStorage.getItem('hst:v1:habitos')).toBeNull();
  });

  test('limpiarCache_borraSoloLasClavesDeLaApp', async () => {
    await guardarTodo(DOMINIO);
    await AsyncStorage.setItem('otra-app:dato', 'se conserva');

    await limpiarCache();

    expect(await AsyncStorage.getAllKeys()).toEqual(['otra-app:dato']);
  });

  test('descartarVersionesAnteriores_borraClavesDeOtraVersionYConservaLaActual', async () => {
    await AsyncStorage.setItem('hst:v0:registros', '[]');
    await guardarColeccion('habitos', DOMINIO.habitos);

    await descartarVersionesAnteriores();

    expect(await AsyncStorage.getAllKeys()).toEqual(['hst:v1:habitos']);
  });
});
