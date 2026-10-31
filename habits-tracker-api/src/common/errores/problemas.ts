import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ProblemaException } from './problema.exception';

// Fábricas de los errores de negocio del contrato (api-contract.md §2.2 y §3).
// Cada servicio indica solo el código estable y el texto literal; el título y el estado
// HTTP salen de la categoría del error, y así no pueden quedar inconsistentes.

/** 403: el recurso existe pero es de otra persona. */
export function prohibido(detail: string): ProblemaException {
  return new ProblemaException({
    title: 'Acceso prohibido',
    status: HttpStatus.FORBIDDEN,
    code: 'FORBIDDEN_RESOURCE',
    detail,
  });
}

/** 400: la petición se entendió pero no trae datos utilizables (p. ej. un cuerpo vacío al editar). */
export function datosInvalidos(detail: string): ProblemaException {
  return new ProblemaException({
    title: 'Error de validación',
    status: HttpStatus.BAD_REQUEST,
    code: 'VALIDATION_FAILED',
    detail,
  });
}

/** 403: el rol del usuario no tiene permiso sobre esta ruta (ADR-011). */
export function rolNoPermitido(): ProblemaException {
  return new ProblemaException({
    title: 'Acceso prohibido',
    status: HttpStatus.FORBIDDEN,
    code: 'FORBIDDEN_ROLE',
    detail: 'No tienes permiso para realizar esta acción con tu rol.',
  });
}

/** 404: el recurso no existe (o, en algunos endpoints, no se revela que exista). */
export function noEncontrado(code: string, detail: string): ProblemaException {
  return new ProblemaException({
    title: 'No encontrado',
    status: HttpStatus.NOT_FOUND,
    code,
    detail,
  });
}

/** 409: choca con el estado actual (duplicados, meta activa existente...). */
export function conflicto(code: string, detail: string): ProblemaException {
  return new ProblemaException({
    title: 'Conflicto con el estado actual',
    status: HttpStatus.CONFLICT,
    code,
    detail,
  });
}

/** 422: la petición está bien formada, pero una regla del dominio la prohíbe. */
export function reglaDeNegocio(detail: string): ProblemaException {
  return new ProblemaException({
    title: 'Regla de negocio violada',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    code: 'BUSINESS_RULE_VIOLATION',
    detail,
  });
}

/**
 * true si Prisma rechazó la operación por una restricción UNIQUE (código P2002).
 * Con `campo` se comprueba además qué restricción fue, porque una tabla puede tener varias.
 */
export function esViolacionDeUnicidad(error: unknown, campo?: string): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }
  return (
    campo === undefined ||
    JSON.stringify(error.meta?.target ?? '').includes(campo)
  );
}
