/**
 * Mayor valor que cabe en las columnas numeric(8,2) (valor_objetivo, valor_registrado).
 * Validarlo en el DTO da un 400 claro en lugar de un error de la base de datos.
 */
export const VALOR_MAXIMO = 999999.99;
