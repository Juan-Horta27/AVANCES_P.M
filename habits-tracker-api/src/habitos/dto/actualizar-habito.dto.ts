import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

import { recortar, recortarONulo } from '../../common/validacion/normalizar';
import { FRECUENCIAS, Frecuencia } from './crear-habito.dto';

/**
 * Cuerpo de PUT /habitos/:id (api-contract.md E-07). Todos los campos son opcionales: se
 * cambia solo lo que llega. `activo: true` reactiva un hábito archivado (data-model.md §6).
 * La categoría no se puede cambiar: el contrato no la incluye entre los campos modificables.
 */
export class ActualizarHabitoDto {
  static readonly mensajeDeError = 'Datos de actualización inválidos.';

  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'El nombre debe ser texto.' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres.' })
  nombre?: string;

  /** `null` borra la descripción; un texto vacío también. */
  @IsOptional()
  @Transform(recortarONulo)
  @IsString({ message: 'La descripción debe ser texto.' })
  @MaxLength(300, {
    message: 'La descripción no puede superar los 300 caracteres.',
  })
  descripcion?: string | null;

  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'La unidad de medida debe ser texto.' })
  @Length(1, 30, {
    message: 'La unidad de medida debe tener entre 1 y 30 caracteres.',
  })
  unidadMedida?: string;

  @IsOptional()
  @IsIn(FRECUENCIAS, {
    message: "La frecuencia debe ser 'diaria' o 'semanal'.",
  })
  frecuencia?: Frecuencia;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser true o false.' })
  activo?: boolean;
}
