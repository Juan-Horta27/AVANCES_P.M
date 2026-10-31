import type { Meta } from '../types';
import { Resultado, apiFetch } from './api';

/** Datos para crear una meta (POST /metas). */
export interface DatosNuevaMeta {
  habitoId: number;
  valorObjetivo: number;
  descripcion: string;
}

export function listarMetas(): Promise<Resultado<Meta[]>> {
  return apiFetch<Meta[]>('/metas');
}

export function crearMeta(datos: DatosNuevaMeta): Promise<Resultado<Meta>> {
  return apiFetch<Meta>('/metas', { metodo: 'POST', cuerpo: datos });
}

/** Cambios del valor objetivo o la descripción (PATCH /metas/:id); una descripción vacía se borra. */
export interface CambiosMeta {
  valorObjetivo: number;
  descripcion: string;
}

export function editarMeta(id: number, cambios: CambiosMeta): Promise<Resultado<Meta>> {
  return apiFetch<Meta>(`/metas/${id}`, { metodo: 'PATCH', cuerpo: cambios });
}

/** Elimina la meta; los registros ya evaluados conservan su resultado (DELETE /metas/:id). */
export function eliminarMeta(id: number): Promise<Resultado<void>> {
  return apiFetch<void>(`/metas/${id}`, { metodo: 'DELETE' });
}

/** Activa o desactiva; el servidor rechaza tener dos metas activas en el mismo hábito. */
export function cambiarEstadoMeta(id: number, activa: boolean): Promise<Resultado<Meta>> {
  return apiFetch<Meta>(`/metas/${id}`, { metodo: 'PATCH', cuerpo: { activa } });
}
