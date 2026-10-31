import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { VALOR_MAXIMO } from '../../common/validacion/limites';
import { recortar, recortarOpcional } from '../../common/validacion/normalizar';

export const FRECUENCIAS = ['diaria', 'semanal'] as const;
export type Frecuencia = (typeof FRECUENCIAS)[number];

/**
 * Meta opcional que se crea junto con el hábito. Que el valor sea mayor que cero es una regla
 * de negocio (422), no de formato: por eso aquí solo se exige que sea un número.
 */
export class MetaInicialDto {
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
  @IsString({ message: 'La descripción de la meta debe ser texto.' })
  @MaxLength(300, {
    message: 'La descripción de la meta no puede superar los 300 caracteres.',
  })
  descripcion?: string;
}

/** Cuerpo de POST /habitos (api-contract.md E-05). */
export class CrearHabitoDto {
  static readonly mensajeDeError =
    'Faltan datos obligatorios para crear el hábito.';

  @IsInt({ message: 'La categoría es obligatoria.' })
  @Min(1, { message: 'La categoría no es válida.' })
  categoriaHabitoId: number;

  @Transform(recortar)
  @IsString({ message: 'El nombre es obligatorio.' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres.' })
  nombre: string;

  @IsOptional()
  @Transform(recortarOpcional)
  @IsString({ message: 'La descripción debe ser texto.' })
  @MaxLength(300, {
    message: 'La descripción no puede superar los 300 caracteres.',
  })
  descripcion?: string;

  @Transform(recortar)
  @IsString({ message: 'La unidad de medida es obligatoria.' })
  @Length(1, 30, {
    message: 'La unidad de medida debe tener entre 1 y 30 caracteres.',
  })
  unidadMedida: string;

  @IsOptional()
  @IsIn(FRECUENCIAS, {
    message: "La frecuencia debe ser 'diaria' o 'semanal'.",
  })
  frecuencia?: Frecuencia;

  @IsOptional()
  @ValidateNested()
  @Type(() => MetaInicialDto)
  metaInicial?: MetaInicialDto;
}
