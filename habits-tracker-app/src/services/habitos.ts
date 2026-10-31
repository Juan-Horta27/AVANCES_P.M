import type { CategoriaHabito, Habito } from '../types';
import { Resultado, apiFetch } from './api';

/** Datos para crear un hábito (POST /habitos). */
export interface DatosNuevoHabito {
  nombre: string;
  descripcion?: string;
  categoriaHabitoId: number;
  unidadMedida: string;
}

/** Catálogo de categorías del centro (GET /categorias). */
export function listarCategorias(): Promise<Resultado<CategoriaHabito[]>> {
  return apiFetch<CategoriaHabito[]>('/categorias');
}

/**
 * Todos los hábitos, también los archivados (`activos=false`): el historial y la lista de
 * registros necesitan sus nombres aunque ya no se muestren en las demás pantallas.
 */
export async function listarHabitos(): Promise<Resultado<Habito[]>> {
  const resultado = await apiFetch<Habito[]>('/habitos?activos=false');
  return resultado.ok ? { ok: true, datos: resultado.datos.map(aHabito) } : resultado;
}

export async function crearHabito(datos: DatosNuevoHabito): Promise<Resultado<Habito>> {
  const resultado = await apiFetch<Habito>('/habitos', { metodo: 'POST', cuerpo: datos });
  return resultado.ok ? { ok: true, datos: aHabito(resultado.datos) } : resultado;
}

/** Cambios de un hábito (PUT /habitos/:id). La categoría no se edita; una descripción vacía se borra. */
export interface CambiosHabito {
  nombre: string;
  descripcion: string;
  unidadMedida: string;
}

export async function editarHabito(
  id: number,
  cambios: CambiosHabito,
): Promise<Resultado<Habito>> {
  const resultado = await apiFetch<Habito>(`/habitos/${id}`, { metodo: 'PUT', cuerpo: cambios });
  return resultado.ok ? { ok: true, datos: aHabito(resultado.datos) } : resultado;
}

/** Borra el hábito, o lo archiva si tiene registros (lo decide el servidor, ADR-008 D-10). */
export function eliminarHabito(id: number): Promise<Resultado<void>> {
  return apiFetch<void>(`/habitos/${id}`, { metodo: 'DELETE' });
}

/**
 * Se copian solo los campos del dominio del cliente: el API también envía racha y meta activa,
 * pero la app las deriva de los registros y metas que ya tiene (cliente tolerante, §9.1).
 */
function aHabito(habito: Habito): Habito {
  return {
    id: habito.id,
    categoriaHabitoId: habito.categoriaHabitoId,
    nombre: habito.nombre,
    descripcion: habito.descripcion,
    unidadMedida: habito.unidadMedida,
    frecuencia: habito.frecuencia,
    activo: habito.activo,
  };
}
