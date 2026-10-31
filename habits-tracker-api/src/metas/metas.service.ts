import { Injectable } from '@nestjs/common';
import type { Meta } from '@prisma/client';

import {
  conflicto,
  datosInvalidos,
  noEncontrado,
  reglaDeNegocio,
} from '../common/errores/problemas';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActualizarMetaDto,
  CrearMetaDto,
  FiltroMetasDto,
} from './dto/metas.dto';
import { MetaRespuesta, aMetaRespuesta } from './meta-respuesta';

@Injectable()
export class MetasService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /metas: solo las metas de hábitos del usuario; los filtros nunca amplían ese alcance. */
  async listar(
    usuarioId: number,
    filtro: FiltroMetasDto,
  ): Promise<MetaRespuesta[]> {
    const metas = await this.prisma.meta.findMany({
      where: {
        habito: { usuarioId },
        ...(filtro.habitoId !== undefined ? { habitoId: filtro.habitoId } : {}),
        ...(filtro.activas !== undefined ? { activa: filtro.activas } : {}),
      },
      orderBy: { id: 'asc' },
    });
    return metas.map(aMetaRespuesta);
  }

  /** POST /metas: toda meta nueva nace activa, si el hábito no tiene ya otra activa. */
  async crear(usuarioId: number, datos: CrearMetaDto): Promise<MetaRespuesta> {
    if (datos.valorObjetivo <= 0) {
      throw reglaDeNegocio(
        'El valor objetivo de la meta debe ser mayor que cero.',
      );
    }

    // En este endpoint el contrato no distingue "no existe" de "es ajeno": ambos son 404.
    const habito = await this.prisma.habito.findFirst({
      where: { id: datos.habitoId, usuarioId },
    });
    if (!habito) {
      throw noEncontrado(
        'HABIT_NOT_FOUND',
        'El hábito especificado no existe o no te pertenece.',
      );
    }

    await this.exigirSinOtraMetaActiva(
      datos.habitoId,
      'Este hábito ya tiene una meta activa. Desactívala antes de crear otra.',
    );
    const meta = await this.prisma.meta.create({
      data: { ...datos, activa: true },
    });
    return aMetaRespuesta(meta);
  }

  /**
   * PATCH /metas/:id: activar o desactivar, y editar el valor o la descripción (ADR-011).
   * Desactivar siempre se permite; reactivar exige que no haya otra activa. Validar solo al
   * crear es el error clásico (TC-004): dejaría tener dos metas activas con solo reactivar
   * una antigua. Cambiar el valor no reescribe los registros ya evaluados (D-18).
   */
  async actualizar(
    usuarioId: number,
    id: number,
    datos: ActualizarMetaDto,
  ): Promise<MetaRespuesta> {
    const { activa, valorObjetivo, descripcion } = datos;
    if (
      activa === undefined &&
      valorObjetivo === undefined &&
      descripcion === undefined
    ) {
      throw datosInvalidos('Indica qué quieres cambiar de la meta.');
    }
    if (valorObjetivo !== undefined && valorObjetivo <= 0) {
      throw reglaDeNegocio(
        'El valor objetivo de la meta debe ser mayor que cero.',
      );
    }

    const meta = await this.buscarPropia(usuarioId, id);
    if (activa && !meta.activa) {
      await this.exigirSinOtraMetaActiva(
        meta.habitoId,
        'Ya hay otra meta activa para este hábito. Desactívala primero.',
      );
    }
    const actualizada = await this.prisma.meta.update({
      where: { id },
      data: { activa, valorObjetivo, descripcion },
    });
    return aMetaRespuesta(actualizada);
  }

  /**
   * DELETE /metas/:id (ADR-011). Los registros no dependen de la meta: su `metaCumplida` ya
   * quedó guardado al crearlos, así que borrar una meta no altera el historial.
   */
  async eliminar(usuarioId: number, id: number): Promise<void> {
    await this.buscarPropia(usuarioId, id);
    await this.prisma.meta.delete({ where: { id } });
  }

  /** 404 si no existe o es de otra persona: este endpoint no revela metas ajenas (E-10b). */
  private async buscarPropia(usuarioId: number, id: number): Promise<Meta> {
    const meta = await this.prisma.meta.findFirst({
      where: { id, habito: { usuarioId } },
    });
    if (!meta)
      throw noEncontrado('GOAL_NOT_FOUND', 'La meta indicada no existe.');
    return meta;
  }

  /**
   * Regla "una sola meta activa por hábito" (data-model.md §2.4). Hoy la garantiza solo este
   * servicio: dos peticiones simultáneas podrían colarse (deuda declarada en data-model.md §13).
   */
  private async exigirSinOtraMetaActiva(
    habitoId: number,
    mensaje: string,
  ): Promise<void> {
    const activa = await this.prisma.meta.findFirst({
      where: { habitoId, activa: true },
    });
    if (activa) throw conflicto('ACTIVE_GOAL_EXISTS', mensaje);
  }
}
