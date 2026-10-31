import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

import { ProblemaException } from '../common/errores/problema.exception';
import { ES_PUBLICO, UsuarioAutenticado } from './decoradores';

/**
 * Guardia global (se registra en AppModule): protege todas las rutas salvo las @Publico().
 * Distingue el token vencido del ausente o inválido, porque la app reacciona distinto
 * (api-contract.md §2.2: TOKEN_EXPIRED frente a UNAUTHORIZED).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(contexto: ExecutionContext) {
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    return esPublico ? true : super.canActivate(contexto);
  }

  handleRequest<T = UsuarioAutenticado>(
    error: unknown,
    usuario: T | false,
    info: unknown,
  ): T {
    if (usuario) return usuario;
    if (info instanceof TokenExpiredError) {
      throw new ProblemaException({
        title: 'No autorizado',
        status: HttpStatus.UNAUTHORIZED,
        code: 'TOKEN_EXPIRED',
        detail: 'Tu sesión expiró. Inicia sesión de nuevo.',
      });
    }
    throw new ProblemaException({
      title: 'No autorizado',
      status: HttpStatus.UNAUTHORIZED,
      code: 'UNAUTHORIZED',
      detail: 'No autorizado. Sesión inválida o expirada.',
    });
  }
}
