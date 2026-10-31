import { hoyISO, sumarDias } from './date';

/** Rango de fechas cerrado [inicio, fin] en formato YYYY-MM-DD (ADR-003). */
export interface Rango {
  inicio: string;
  fin: string;
}

export type RangoPredefinido = 'semana' | 'treintaDias' | 'mes';

/**
 * Atajos del panel del profesional: los últimos 7 días, los últimos 30 días o el mes en curso,
 * siempre terminando hoy (no hay registros futuros que consultar).
 */
export function rangoPredefinido(tipo: RangoPredefinido, hoy: string = hoyISO()): Rango {
  switch (tipo) {
    case 'semana':
      return { inicio: sumarDias(hoy, -6), fin: hoy };
    case 'treintaDias':
      return { inicio: sumarDias(hoy, -29), fin: hoy };
    case 'mes':
      return { inicio: `${hoy.slice(0, 8)}01`, fin: hoy };
  }
}

/**
 * Mueve un extremo del rango `dias` días sin romperlo: el inicio nunca pasa del fin y el fin
 * nunca pasa de hoy. Si el movimiento no es posible, devuelve el rango sin cambios.
 */
export function moverExtremo(
  rango: Rango,
  extremo: keyof Rango,
  dias: number,
  hoy: string = hoyISO(),
): Rango {
  const nuevo = { ...rango, [extremo]: sumarDias(rango[extremo], dias) };
  const valido = nuevo.inicio <= nuevo.fin && nuevo.fin <= hoy;
  return valido ? nuevo : rango;
}
