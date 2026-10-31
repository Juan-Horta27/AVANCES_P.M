import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { UsuarioActual } from '../auth/decoradores';
import { Roles } from '../auth/roles';
import {
  ActualizarMetaDto,
  CrearMetaDto,
  FiltroMetasDto,
} from './dto/metas.dto';
import { MetaRespuesta } from './meta-respuesta';
import { MetasService } from './metas.service';

/** Metas de los hábitos del usuario (api-contract.md E-09, E-10, E-10b y E-10c). */
// Solo el paciente gestiona sus hábitos, metas y registros; el profesional recibe 403 (ADR-011).
@Roles('paciente')
@Controller('metas')
export class MetasController {
  constructor(private readonly metasService: MetasService) {}

  @Get()
  listar(
    @UsuarioActual() usuarioId: number,
    @Query() filtro: FiltroMetasDto,
  ): Promise<MetaRespuesta[]> {
    return this.metasService.listar(usuarioId, filtro);
  }

  @Post()
  crear(
    @UsuarioActual() usuarioId: number,
    @Body() datos: CrearMetaDto,
  ): Promise<MetaRespuesta> {
    return this.metasService.crear(usuarioId, datos);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarMetaDto,
  ): Promise<MetaRespuesta> {
    return this.metasService.actualizar(usuarioId, id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @UsuarioActual() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.metasService.eliminar(usuarioId, id);
  }
}
