import { ValidationOptions, registerDecorator } from 'class-validator';

import { esFechaISOValida } from '../fechas';

/**
 * Valida que el campo sea un día real en formato 'YYYY-MM-DD' (ADR-003). Un patrón con
 * expresión regular solo no basta: aceptaría '2026-02-30'.
 */
export function EsFechaISO(opciones?: ValidationOptions): PropertyDecorator {
  return (objeto: object, propiedad: string | symbol) => {
    registerDecorator({
      name: 'esFechaISO',
      target: objeto.constructor,
      propertyName: String(propiedad),
      options: opciones,
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' && esFechaISOValida(valor),
      },
    });
  };
}
