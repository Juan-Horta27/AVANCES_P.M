// Utilidades de fecha.
// Regla del proyecto: las fechas de registro se manejan SIEMPRE como texto
// 'YYYY-MM-DD' en hora local. Asi se evita el desfase de un dia que aparece
// al mezclar fechas UTC con comparaciones en hora local.

const DIAS_CORTOS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Convierte un Date a 'YYYY-MM-DD' usando los componentes locales. */
export function aISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Convierte 'YYYY-MM-DD' a un Date local (a medianoche). */
export function aDate(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/** Fecha de hoy en formato 'YYYY-MM-DD'. */
export function hoyISO(): string {
  return aISO(new Date());
}

/** Suma (o resta, con numeros negativos) dias a una fecha ISO. */
export function sumarDias(iso: string, dias: number): string {
  const fecha = aDate(iso);
  fecha.setDate(fecha.getDate() + dias);
  return aISO(fecha);
}

/** Diferencia en dias completos entre dos fechas ISO (a - b). */
export function diferenciaDias(a: string, b: string): number {
  const ms = aDate(a).getTime() - aDate(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Lunes de la semana a la que pertenece la fecha dada. */
export function inicioDeSemana(iso: string = hoyISO()): string {
  const fecha = aDate(iso);
  const diaSemana = fecha.getDay(); // 0 = domingo
  return sumarDias(iso, -((diaSemana + 6) % 7));
}

/** Las 7 fechas ISO de la semana (lunes a domingo) que contiene la fecha dada. */
export function semanaDe(iso: string = hoyISO()): string[] {
  const lunes = inicioDeSemana(iso);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/** Etiqueta corta del dia: 'Lun', 'Mar', ... */
export function diaCorto(iso: string): string {
  const diaSemana = aDate(iso).getDay();
  return DIAS_CORTOS[(diaSemana + 6) % 7];
}

/** Texto legible: '6 de septiembre de 2026'. */
export function fechaLarga(iso: string): string {
  const fecha = aDate(iso);
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()].toLowerCase()} de ${fecha.getFullYear()}`;
}

/** Texto compacto: '06 sep'. */
export function fechaCorta(iso: string): string {
  const fecha = aDate(iso);
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${dia} ${MESES[fecha.getMonth()].slice(0, 3).toLowerCase()}`;
}

/** Nombre del mes a partir de su indice 0-11. */
export function nombreMes(indice: number): string {
  return MESES[indice];
}

export { MESES };
