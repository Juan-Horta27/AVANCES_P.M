import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  normalizarCorreo,
  recortar,
  recortarOpcional,
} from '../../common/validacion/normalizar';

/** Cuerpo de POST /auth/register (api-contract.md E-02, ADR-008 D-12 y D-13). */
export class RegistroDto {
  static readonly mensajeDeError = 'Datos de registro incompletos o inválidos.';

  @Transform(recortar)
  @IsString({ message: 'Los nombres son obligatorios.' })
  @Length(2, 100, {
    message: 'Los nombres deben tener entre 2 y 100 caracteres.',
  })
  nombres: string;

  @IsOptional()
  @Transform(recortarOpcional)
  @IsString({ message: 'Los apellidos deben ser texto.' })
  @Length(2, 100, {
    message: 'Los apellidos deben tener entre 2 y 100 caracteres.',
  })
  apellidos?: string;

  @Transform(normalizarCorreo)
  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @MaxLength(150, { message: 'El correo no puede superar los 150 caracteres.' })
  correo: string;

  @IsString({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  // bcrypt solo usa los primeros 72 bytes: una contraseña más larga daría una falsa sensación de seguridad.
  @MaxLength(72, {
    message: 'La contraseña no puede superar los 72 caracteres.',
  })
  @Matches(/[A-Z]/, {
    message: 'La contraseña debe incluir al menos una mayúscula.',
  })
  @Matches(/\d/, { message: 'La contraseña debe incluir al menos un número.' })
  contrasena: string;

  @IsOptional()
  @IsInt({ message: 'La edad debe ser un número entero.' })
  @Min(12, { message: 'La edad debe estar entre 12 y 120 años.' })
  @Max(120, { message: 'La edad debe estar entre 12 y 120 años.' })
  edad?: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El peso debe ser un número con máximo 2 decimales.' },
  )
  @Min(20, { message: 'El peso debe estar entre 20 y 350 kg.' })
  @Max(350, { message: 'El peso debe estar entre 20 y 350 kg.' })
  peso?: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'La estatura debe ser un número con máximo 2 decimales.' },
  )
  @Min(0.8, { message: 'La estatura debe estar entre 0,80 y 2,50 m.' })
  @Max(2.5, { message: 'La estatura debe estar entre 0,80 y 2,50 m.' })
  estatura?: number;
}
