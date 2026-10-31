import type { CategoriaHabito, Habito, Meta } from '@prisma/client';

import { MetaRespuesta, aMetaRespuesta } from '../metas/meta-respuesta';
import type { Racha } from '../registros/racha';

/**
 * Hábito para listas y tarjetas (`HabitoSummary` de api-contract.md §8.3), más `descripcion`
 * y `rachaMaxima`, que la app ya muestra en sus tarjetas (añadirlos no rompe el contrato, §9.2).
 */
export interface HabitoRespuesta {
  id: number;
  categoriaHabitoId: number;
  nombre: string;
  descripcion: string | null;
  unidadMedida: string;
  frecuencia: string;
  activo: boolean;
  rachaActual: number;
  rachaMaxima: number;
  metaActiva: MetaRespuesta | null;
}

/** Detalle de un hábito (`HabitoDetail`): lo anterior, más categoría, historial de metas y fechas. */
export interface HabitoDetalle extends HabitoRespuesta {
  categoria: { id: number; nombre: string; icono: string | null };
  metas: MetaRespuesta[];
  createdAt: Date;
  updatedAt: Date;
}

export type HabitoConMetas = Habito & { metas: Meta[] };

export function aHabitoRespuesta(
  habito: HabitoConMetas,
  racha: Racha,
): HabitoRespuesta {
  const metaActiva = habito.metas.find((meta) => meta.activa);
  return {
    id: habito.id,
    categoriaHabitoId: habito.categoriaHabitoId,
    nombre: habito.nombre,
    descripcion: habito.descripcion,
    unidadMedida: habito.unidadMedida,
    frecuencia: habito.frecuencia,
    activo: habito.activo,
    rachaActual: racha.rachaActual,
    rachaMaxima: racha.rachaMaxima,
    metaActiva: metaActiva ? aMetaRespuesta(metaActiva) : null,
  };
}

export function aHabitoDetalle(
  habito: HabitoConMetas & { categoria: CategoriaHabito },
  racha: Racha,
): HabitoDetalle {
  return {
    ...aHabitoRespuesta(habito, racha),
    categoria: {
      id: habito.categoria.id,
      nombre: habito.categoria.nombre,
      icono: habito.categoria.icono,
    },
    metas: habito.metas.map(aMetaRespuesta),
    createdAt: habito.createdAt,
    updatedAt: habito.updatedAt,
  };
}
