import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { aBooleano } from '../../common/validacion/normalizar';

/** Parámetros de consulta de GET /habitos (api-contract.md E-04). */
export class FiltroHabitosDto {
  /** true (por omisión): solo los no archivados. false: incluye también los archivados. */
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean({ message: "El parámetro 'activos' debe ser true o false." })
  activos?: boolean;
}
