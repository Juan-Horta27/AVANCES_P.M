import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

import { EsFechaISO } from '../../common/validacion/es-fecha-iso';
import { aEntero } from '../../common/validacion/normalizar';

const MENSAJE_FECHA =
  'La fecha debe tener formato YYYY-MM-DD y ser un día válido.';

/** Parámetros de GET /reportes/progreso (ADR-011, M-09; HU-02 Flujo 5). */
export class ProgresoDto {
  static readonly mensajeDeError =
    'Indica el paciente y un rango de fechas válido (YYYY-MM-DD).';

  @Transform(aEntero)
  @IsInt({ message: 'El paciente es obligatorio.' })
  @Min(1, { message: 'El paciente no es válido.' })
  usuarioId: number;

  @EsFechaISO({ message: MENSAJE_FECHA })
  fechaInicio: string;

  @EsFechaISO({ message: MENSAJE_FECHA })
  fechaFin: string;
}
