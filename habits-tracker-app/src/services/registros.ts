import { randomUUID } from 'expo-crypto';

import type { RegistroDiario } from '../types';
import { Resultado, apiFetch } from './api';

/** Datos para registrar el cumplimiento de un día (POST /registros). */
export interface DatosNuevoRegistro {
  habitoId: number;
  fecha: string;
  valorRegistrado: number;
  notas?: string;
}

interface PaginaDeRegistros {
  items: RegistroDiario[];
  totalPages: number;
}

/** Tamaño máximo de página que admite el API (E-12). */
const TAMANO_PAGINA = 100;

/**
 * Trae todos los registros recorriendo las páginas: rachas, gráfica e historial se calculan
 * sobre el historial completo que tiene la app.
 */
export async function listarRegistros(): Promise<Resultado<RegistroDiario[]>> {
  const todos: RegistroDiario[] = [];
  for (let pagina = 1; ; pagina += 1) {
    const resultado = await apiFetch<PaginaDeRegistros>(
      `/registros?page=${pagina}&size=${TAMANO_PAGINA}`,
    );
    if (!resultado.ok) return resultado;
    todos.push(...resultado.datos.items);
    if (pagina >= resultado.datos.totalPages) return { ok: true, datos: todos };
  }
}

/** Clave de idempotencia de un registro: un UUID v4 generado en el teléfono (ADR-008 D-17). */
export function nuevoClienteId(): string {
  return randomUUID();
}

/**
 * Cada registro lleva un `clienteId`: si el envío se repite (por ejemplo, al reenviar la cola de
 * pendientes, S-06), el servidor lo reconoce y no lo duplica.
 */
export function crearRegistro(
  datos: DatosNuevoRegistro,
  clienteId: string = nuevoClienteId(),
): Promise<Resultado<RegistroDiario>> {
  return apiFetch<RegistroDiario>('/registros', {
    metodo: 'POST',
    cuerpo: { ...datos, clienteId },
  });
}

/**
 * Cambia el valor y las notas de un registro (PUT /registros/:id). El hábito y la fecha no se
 * editan. Si cambia el valor, el servidor vuelve a decidir si se cumplió la meta.
 */
export interface CambiosRegistro {
  valorRegistrado: number;
  notas: string;
}

export function editarRegistro(
  id: number,
  cambios: CambiosRegistro,
): Promise<Resultado<RegistroDiario>> {
  return apiFetch<RegistroDiario>(`/registros/${id}`, { metodo: 'PUT', cuerpo: cambios });
}

export function eliminarRegistro(id: number): Promise<Resultado<void>> {
  return apiFetch<void>(`/registros/${id}`, { metodo: 'DELETE' });
}
