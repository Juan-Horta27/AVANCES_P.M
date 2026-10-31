import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Habito, Prisma, RegistroDiario } from '@prisma/client';

import {
  conflicto,
  datosInvalidos,
  esViolacionDeUnicidad,
  noEncontrado,
  prohibido,
  reglaDeNegocio,
} from '../common/errores/problemas';
import { aFechaBD, aTextoISO, hoyEnZona } from '../common/fechas';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActualizarRegistroDto,
  CrearRegistroDto,
  FiltroRegistrosDto,
} from './dto/registros.dto';
import {
  PaginaDeRegistros,
  RegistroRespuesta,
  aRegistroRespuesta,
} from './registro-respuesta';

const TAMANO_PAGINA_POR_OMISION = 20;

/** Resultado de crear: `creado` distingue un 201 (nuevo) de un 200 (reintento idempotente). */
export interface ResultadoCreacion {
  registro: RegistroRespuesta;
  creado: boolean;
}

@Injectable()
export class RegistrosService {
  private readonly zonaHoraria: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.zonaHoraria = config.getOrThrow<string>('ZONA_HORARIA');
  }

  /**
   * POST /registros (api-contract.md E-11). Orden de comprobación: formato (ya lo hizo el
   * DTO) → reintento con el mismo clienteId → hábito → fecha → unicidad (hábito, fecha).
   */
  async crear(
    usuarioId: number,
    datos: CrearRegistroDto,
  ): Promise<ResultadoCreacion> {
    const previo = await this.buscarPorClienteId(datos.clienteId);
    if (previo) return this.repetirIntento(previo, usuarioId, datos);

    const habito = await this.prisma.habito.findUnique({
      where: { id: datos.habitoId },
    });
    this.exigirHabitoDisponible(habito, usuarioId);

    if (datos.fecha > hoyEnZona(this.zonaHoraria)) {
      throw reglaDeNegocio('No se puede registrar una fecha futura.');
    }

    // metaCumplida se calcula al crear, contra la meta activa de este momento, y queda
    // congelada: cambiar la meta después no reescribe la historia (ADR-008, D-18).
    const metaCumplida = await this.cumpleMetaActiva(
      datos.habitoId,
      datos.valorRegistrado,
    );

    try {
      const registro = await this.prisma.registroDiario.create({
        data: { ...datos, fecha: aFechaBD(datos.fecha), metaCumplida },
      });
      return { registro: aRegistroRespuesta(registro), creado: true };
    } catch (error) {
      // Dos envíos simultáneos del mismo clienteId: el segundo choca con la restricción UNIQUE
      // y se trata como el reintento que es.
      if (esViolacionDeUnicidad(error, 'cliente_id')) {
        const ganador = await this.buscarPorClienteId(datos.clienteId);
        if (ganador) return this.repetirIntento(ganador, usuarioId, datos);
      }
      // La restricción UNIQUE (habito_id, fecha) de la base es la autoridad (HU-02, M-06).
      if (esViolacionDeUnicidad(error)) {
        throw conflicto(
          'DUPLICATE_DAILY_LOG',
          'Ya existe un registro para este hábito en la fecha indicada.',
        );
      }
      throw error;
    }
  }

  /** GET /registros: paginado, del más reciente al más antiguo (api-contract.md E-12). */
  async listar(
    usuarioId: number,
    filtro: FiltroRegistrosDto,
  ): Promise<PaginaDeRegistros> {
    const page = filtro.page ?? 1;
    const size = filtro.size ?? TAMANO_PAGINA_POR_OMISION;
    const where: Prisma.RegistroDiarioWhereInput = {
      habito: { usuarioId },
      ...(filtro.habitoId !== undefined ? { habitoId: filtro.habitoId } : {}),
      fecha: {
        ...(filtro.from ? { gte: aFechaBD(filtro.from) } : {}),
        ...(filtro.to ? { lt: aFechaBD(filtro.to) } : {}),
      },
    };

    const [total, registros] = await Promise.all([
      this.prisma.registroDiario.count({ where }),
      this.prisma.registroDiario.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      items: registros.map(aRegistroRespuesta),
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * PUT /registros/:id (ADR-011, C-04). Si cambia el valor, metaCumplida se vuelve a evaluar
   * contra la meta activa de este momento (api-contract.md §7: "el servidor gana"); si solo
   * cambian las notas, se conserva. La racha se recalcula sola en la siguiente consulta.
   */
  async actualizar(
    usuarioId: number,
    id: number,
    datos: ActualizarRegistroDto,
  ): Promise<RegistroRespuesta> {
    const { valorRegistrado, notas } = datos;
    if (valorRegistrado === undefined && notas === undefined) {
      throw datosInvalidos('Indica qué quieres cambiar del registro.');
    }
    const registro = await this.buscarPropio(usuarioId, id);

    const metaCumplida =
      valorRegistrado === undefined
        ? undefined
        : await this.cumpleMetaActiva(registro.habitoId, valorRegistrado);
    const actualizado = await this.prisma.registroDiario.update({
      where: { id },
      data: { valorRegistrado, notas, metaCumplida },
    });
    return aRegistroRespuesta(actualizado);
  }

  /** DELETE /registros/:id. La racha se recalcula sola en la siguiente consulta (D-19). */
  async eliminar(usuarioId: number, id: number): Promise<void> {
    await this.buscarPropio(usuarioId, id);
    await this.prisma.registroDiario.delete({ where: { id } });
  }

  /** 404 si no existe o es de otra persona: no se revela que un registro ajeno exista (E-12b). */
  private async buscarPropio(
    usuarioId: number,
    id: number,
  ): Promise<RegistroDiario> {
    const registro = await this.prisma.registroDiario.findFirst({
      where: { id, habito: { usuarioId } },
    });
    if (!registro)
      throw noEncontrado(
        'DAILY_LOG_NOT_FOUND',
        'El registro indicado no existe.',
      );
    return registro;
  }

  /** Regla de M-06: la meta se cumple si el valor es mayor o igual a la meta activa. Sin meta, no. */
  private async cumpleMetaActiva(
    habitoId: number,
    valor: number,
  ): Promise<boolean> {
    const metaActiva = await this.prisma.meta.findFirst({
      where: { habitoId, activa: true },
    });
    return metaActiva ? valor >= metaActiva.valorObjetivo.toNumber() : false;
  }

  private buscarPorClienteId(clienteId: string) {
    return this.prisma.registroDiario.findUnique({
      where: { clienteId },
      include: { habito: true },
    });
  }

  /**
   * Mismo clienteId: si el contenido coincide es un reenvío de la cola offline y se responde
   * con el registro existente (200). Si no coincide, o el registro es de otra persona, es un
   * conflicto: nunca se devuelven datos ajenos por adivinar un clienteId.
   */
  private repetirIntento(
    previo: RegistroDiario & { habito: Habito },
    usuarioId: number,
    datos: CrearRegistroDto,
  ): ResultadoCreacion {
    const mismoContenido =
      previo.habito.usuarioId === usuarioId &&
      previo.habitoId === datos.habitoId &&
      aTextoISO(previo.fecha) === datos.fecha &&
      previo.valorRegistrado.toNumber() === datos.valorRegistrado &&
      (previo.notas ?? undefined) === datos.notas;

    if (!mismoContenido) {
      throw conflicto(
        'IDEMPOTENCY_CONFLICT',
        'Conflicto de clave de idempotencia: el cuerpo de la petición difiere del intento original.',
      );
    }
    return { registro: aRegistroRespuesta(previo), creado: false };
  }

  /** 404 si no existe o está archivado; 403 si es de otra persona (api-contract.md E-11). */
  private exigirHabitoDisponible(
    habito: Habito | null,
    usuarioId: number,
  ): void {
    if (!habito)
      throw noEncontrado(
        'HABIT_NOT_FOUND',
        'El hábito indicado no está disponible.',
      );
    if (habito.usuarioId !== usuarioId) {
      throw prohibido(
        'No tienes permiso para registrar progreso en este hábito.',
      );
    }
    if (!habito.activo) {
      throw noEncontrado(
        'HABIT_NOT_FOUND',
        'El hábito indicado no está disponible.',
      );
    }
  }
}
