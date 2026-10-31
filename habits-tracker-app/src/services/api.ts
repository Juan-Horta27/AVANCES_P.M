// Cliente HTTP único de la app (ADR-005, api-networking.md). Ninguna pantalla ni componente
// llama a fetch: todo pasa por apiFetch, que es el único lugar donde viven la URL base,
// el token, el timeout, los reintentos y la traducción de errores.
import { leerToken } from '../storage/seguro';

/**
 * URL base por entorno. EXPO_PUBLIC_ viaja dentro del bundle: no es un secreto (security-rules.md).
 * En un teléfono con Expo Go hay que poner la IP del PC (ver .env.example).
 */
export const URL_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const TIMEOUT_MS = 10_000;

/** Esperas entre intentos de un GET (D-16): inmediato, a 1 s y a 2 s. */
export const ESPERAS_REINTENTO_MS = [0, 1_000, 2_000];

const MENSAJE_SIN_CONEXION = 'No pudimos conectar. Revisa tu conexión e intenta de nuevo.';
const MENSAJE_GENERICO = 'No se pudo completar la operación. Intenta de nuevo.';

export type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OpcionesPeticion {
  metodo?: Metodo;
  cuerpo?: unknown;
  /** Login y registro: no se adjunta token y un 401 no cierra la sesión. */
  publico?: boolean;
}

/** Mismo contrato `{ ok, mensaje }` que las acciones del contexto ya devolvían (ADR-005). */
export type Resultado<T> =
  | { ok: true; datos: T }
  | { ok: false; mensaje: string; code?: string; status?: number };

/** Cuerpo de error RFC 7807 del backend (api-contract.md §2). */
interface Problema {
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

let alSesionInvalida: (() => void) | null = null;

/**
 * El contexto registra aquí qué hacer ante un 401 en una ruta protegida (token vencido o
 * inválido): cerrar la sesión y volver al login (authentication.md, "Ante un 401").
 */
export function registrarManejadorSesionInvalida(manejador: (() => void) | null): void {
  alSesionInvalida = manejador;
}

export async function apiFetch<T>(
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<Resultado<T>> {
  const metodo = opciones.metodo ?? 'GET';
  // Solo las lecturas se reintentan solas: reintentar una escritura a ciegas podría duplicarla.
  const esperas = metodo === 'GET' ? ESPERAS_REINTENTO_MS : [0];

  for (const espera of esperas) {
    if (espera > 0) await esperar(espera);
    const resultado = await intentar<T>(ruta, metodo, opciones);
    if (resultado !== 'reintentable') return resultado;
  }
  return { ok: false, mensaje: MENSAJE_SIN_CONEXION };
}

/** Un intento. Devuelve 'reintentable' ante fallo de red, timeout o error 5xx. */
async function intentar<T>(
  ruta: string,
  metodo: Metodo,
  opciones: OpcionesPeticion,
): Promise<Resultado<T> | 'reintentable'> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: metodo,
      headers: await cabeceras(opciones),
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      signal: controlador.signal,
    });

    if (respuesta.status >= 500) return 'reintentable';
    if (respuesta.ok) {
      const datos = respuesta.status === 204 ? undefined : await respuesta.json();
      return { ok: true, datos: datos as T };
    }

    if (respuesta.status === 401 && !opciones.publico) alSesionInvalida?.();
    const problema = await leerProblema(respuesta);
    return {
      ok: false,
      mensaje: mensajeDe(problema),
      code: problema.code,
      status: respuesta.status,
    };
  } catch {
    // fetch solo lanza ante fallos de red o el abort del timeout.
    return 'reintentable';
  } finally {
    clearTimeout(temporizador);
  }
}

async function cabeceras(opciones: OpcionesPeticion): Promise<Record<string, string>> {
  const resultado: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (!opciones.publico) {
    const token = await leerToken();
    if (token) resultado.Authorization = `Bearer ${token}`;
  }
  return resultado;
}

async function leerProblema(respuesta: Response): Promise<Problema> {
  try {
    return (await respuesta.json()) as Problema;
  } catch {
    return {}; // un 401 de pasarela puede llegar sin cuerpo (api-contract.md §2.3)
  }
}

/**
 * Si el backend dijo qué campo falló, ese mensaje es el más útil para el formulario
 * ("La contraseña debe incluir al menos una mayúscula."); si no, el `detail` general.
 */
function mensajeDe(problema: Problema): string {
  const primerErrorDeCampo = Object.values(problema.errors ?? {})[0]?.[0];
  return primerErrorDeCampo ?? problema.detail ?? MENSAJE_GENERICO;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}
