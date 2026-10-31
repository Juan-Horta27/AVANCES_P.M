import { diferenciaDias } from '../common/fechas';

export interface Racha {
  rachaActual: number;
  rachaMaxima: number;
}

/**
 * Racha de un hábito a partir de las fechas de sus registros con la meta cumplida
 * (ADR-008, D-19). Es el mismo algoritmo que `src/utils/racha.ts` de la app, para que
 * cliente y servidor den siempre el mismo número:
 *
 * - rachaActual: días consecutivos que llegan hasta hoy o hasta ayer (no se castiga a
 *   quien aún no registra el día en curso).
 * - rachaMaxima: el tramo consecutivo más largo de toda la historia.
 */
export function calcularRacha(fechasCumplidas: string[], hoy: string): Racha {
  const fechas = [...fechasCumplidas].sort().reverse(); // de la más reciente a la más antigua
  if (fechas.length === 0) return { rachaActual: 0, rachaMaxima: 0 };

  let rachaActual = 0;
  let rachaMaxima = 0;
  let tramo = 0;
  let vigente = true; // ¿el tramo que se recorre sigue conectado con hoy?
  let anterior: string | null = null;

  for (const fecha of fechas) {
    if (anterior === null) {
      const distancia = diferenciaDias(hoy, fecha);
      vigente = distancia === 0 || distancia === 1;
      tramo = 1;
    } else if (diferenciaDias(anterior, fecha) === 1) {
      tramo += 1;
    } else {
      rachaMaxima = Math.max(rachaMaxima, tramo);
      if (vigente) rachaActual = tramo;
      vigente = false;
      tramo = 1;
    }
    anterior = fecha;
  }

  rachaMaxima = Math.max(rachaMaxima, tramo);
  if (vigente) rachaActual = tramo;
  return { rachaActual, rachaMaxima };
}
