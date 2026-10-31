import { IsIn, IsOptional } from 'class-validator';

/** Parámetros de consulta de GET /usuarios (ADR-011): el profesional solo lista pacientes. */
export class FiltroUsuariosDto {
  @IsOptional()
  @IsIn(['paciente'], {
    message: "El parámetro 'rol' solo admite el valor 'paciente'.",
  })
  rol?: 'paciente';
}
