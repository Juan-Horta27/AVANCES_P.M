import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { ProblemaException } from '../common/errores/problema.exception';
import { conflicto, esViolacionDeUnicidad } from '../common/errores/problemas';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';
import { Sesion, aUsuarioPublico } from './sesion';

/** Costo de bcrypt (data-model.md §9): 2^10 rondas. */
const RONDAS_BCRYPT = 10;

/**
 * Hash de una contraseña que nadie conoce. Cuando el correo no existe se compara contra él,
 * para que la respuesta tarde lo mismo que con un correo real: si no, el tiempo de respuesta
 * delataría qué correos tienen cuenta (api-contract.md D-06).
 */
const HASH_FICTICIO = bcrypt.hashSync(
  'contrasena-que-no-existe',
  RONDAS_BCRYPT,
);

const CREDENCIALES_INCORRECTAS = new ProblemaException({
  title: 'No autorizado',
  status: HttpStatus.UNAUTHORIZED,
  code: 'INVALID_CREDENTIALS',
  detail: 'Credenciales incorrectas.',
});

const CORREO_DUPLICADO = conflicto(
  'DUPLICATE_EMAIL',
  'El correo electrónico ya se encuentra registrado en la plataforma.',
);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Crea la cuenta y devuelve una sesión iniciada (ADR-008, D-14). */
  async registrar(datos: RegistroDto): Promise<Sesion> {
    const { contrasena, ...perfil } = datos;
    const hash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

    try {
      const usuario = await this.prisma.usuario.create({
        data: { ...perfil, contrasena: hash },
      });
      return this.crearSesion(usuario);
    } catch (error) {
      // La restricción UNIQUE de la base de datos es la autoridad sobre los correos repetidos:
      // así no hay carrera entre "comprobar" e "insertar" si llegan dos registros a la vez.
      if (esViolacionDeUnicidad(error)) throw CORREO_DUPLICADO;
      throw error;
    }
  }

  /** Valida las credenciales; el mismo error para correo inexistente o contraseña errónea. */
  async iniciarSesion({ correo, contrasena }: LoginDto): Promise<Sesion> {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo } });
    const coincide = await bcrypt.compare(
      contrasena,
      usuario?.contrasena ?? HASH_FICTICIO,
    );

    if (!usuario || !coincide) throw CREDENCIALES_INCORRECTAS;
    return this.crearSesion(usuario);
  }

  private async crearSesion(usuario: Usuario): Promise<Sesion> {
    // `sub` (subject) es el campo estándar de JWT para el id del dueño del token. El rol viaja
    // firmado: el servidor lo lee del token y nunca de lo que envíe el cliente (ADR-011).
    const token = await this.jwt.signAsync({
      sub: usuario.id,
      rol: usuario.rol,
    });
    return { token, usuario: aUsuarioPublico(usuario) };
  }
}
