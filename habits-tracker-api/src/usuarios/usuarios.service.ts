import { HttpStatus, Injectable } from '@nestjs/common';
import type { Rol } from '@prisma/client';

import { UsuarioPublico, aUsuarioPublico } from '../auth/sesion';
import { ProblemaException } from '../common/errores/problema.exception';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async perfil(usuarioId: number): Promise<UsuarioPublico> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    // Token con firma válida pero de una cuenta que ya no existe: es una sesión inválida.
    if (!usuario) {
      throw new ProblemaException({
        title: 'No autorizado',
        status: HttpStatus.UNAUTHORIZED,
        code: 'UNAUTHORIZED',
        detail: 'No autorizado. Sesión inválida o expirada.',
      });
    }
    return aUsuarioPublico(usuario);
  }

  /** Usuarios de un rol en orden alfabético (HU-02, Flujo 5: "pacientes del centro"). */
  async listarPorRol(rol: Rol): Promise<UsuarioPublico[]> {
    const usuarios = await this.prisma.usuario.findMany({
      where: { rol },
      orderBy: [{ nombres: 'asc' }, { apellidos: 'asc' }],
    });
    return usuarios.map(aUsuarioPublico);
  }
}
