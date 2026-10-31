import { Controller, Get, Query } from '@nestjs/common';

import { UsuarioActual } from '../auth/decoradores';
import { Roles } from '../auth/roles';
import { UsuarioPublico } from '../auth/sesion';
import { FiltroUsuariosDto } from './dto/filtro-usuarios.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * GET /usuarios/me (api-contract.md E-14): perfil del dueño del token, para cualquier rol.
   * La app lo llama al arrancar con un token guardado, para restaurar la sesión.
   */
  @Get('me')
  perfil(@UsuarioActual() usuarioId: number): Promise<UsuarioPublico> {
    return this.usuariosService.perfil(usuarioId);
  }

  /** GET /usuarios?rol=paciente (ADR-011, M-09): pacientes del centro, solo para el profesional. */
  @Roles('profesional')
  @Get()
  listarPacientes(
    @Query() filtro: FiltroUsuariosDto,
  ): Promise<UsuarioPublico[]> {
    return this.usuariosService.listarPorRol(filtro.rol ?? 'paciente');
  }
}
