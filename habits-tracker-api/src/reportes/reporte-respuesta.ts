import type { UsuarioPublico } from '../auth/sesion';

/** Adherencia de un hábito dentro del rango consultado. */
export interface ProgresoHabito {
  habitoId: number;
  nombre: string;
  categoria: string;
  icono: string | null;
  unidadMedida: string;
  /** false si el hábito está archivado (ADR-008, D-10). */
  activo: boolean;
  /** Valor objetivo de la meta activa hoy, o null si no tiene. */
  metaActiva: number | null;
  /** Días con registro dentro del rango. */
  diasEvaluados: number;
  /** Días con la meta cumplida dentro del rango. */
  diasCumplidos: number;
  /** round(cumplidos / evaluados × 100); 0 si no hay registros. */
  porcentajeAdherencia: number;
  /** Tramo más largo de días consecutivos cumplidos dentro del rango. */
  rachaMaxima: number;
}

/** Respuesta de GET /reportes/progreso. */
export interface ReporteProgreso {
  paciente: UsuarioPublico;
  fechaInicio: string;
  fechaFin: string;
  habitos: ProgresoHabito[];
  totales: {
    diasEvaluados: number;
    diasCumplidos: number;
    porcentajeAdherencia: number;
  };
}
