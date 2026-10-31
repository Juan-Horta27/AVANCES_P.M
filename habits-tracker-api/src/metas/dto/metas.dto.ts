import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { VALOR_MAXIMO } from '../../common/validacion/limites';
import {
  aBooleano,
  aEntero,
  recortarONulo,
  recortarOpcional,
} from '../../common/validacion/normalizar';

/** Cuerpo de POST /metas (api-contract.md E-10). */
export class CrearMetaDto {
  static readonly mensajeDeError = 'Los datos de la meta no son válidos.';

  @IsInt({ message: 'El hábito es obligatorio.' })
  @Min(1, { message: 'El hábito no es válido.' })
  habitoId: number;

  /** Mayor que cero es regla de negocio (422, en el servicio); aquí solo se exige el formato. */
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El valor objetivo debe ser un número con máximo 2 decimales.' },
  )
  @Max(VALOR_MAXIMO, {
    message: `El valor objetivo no puede superar ${VALOR_MAXIMO}.`,
  })
  valorObjetivo: number;

  @IsOptional()
  @Transform(recortarOpcional)
  @IsString({ message: 'La descripción debe ser texto.' })
  @MaxLength(300, {
    message: 'La descripción no puede superar los 300 caracteres.',
  })
  descripcion?: string;
}

/**
 * Cuerpo de PATCH /metas/:id (E-10b, ampliado por ADR-011): activar o desactivar y, además,
 * editar el valor objetivo o la descripción. Todos los campos son opcionales, pero se exige
 * al menos uno (lo comprueba el servicio).
 */
export class ActualizarMetaDto {
  static readonly mensajeDeError = 'Los datos de la meta no son válidos.';

  @IsOptional()
  @IsBoolean({ message: "El campo 'activa' debe ser true o false." })
  activa?: boolean;

  /** Mayor que cero es regla de negocio (422, en el servicio). */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El valor objetivo debe ser un número con máximo 2 decimales.' },
  )
  @Max(VALOR_MAXIMO, {
    message: `El valor objetivo no puede superar ${VALOR_MAXIMO}.`,
  })
  valorObjetivo?: number;

  @IsOptional()
  @Transform(recortarONulo)
  @IsString({ message: 'La descripción debe ser texto.' })
  @MaxLength(300, {
    message: 'La descripción no puede superar los 300 caracteres.',
  })
  descripcion?: string | null;
}

/** Parámetros de consulta de GET /metas (E-09). */
export class FiltroMetasDto {
  @IsOptional()
  @Transform(aEntero)
  @IsInt({ message: "El parámetro 'habitoId' debe ser un número entero." })
  habitoId?: number;

  /** `1` solo activas, `0` solo inactivas; sin el parámetro, todas. */
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean({ message: "El parámetro 'activas' debe ser 1 o 0." })
  activas?: boolean;
}
