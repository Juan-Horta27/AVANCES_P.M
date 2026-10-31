import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { UsuarioActual } from '../auth/decoradores';
import { Roles } from '../auth/roles';
import {
  ActualizarRegistroDto,
  CrearRegistroDto,
  FiltroRegistrosDto,
} from './dto/registros.dto';
import { PaginaDeRegistros, RegistroRespuesta } from './registro-respuesta';
import { RegistrosService } from './registros.service';

/** Registros diarios del usuario (api-contract.md E-11, E-12, E-12b y E-12c). */
// Solo el paciente gestiona sus hábitos, metas y registros; el profesional recibe 403 (ADR-011).
@Roles('paciente')
@Controller('registros')
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  /** 201 si se creó; 200 si era un reintento con el mismo clienteId (idempotencia, D-17). */
  @Post()
  async crear(
    @UsuarioActual() usuarioId: number,
    @Body() datos: CrearRegistroDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<RegistroRespuesta> {
    const { registro, creado } = await this.registrosService.crear(
      usuarioId,
      datos,
    );
    respuesta.status(creado ? HttpStatus.CREATED : HttpStatus.OK);
    return registro;
  }

  @Get()
  listar(
    @UsuarioActual() usuarioId: number,
    @Query() filtro: FiltroRegistrosDto,
  ): Promise<PaginaDeRegistros> {
    return this.registrosService.listar(usuarioId, filtro);
  }

  @Put(':id')
  actualizar(
    @UsuarioActual() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarRegistroDto,
  ): Promise<RegistroRespuesta> {
    return this.registrosService.actualizar(usuarioId, id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @UsuarioActual() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.registrosService.eliminar(usuarioId, id);
  }
}
