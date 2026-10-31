import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Rol } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsuarioAutenticado } from './decoradores';

interface ContenidoToken {
  sub: number;
  rol: Rol;
}

/**
 * Estrategia Passport (HU-01): lee `Authorization: Bearer <token>`, verifica la firma y la
 * expiración con JWT_SECRET y, si todo está bien, deja `{ id, rol }` en `request.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(contenido: ContenidoToken): UsuarioAutenticado {
    return { id: contenido.sub, rol: contenido.rol };
  }
}
