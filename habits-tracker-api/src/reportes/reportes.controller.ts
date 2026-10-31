import { Controller, Get, Query } from '@nestjs/common';

import { Roles } from '../auth/roles';
import { ProgresoDto } from './dto/progreso.dto';
import { ReporteProgreso } from './reporte-respuesta';
import { ReportesService } from './reportes.service';

/** Reportes para el profesional de bienestar (ADR-011, M-09); el paciente recibe 403. */
@Roles('profesional')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('progreso')
  progreso(@Query() filtro: ProgresoDto): Promise<ReporteProgreso> {
    return this.reportesService.progreso(
      filtro.usuarioId,
      filtro.fechaInicio,
      filtro.fechaFin,
    );
  }
}
