import { HttpException } from '@nestjs/common';

/**
 * Cuerpo de error RFC 7807 (application/problem+json), tal como lo define
 * api-contract.md §2. `code` es estable y la app lo usa para decidir; `detail`
 * es el texto en español que ve la persona usuaria.
 */
export interface Problema {
  title: string;
  status: number;
  detail: string;
  code: string;
  errors?: Record<string, string[]>;
}

/** Excepción de dominio que ya sabe cómo se responde al cliente. */
export class ProblemaException extends HttpException {
  constructor(readonly problema: Problema) {
    super(problema, problema.status);
  }
}
