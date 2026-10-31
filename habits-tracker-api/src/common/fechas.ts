// Fechas de calendario (ADR-003): en el API viajan como texto 'YYYY-MM-DD', sin hora ni zona.
// PostgreSQL las guarda como DATE y Prisma las entrega como Date a medianoche UTC; estas
// funciones son el único lugar donde se convierte entre ambas formas.

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** true si el texto tiene la forma YYYY-MM-DD y es un día que existe (rechaza 2026-02-30). */
export function esFechaISOValida(texto: string): boolean {
  if (!FORMATO_ISO.test(texto)) return false;
  return aTextoISO(aFechaBD(texto)) === texto;
}

/** 'YYYY-MM-DD' → Date a medianoche UTC, que es como Prisma escribe una columna DATE. */
export function aFechaBD(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Date de una columna DATE → 'YYYY-MM-DD'. */
export function aTextoISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Diferencia en días entre dos fechas ISO (a - b). */
export function diferenciaDias(a: string, b: string): number {
  return Math.round(
    (aFechaBD(a).getTime() - aFechaBD(b).getTime()) / MS_POR_DIA,
  );
}

/**
 * "Hoy" en la zona horaria del centro de bienestar, no en la del servidor: un contenedor
 * corre en UTC, y a las 20:00 de Colombia en UTC ya es el día siguiente.
 */
export function hoyEnZona(
  zonaHoraria: string,
  ahora: Date = new Date(),
): string {
  // El formato en-CA produce exactamente YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}
