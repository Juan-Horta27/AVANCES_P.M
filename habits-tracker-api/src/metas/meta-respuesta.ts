import type { Meta } from '@prisma/client';

/** Forma de una meta en las respuestas del API. */
export interface MetaRespuesta {
  id: number;
  habitoId: number;
  valorObjetivo: number;
  descripcion: string | null;
  activa: boolean;
}

/** Prisma entrega `numeric` como Decimal; en JSON viaja como número (api-contract.md). */
export function aMetaRespuesta(meta: Meta): MetaRespuesta {
  return {
    id: meta.id,
    habitoId: meta.habitoId,
    valorObjetivo: meta.valorObjetivo.toNumber(),
    descripcion: meta.descripcion,
    activa: meta.activa,
  };
}
