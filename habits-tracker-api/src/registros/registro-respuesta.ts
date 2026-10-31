import type { RegistroDiario } from '@prisma/client';

import { aTextoISO } from '../common/fechas';

/** Forma de un registro diario en las respuestas del API (api-contract.md E-11). */
export interface RegistroRespuesta {
  id: number;
  habitoId: number;
  fecha: string;
  valorRegistrado: number;
  metaCumplida: boolean;
  notas: string | null;
}

/** Página de GET /registros (api-contract.md E-12). */
export interface PaginaDeRegistros {
  items: RegistroRespuesta[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export function aRegistroRespuesta(
  registro: RegistroDiario,
): RegistroRespuesta {
  return {
    id: registro.id,
    habitoId: registro.habitoId,
    fecha: aTextoISO(registro.fecha),
    valorRegistrado: registro.valorRegistrado.toNumber(),
    metaCumplida: registro.metaCumplida,
    notas: registro.notas,
  };
}
