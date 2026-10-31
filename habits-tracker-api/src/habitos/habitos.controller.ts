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
} from '@nestjs/common';

import { UsuarioActual } from '../auth/decoradores';
import { Roles } from '../auth/roles';
import { ActualizarHabitoDto } from './dto/actualizar-habito.dto';
import { CrearHabitoDto } from './dto/crear-habito.dto';
import { FiltroHabitosDto } from './dto/filtro-habitos.dto';
import { HabitoDetalle, HabitoRespuesta } from './habito-respuesta';
import { HabitosService } from './habitos.service';

/** Hábitos del usuario autenticado (api-contract.md E-04 a E-08). */
// Solo el paciente gestiona sus hábitos, metas y registros; el profesional recibe 403 (ADR-011).
@Roles('paciente')
@Controller('habitos')
export class HabitosController {
  constructor(private readonly habitosService: HabitosService) {}

  @Get()
  listar(
    @UsuarioActual() usuarioId: number,
    @Query() filtro: FiltroHabitosDto,
  ): Promise<HabitoRespuesta[]> {
    return this.habitosService.listar(usuarioId, filtro.activos === false);
  }

  @Get(':id')
  obtener(
    @UsuarioActual() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HabitoDetalle> {
    return this.habitosService.obtener(usuarioId, id);
  }

  @Post()
  crear(
    @UsuarioActual() usuarioId: number,
    @Body() datos: CrearHabitoDto,
  ): Promise<HabitoRespuesta> {
    return this.habitosService.crear(usuarioId, datos);
  }

  @Put(':id')
  actualizar(
    @UsuarioActual() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() cambios: ActualizarHabitoDto,
  ): Promise<HabitoRespuesta> {
    return this.habitosService.actualizar(usuarioId, id, cambios);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @UsuarioActual() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.habitosService.eliminar(usuarioId, id);
  }
}
