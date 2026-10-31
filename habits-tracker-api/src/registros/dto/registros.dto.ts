import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { EsFechaISO } from '../../common/validacion/es-fecha-iso';
import { VALOR_MAXIMO } from '../../common/validacion/limites';
import {
  aEntero,
  recortarONulo,
  recortarOpcional,
} from '../../common/validacion/normalizar';

const MENSAJE_FECHA =
  'La fecha debe tener formato YYYY-MM-DD y ser un día válido.';

/** Cuerpo de POST /registros (api-contract.md E-11). */
export class CrearRegistroDto {
  static readonly mensajeDeError =
    'La fecha debe tener formato YYYY-MM-DD y el valor registrado no puede ser negativo.';

  @IsInt({ message: 'El hábito es obligatorio.' })
  @Min(1, { message: 'El hábito no es válido.' })
  habitoId: number;

  @EsFechaISO({ message: MENSAJE_FECHA })
  fecha: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'El valor registrado debe ser un número con máximo 2 decimales.',
    },
  )
  @Min(0, { message: 'El valor registrado no puede ser negativo.' })
  @Max(VALOR_MAXIMO, {
    message: `El valor registrado no puede superar ${VALOR_MAXIMO}.`,
  })
  valorRegistrado: number;

  @IsOptional()
  @Transform(recortarOpcional)
  @IsString({ message: 'Las notas deben ser texto.' })
  @MaxLength(500, {
    message: 'Las notas no pueden superar los 500 caracteres.',
  })
  notas?: string;

  /** Clave de idempotencia generada en el teléfono (ADR-008, D-17). */
  @IsUUID('4', { message: 'clienteId debe ser un UUID v4.' })
  clienteId: string;
}

/**
 * Cuerpo de PUT /registros/:id (ADR-011, C-04). El hábito y la fecha no se editan: cambiarlos
 * equivale a otro registro y chocaría con la unicidad (hábito, fecha). Se exige al menos un
 * campo (lo comprueba el servicio). Unas notas vacías se borran.
 */
export class ActualizarRegistroDto {
  static readonly mensajeDeError =
    'El valor registrado no puede ser negativo y las notas no pueden superar 500 caracteres.';

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'El valor registrado debe ser un número con máximo 2 decimales.',
    },
  )
  @Min(0, { message: 'El valor registrado no puede ser negativo.' })
  @Max(VALOR_MAXIMO, {
    message: `El valor registrado no puede superar ${VALOR_MAXIMO}.`,
  })
  valorRegistrado?: number;

  @IsOptional()
  @Transform(recortarONulo)
  @IsString({ message: 'Las notas deben ser texto.' })
  @MaxLength(500, {
    message: 'Las notas no pueden superar los 500 caracteres.',
  })
  notas?: string | null;
}

/** Parámetros de consulta de GET /registros (E-12). */
export class FiltroRegistrosDto {
  @IsOptional()
  @Transform(aEntero)
  @IsInt({ message: "El parámetro 'habitoId' debe ser un número entero." })
  habitoId?: number;

  @IsOptional()
  @Transform(aEntero)
  @IsInt({ message: "El parámetro 'page' debe ser un número entero." })
  @Min(1, { message: "El parámetro 'page' empieza en 1." })
  page?: number;

  @IsOptional()
  @Transform(aEntero)
  @IsInt({ message: "El parámetro 'size' debe ser un número entero." })
  @Min(1, { message: "El parámetro 'size' debe estar entre 1 y 100." })
  @Max(100, { message: "El parámetro 'size' debe estar entre 1 y 100." })
  size?: number;

  /** Desde esta fecha, incluida. */
  @IsOptional()
  @EsFechaISO({ message: MENSAJE_FECHA })
  from?: string;

  /** Hasta esta fecha, sin incluirla. */
  @IsOptional()
  @EsFechaISO({ message: MENSAJE_FECHA })
  to?: string;
}
