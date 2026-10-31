// Datos de ejemplo para la version inicial de la app.
// Cuando se conecte el backend, este archivo se reemplaza por llamadas a la API.

import type {
  CategoriaHabito,
  Habito,
  Meta,
  RegistroDiario,
  Usuario,
} from '../types';
import { hoyISO, sumarDias } from '../utils/date';

export const usuarioDemo: Usuario = {
  id: 1,
  nombres: 'Juan Jose',
  apellidos: 'Horta Vanegas',
  correo: 'juan@correo.com',
  edad: 22,
  peso: 70,
  estatura: 1.75,
};

export const categorias: CategoriaHabito[] = [
  { id: 1, nombre: 'Hidratacion', icono: '💧' },
  { id: 2, nombre: 'Ejercicio', icono: '🏃' },
  { id: 3, nombre: 'Alimentacion', icono: '🥗' },
  { id: 4, nombre: 'Sueno', icono: '😴' },
  { id: 5, nombre: 'Meditacion', icono: '🧘' },
];

export const habitos: Habito[] = [
  {
    id: 1,
    usuarioId: 1,
    categoriaHabitoId: 1,
    nombre: 'Beber agua',
    descripcion: 'Mantener la hidratacion durante el dia',
    unidadMedida: 'vasos',
    frecuencia: 'diaria',
    activo: true,
  },
  {
    id: 2,
    usuarioId: 1,
    categoriaHabitoId: 2,
    nombre: 'Caminar',
    descripcion: 'Caminata ligera al aire libre',
    unidadMedida: 'minutos',
    frecuencia: 'diaria',
    activo: true,
  },
  {
    id: 3,
    usuarioId: 1,
    categoriaHabitoId: 4,
    nombre: 'Dormir bien',
    descripcion: 'Descanso nocturno completo',
    unidadMedida: 'horas',
    frecuencia: 'diaria',
    activo: true,
  },
  {
    id: 4,
    usuarioId: 1,
    categoriaHabitoId: 5,
    nombre: 'Meditar',
    unidadMedida: 'minutos',
    frecuencia: 'diaria',
    activo: true,
  },
];

export const metas: Meta[] = [
  { id: 1, habitoId: 1, valorObjetivo: 8, descripcion: '8 vasos de agua al dia', activa: true },
  { id: 2, habitoId: 2, valorObjetivo: 30, descripcion: '30 minutos de caminata', activa: true },
  { id: 3, habitoId: 3, valorObjetivo: 7, descripcion: '7 horas de sueno', activa: true },
  { id: 4, habitoId: 4, valorObjetivo: 10, descripcion: '10 minutos de meditacion', activa: false },
];

/**
 * Genera registros de los ultimos dias para que el dashboard y las rachas
 * tengan contenido desde el primer arranque.
 * Cada tupla es [dias hacia atras, habitoId, valor].
 */
const SEMILLA: Array<[number, number, number]> = [
  [0, 1, 8], [0, 2, 35],
  [1, 1, 9], [1, 2, 30], [1, 3, 7],
  [2, 1, 6], [2, 2, 40], [2, 3, 8],
  [3, 1, 8], [3, 3, 6],
  [4, 1, 10], [4, 2, 25], [4, 3, 7],
  [5, 1, 4],
  [6, 1, 8], [6, 2, 45], [6, 3, 8],
];

function construirRegistros(): RegistroDiario[] {
  const hoy = hoyISO();

  return SEMILLA.map(([diasAtras, habitoId, valor], indice) => {
    const meta = metas.find((m) => m.habitoId === habitoId && m.activa);
    return {
      id: indice + 1,
      habitoId,
      fecha: sumarDias(hoy, -diasAtras),
      valorRegistrado: valor,
      metaCumplida: meta ? valor >= meta.valorObjetivo : false,
      notas: undefined,
    };
  });
}

export const registros: RegistroDiario[] = construirRegistros();
