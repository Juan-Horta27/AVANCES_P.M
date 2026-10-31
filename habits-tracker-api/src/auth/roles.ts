import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '@prisma/client';

import { rolNoPermitido } from '../common/errores/problemas';
import type { UsuarioAutenticado } from './decoradores';

export const ROLES_PERMITIDOS = 'rolesPermitidos';

/**
 * Limita una ruta (o un controlador entero) a ciertos roles (ADR-011).
 * Sin este decorador, la ruta queda abierta a cualquier usuario autenticado.
 */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_PERMITIDOS, roles);

/**
 * Segunda guardia global: corre después de la guardia JWT, que ya dejó `{ id, rol }` en la
 * petición. Responde 403 FORBIDDEN_ROLE cuando el rol del token no está entre los permitidos.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_PERMITIDOS,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (!permitidos) return true;

    const { user } = contexto
      .switchToHttp()
      .getRequest<{ user?: UsuarioAutenticado }>();
    if (user && permitidos.includes(user.rol)) return true;
    throw rolNoPermitido();
  }
}
