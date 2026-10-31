import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Habito } from '@prisma/client';

import {
  noEncontrado,
  prohibido,
  reglaDeNegocio,
} from '../common/errores/problemas';
import { aTextoISO, hoyEnZona } from '../common/fechas';
import { PrismaService } from '../prisma/prisma.service';
import { Racha, calcularRacha } from '../registros/racha';
import { ActualizarHabitoDto } from './dto/actualizar-habito.dto';
import { CrearHabitoDto } from './dto/crear-habito.dto';
import {
  HabitoDetalle,
  HabitoRespuesta,
  aHabitoDetalle,
  aHabitoRespuesta,
} from './habito-respuesta';

/** Solo se carga la meta activa: es la única que muestran las listas. */
const CON_META_ACTIVA = { metas: { where: { activa: true } } } as const;

/** Mensajes literales del contrato para cada endpoint (api-contract.md E-06 a E-08). */
const MENSAJES = {
  consultar: {
    noExiste: 'El hábito solicitado no fue encontrado.',
    ajeno: 'No tienes permiso para acceder a este hábito.',
  },
  modificar: {
    noExiste: 'El hábito solicitado no fue encontrado.',
    ajeno: 'No tienes permiso para modificar este hábito.',
  },
  eliminar: {
    noExiste: 'El hábito no existe.',
    ajeno: 'No tienes permiso para eliminar este hábito.',
  },
};

@Injectable()
export class HabitosService {
  private readonly zonaHoraria: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.zonaHoraria = config.getOrThrow<string>('ZONA_HORARIA');
  }

  /** GET /habitos: por omisión solo los activos; con `incluirArchivados`, todos. */
  async listar(
    usuarioId: number,
    incluirArchivados: boolean,
  ): Promise<HabitoRespuesta[]> {
    const habitos = await this.prisma.habito.findMany({
      where: { usuarioId, ...(incluirArchivados ? {} : { activo: true }) },
      include: CON_META_ACTIVA,
      orderBy: { id: 'asc' },
    });
    const rachas = await this.rachasDe(habitos.map((habito) => habito.id));
    return habitos.map((habito) =>
      aHabitoRespuesta(habito, rachas.get(habito.id) ?? SIN_RACHA),
    );
  }

  /** GET /habitos/:id: detalle con la categoría y todo el historial de metas. */
  async obtener(usuarioId: number, id: number): Promise<HabitoDetalle> {
    await this.exigirPropio(usuarioId, id, MENSAJES.consultar);
    const habito = await this.prisma.habito.findUniqueOrThrow({
      where: { id },
      include: { categoria: true, metas: { orderBy: { id: 'desc' } } },
    });
    const rachas = await this.rachasDe([id]);
    return aHabitoDetalle(habito, rachas.get(id) ?? SIN_RACHA);
  }

  /** POST /habitos: crea el hábito y, si viene, su meta inicial (nace activa). */
  async crear(
    usuarioId: number,
    datos: CrearHabitoDto,
  ): Promise<HabitoRespuesta> {
    const { metaInicial, ...campos } = datos;
    if (metaInicial && metaInicial.valorObjetivo <= 0) {
      throw reglaDeNegocio(
        'El valor objetivo de la meta debe ser mayor que cero.',
      );
    }

    const categoria = await this.prisma.categoriaHabito.findUnique({
      where: { id: datos.categoriaHabitoId },
    });
    if (!categoria) {
      throw noEncontrado(
        'CATEGORY_NOT_FOUND',
        'La categoría seleccionada no existe.',
      );
    }

    const habito = await this.prisma.habito.create({
      data: {
        ...campos,
        usuarioId,
        ...(metaInicial
          ? { metas: { create: { ...metaInicial, activa: true } } }
          : {}),
      },
      include: CON_META_ACTIVA,
    });
    return aHabitoRespuesta(habito, SIN_RACHA);
  }

  /** PUT /habitos/:id: cambia solo los campos enviados; `activo: true` reactiva un archivado. */
  async actualizar(
    usuarioId: number,
    id: number,
    cambios: ActualizarHabitoDto,
  ): Promise<HabitoRespuesta> {
    await this.exigirPropio(usuarioId, id, MENSAJES.modificar);
    const habito = await this.prisma.habito.update({
      where: { id },
      data: cambios,
      include: CON_META_ACTIVA,
    });
    const rachas = await this.rachasDe([id]);
    return aHabitoRespuesta(habito, rachas.get(id) ?? SIN_RACHA);
  }

  /**
   * DELETE /habitos/:id (ADR-008, D-10). Con registros: se archiva (activo = false), porque
   * esos registros son historial de salud que no se puede perder. Sin registros: se borra, y
   * sus metas caen en cascada por la clave foránea.
   */
  async eliminar(usuarioId: number, id: number): Promise<void> {
    await this.exigirPropio(usuarioId, id, MENSAJES.eliminar);
    const totalRegistros = await this.prisma.registroDiario.count({
      where: { habitoId: id },
    });

    if (totalRegistros > 0) {
      await this.prisma.habito.update({
        where: { id },
        data: { activo: false },
      });
    } else {
      await this.prisma.habito.delete({ where: { id } });
    }
  }

  /** 404 si no existe; 403 si existe pero es de otra persona (api-contract.md §3). */
  private async exigirPropio(
    usuarioId: number,
    id: number,
    mensajes: { noExiste: string; ajeno: string },
  ): Promise<Habito> {
    const habito = await this.prisma.habito.findUnique({ where: { id } });
    if (!habito) throw noEncontrado('HABIT_NOT_FOUND', mensajes.noExiste);
    if (habito.usuarioId !== usuarioId) throw prohibido(mensajes.ajeno);
    return habito;
  }

  /**
   * Racha de cada hábito, calculada al consultar (ADR-008, D-19). Una sola consulta trae las
   * fechas cumplidas de todos los hábitos pedidos, en lugar de una consulta por hábito.
   */
  private async rachasDe(habitoIds: number[]): Promise<Map<number, Racha>> {
    const cumplidos = await this.prisma.registroDiario.findMany({
      where: { habitoId: { in: habitoIds }, metaCumplida: true },
      select: { habitoId: true, fecha: true },
    });

    const fechasPorHabito = new Map<number, string[]>();
    for (const { habitoId, fecha } of cumplidos) {
      const fechas = fechasPorHabito.get(habitoId) ?? [];
      fechas.push(aTextoISO(fecha));
      fechasPorHabito.set(habitoId, fechas);
    }

    const hoy = hoyEnZona(this.zonaHoraria);
    return new Map(
      habitoIds.map((id) => [
        id,
        calcularRacha(fechasPorHabito.get(id) ?? [], hoy),
      ]),
    );
  }
}

const SIN_RACHA: Racha = { rachaActual: 0, rachaMaxima: 0 };
