/**
 * Convierte lo que la persona escribe en un campo numérico. El teclado numérico en español
 * escribe la coma decimal ("8,5"), que Number() no entiende: aquí se acepta coma o punto.
 * Devuelve null si el texto no es un número.
 */
export function aNumero(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.');
  if (normalizado === '') return null;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}
