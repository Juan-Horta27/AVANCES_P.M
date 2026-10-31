import type { Rol } from '@prisma/client';
import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';

export const ES_PUBLICO = 'esPublico';

/**
 * Marca una ruta como pública. Todas las demás exigen token, porque la guardia JWT es
 * global (api-contract.md §1: solo login y registro son anónimos).
 */
export const Publico = () => SetMetadata(ES_PUBLICO, true);

/** Lo que la estrategia JWT deja en la petición tras validar el token. */
export interface UsuarioAutenticado {
  id: number;
  rol: Rol;
}

/**
 * Inyecta el id del usuario del token. Es la única forma de saber quién hace la petición:
 * el cuerpo nunca trae `usuarioId` (api-contract.md D-03).
 */
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): number => {
    const peticion = contexto
      .switchToHttp()
      .getRequest<{ user: UsuarioAutenticado }>();
    return peticion.user.id;
  },
);
