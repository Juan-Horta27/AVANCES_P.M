import type { TransformFnParams } from 'class-transformer';

// Transformaciones que los DTO aplican antes de validar (con @Transform).

/** Quita espacios al inicio y al final; deja intactos los valores que no son texto. */
export function recortar({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Como `recortar`, pero un texto vacío se trata como "no enviado". */
export function recortarOpcional(params: TransformFnParams): unknown {
  const valor = recortar(params);
  return valor === '' ? undefined : valor;
}

/**
 * Para editar: un texto vacío significa "borrar el valor" (null); un campo ausente no cambia
 * nada. Así la persona puede quitar unas notas que ya no quiere.
 */
export function recortarONulo(params: TransformFnParams): unknown {
  const valor = recortar(params);
  return valor === '' ? null : valor;
}

/** El correo se guarda y se compara recortado y en minúsculas (api-contract.md E-01). */
export function normalizarCorreo({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/**
 * Los parámetros de consulta llegan como texto: "true"/"1" y "false"/"0" pasan a booleano;
 * cualquier otro valor se deja tal cual para que la validación lo rechace.
 */
export function aBooleano({ value }: TransformFnParams): unknown {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}

/** Los parámetros de consulta numéricos llegan como texto: "5" pasa a 5. */
export function aEntero({ value }: TransformFnParams): unknown {
  return typeof value === 'string' && /^\d+$/.test(value)
    ? Number(value)
    : value;
}
