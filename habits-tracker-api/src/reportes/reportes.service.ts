import { Injectable } from '@nestjs/common';

import { aUsuarioPublico } from '../auth/sesion';
import { noEncontrado, reglaDeNegocio } from '../common/errores/problemas';
import { aFechaBD, aTextoISO } from '../common/fechas';
import { PrismaService } from '../prisma/prisma.service';
import { calcularRacha } from '../registros/racha';
import { ProgresoHabito, ReporteProgreso } from './reporte-respuesta';

/** Porcentaje entero de cumplimiento; sin registros es 0 por definición (no NaN). */
function porcentaje(cumplidos: number, evaluados: number): number {
  return evaluados === 0 ? 0 : Math.round((cumplidos / evaluados) * 100);
}

/**
 * Reporte de progreso de un paciente para el profesional (M-09, HU-02 Flujo 5): por hábito,
 * días evaluados, días cumplidos, porcentaje de adherencia y racha máxima dentro del rango.
 * Se calcula al consultar, igual que las rachas (ADR-008, D-19): no hay tabla de reportes.
 */
@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async progreso(
    usuarioId: number,
    fechaInicio: string,
    fechaFin: string,
  ): Promise<ReporteProgreso> {
    if (fechaInicio > fechaFin) {
      throw reglaDeNegocio(
        'La fecha inicial no puede ser posterior a la fecha final.',
      );
    }

    const paciente = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!paciente || paciente.rol !== 'paciente') {
      throw noEncontrado(
        'PATIENT_NOT_FOUND',
        'El paciente indicado no existe.',
      );
    }

    const habitos = await this.prisma.habito.findMany({
      where: { usuarioId },
      orderBy: { id: 'asc' },
      include: {
        categoria: true,
        metas: { where: { activa: true } },
        registros: {
          where: {
            fecha: { gte: aFechaBD(fechaInicio), lte: aFechaBD(fechaFin) },
          },
          select: { fecha: true, metaCumplida: true },
        },
      },
    });

    const progreso: ProgresoHabito[] = habitos
      // Un hábito archivado solo aparece si tuvo actividad en el rango consultado.
      .filter((habito) => habito.activo || habito.registros.length > 0)
      .map((habito) => {
        const cumplidas = habito.registros
          .filter((registro) => registro.metaCumplida)
          .map((registro) => aTextoISO(registro.fecha));
        const diasEvaluados = habito.registros.length;
        return {
          habitoId: habito.id,
          nombre: habito.nombre,
          categoria: habito.categoria.nombre,
          icono: habito.categoria.icono,
          unidadMedida: habito.unidadMedida,
          activo: habito.activo,
          metaActiva: habito.metas[0]?.valorObjetivo.toNumber() ?? null,
          diasEvaluados,
          diasCumplidos: cumplidas.length,
          porcentajeAdherencia: porcentaje(cumplidas.length, diasEvaluados),
          rachaMaxima: calcularRacha(cumplidas, fechaFin).rachaMaxima,
        };
      });

    const diasEvaluados = progreso.reduce((s, h) => s + h.diasEvaluados, 0);
    const diasCumplidos = progreso.reduce((s, h) => s + h.diasCumplidos, 0);
    return {
      paciente: aUsuarioPublico(paciente),
      fechaInicio,
      fechaFin,
      habitos: progreso,
      totales: {
        diasEvaluados,
        diasCumplidos,
        porcentajeAdherencia: porcentaje(diasCumplidos, diasEvaluados),
      },
    };
  }
}
