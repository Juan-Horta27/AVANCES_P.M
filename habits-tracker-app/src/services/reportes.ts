import type { ReporteProgreso, Usuario } from '../types';
import { Resultado, apiFetch } from './api';

/** Pacientes del centro, en orden alfabético (GET /usuarios?rol=paciente; solo profesional). */
export function listarPacientes(): Promise<Resultado<Usuario[]>> {
  return apiFetch<Usuario[]>('/usuarios?rol=paciente');
}

/**
 * Adherencia por hábito del paciente entre dos fechas incluidas (GET /reportes/progreso).
 * El servidor hace los cálculos: la app del profesional solo los muestra (M-09).
 */
export function obtenerProgreso(
  usuarioId: number,
  fechaInicio: string,
  fechaFin: string,
): Promise<Resultado<ReporteProgreso>> {
  const consulta = `usuarioId=${usuarioId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
  return apiFetch<ReporteProgreso>(`/reportes/progreso?${consulta}`);
}
