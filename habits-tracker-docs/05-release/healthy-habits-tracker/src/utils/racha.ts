import type { Racha, RegistroDiario } from '../types';
import { diferenciaDias, hoyISO } from './date';

/**
 * Calcula la racha actual y la maxima de un habito.
 *
 * - rachaActual: dias consecutivos cumplidos que llegan hasta hoy (o ayer, para
 *   no castigar al usuario que aun no ha registrado el dia en curso).
 * - rachaMaxima: el tramo consecutivo mas largo de toda la historia.
 *
 * Nota: cuando un tramo se corta, la racha actual queda congelada. Los tramos
 * anteriores solo pueden mejorar la racha maxima, nunca la actual.
 */
export function calcularRacha(habitoId: number, registros: RegistroDiario[]): Racha {
  const cumplidos = registros
    .filter((r) => r.habitoId === habitoId && r.metaCumplida)
    .map((r) => r.fecha)
    .sort()
    .reverse(); // de la fecha mas reciente a la mas antigua

  if (cumplidos.length === 0) {
    return { habitoId, rachaActual: 0, rachaMaxima: 0 };
  }

  const hoy = hoyISO();
  let rachaActual = 0;
  let rachaMaxima = 0;
  let tramo = 0;
  let vigente = true; // ¿el tramo que recorremos sigue conectado con hoy?
  let anterior: string | null = null;

  for (const fecha of cumplidos) {
    if (anterior === null) {
      // Primer registro: solo cuenta como racha viva si es de hoy o de ayer.
      const distancia = diferenciaDias(hoy, fecha);
      vigente = distancia === 0 || distancia === 1;
      tramo = 1;
    } else if (diferenciaDias(anterior, fecha) === 1) {
      tramo += 1;
    } else {
      // Se rompio la continuidad: cerramos el tramo y dejamos de ser vigentes.
      rachaMaxima = Math.max(rachaMaxima, tramo);
      if (vigente) rachaActual = tramo;
      vigente = false;
      tramo = 1;
    }
    anterior = fecha;
  }

  rachaMaxima = Math.max(rachaMaxima, tramo);
  if (vigente) rachaActual = tramo;

  return { habitoId, rachaActual, rachaMaxima };
}
