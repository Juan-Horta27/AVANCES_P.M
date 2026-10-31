import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import { Problema, ProblemaException } from './problema.exception';

/** Problemas genéricos para errores HTTP que no lanzó nuestro código (ruta inexistente, JSON roto...). */
const PROBLEMAS_POR_ESTADO: Record<number, Omit<Problema, 'status'>> = {
  [HttpStatus.BAD_REQUEST]: {
    title: 'Error de validación',
    code: 'VALIDATION_FAILED',
    detail: 'La petición no se pudo interpretar.',
  },
  [HttpStatus.UNAUTHORIZED]: {
    title: 'No autorizado',
    code: 'UNAUTHORIZED',
    detail: 'No autorizado. Sesión inválida o expirada.',
  },
  [HttpStatus.NOT_FOUND]: {
    title: 'No encontrado',
    code: 'ROUTE_NOT_FOUND',
    detail: 'El recurso solicitado no existe.',
  },
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    title: 'Petición demasiado grande',
    code: 'PAYLOAD_TOO_LARGE',
    detail: 'La petición supera el tamaño máximo permitido.',
  },
};

const PROBLEMA_INESPERADO: Problema = {
  title: 'Error interno',
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  code: 'INTERNAL_ERROR',
  detail: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
};

/**
 * Único punto donde una excepción se convierte en respuesta HTTP (ADR-008, D-09).
 * Así todos los errores del API tienen la misma forma, sin depender de cada controlador.
 */
@Catch()
export class ProblemaFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemaFilter.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const problema = this.aProblema(excepcion);

    respuesta
      .status(problema.status)
      .type('application/problem+json')
      .json(problema);
  }

  private aProblema(excepcion: unknown): Problema {
    if (excepcion instanceof ProblemaException) {
      return excepcion.problema;
    }
    if (excepcion instanceof HttpException) {
      return this.problemaGenerico(excepcion.getStatus());
    }
    // El lector del cuerpo (body-parser) rechaza antes de llegar a NestJS, con errores de
    // `http-errors` que traen su estado 4xx; por ejemplo, 413 si se supera el límite de 10 MB.
    const estadoDelLector = this.estadoDeErrorDeCliente(excepcion);
    if (estadoDelLector !== null) {
      return this.problemaGenerico(estadoDelLector);
    }
    // Un 500 es un defecto de programación (api-contract.md §3): se registra para depurarlo,
    // pero al cliente no se le muestran detalles internos.
    this.logger.error(
      excepcion instanceof Error ? excepcion.stack : String(excepcion),
    );
    return PROBLEMA_INESPERADO;
  }

  private problemaGenerico(status: number): Problema {
    const generico = PROBLEMAS_POR_ESTADO[status] ?? {
      title: 'Error',
      code: 'HTTP_ERROR',
      detail: 'No se pudo completar la petición.',
    };
    return {
      title: generico.title,
      status,
      detail: generico.detail,
      code: generico.code,
    };
  }

  /** Estado de un error 4xx de `http-errors` (`expose: true`), o `null` si no lo es. */
  private estadoDeErrorDeCliente(excepcion: unknown): number | null {
    if (typeof excepcion !== 'object' || excepcion === null) return null;
    const { status, expose } = excepcion as {
      status?: unknown;
      expose?: unknown;
    };
    const esDeCliente =
      expose === true &&
      typeof status === 'number' &&
      status >= 400 &&
      status < 500;
    return esDeCliente ? status : null;
  }
}
