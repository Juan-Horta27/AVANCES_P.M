import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { normalizarCorreo } from '../../common/validacion/normalizar';

/**
 * Cuerpo de POST /auth/login (api-contract.md E-01). La fortaleza de la contraseña NO se
 * valida aquí (ADR-008, D-12): solo que venga. Validarla revelaría la política sin proteger nada.
 */
export class LoginDto {
  static readonly mensajeDeError =
    'El correo y la contraseña son obligatorios y deben ser válidos.';

  @Transform(normalizarCorreo)
  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  correo: string;

  @IsString({ message: 'La contraseña es obligatoria.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  contrasena: string;
}
