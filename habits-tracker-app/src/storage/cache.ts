// Caché del dominio en el dispositivo (ADR-004, persistence.md, HU-02 S-05): permite abrir la
// app con contenido aunque no haya red. No es la fuente de verdad: el API lo es, y la caché se
// reemplaza en cuanto llegan datos frescos.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { CategoriaHabito, Habito, Meta, RegistroDiario, Usuario } from '../types';

/** Lo que se guarda: una clave por colección, más la marca de la última sincronización. */
export interface Dominio {
  usuario: Usuario;
  categorias: CategoriaHabito[];
  habitos: Habito[];
  metas: Meta[];
  registros: RegistroDiario[];
  /** Instante (ISO) de la última carga completa desde el API. */
  sincronizado: string;
}

export type Coleccion = keyof Dominio;

const PREFIJO = 'hst:';
/** Versión del esquema guardado. Un cambio de forma incompatible pasa a 'v2' (persistence.md). */
const VERSION = 'v1';

const COLECCIONES: Coleccion[] = [
  'usuario',
  'categorias',
  'habitos',
  'metas',
  'registros',
  'sincronizado',
];

const clave = (coleccion: Coleccion) => `${PREFIJO}${VERSION}:${coleccion}`;

/**
 * En la web la caché se desactiva: el token no sobrevive a una recarga (vive en memoria), así
 * que la caché nunca se usaría y solo dejaría datos de salud en el navegador.
 */
const CACHE_ACTIVA = Platform.OS !== 'web';

/**
 * AsyncStorage no está cifrado: del perfil solo se guardan los datos de identificación, nunca
 * edad, peso ni estatura (data-model.md §9, security-rules.md).
 */
export function aPerfilBasico(usuario: Usuario): Usuario {
  return { ...usuario, edad: null, peso: null, estatura: null };
}

/** Reescribe solo la colección que cambió (persistence.md: "solo la clave afectada"). */
export async function guardarColeccion<C extends Coleccion>(
  coleccion: C,
  valor: Dominio[C],
): Promise<void> {
  if (!CACHE_ACTIVA) return;
  const aGuardar = coleccion === 'usuario' ? aPerfilBasico(valor as Usuario) : valor;
  try {
    await AsyncStorage.setItem(clave(coleccion), JSON.stringify(aGuardar));
  } catch {
    // Si falla, la sesión sigue con los datos en memoria y se reintentará en el próximo cambio.
    // No se registra el contenido: son datos de salud (security-rules.md).
    console.warn('No se pudo actualizar la caché local.');
  }
}

/**
 * Lee la caché completa. Devuelve null si falta alguna colección o si algo está corrupto:
 * en ese caso se descarta, porque siempre se puede reconstruir desde el API.
 */
export async function leerDominio(): Promise<Dominio | null> {
  if (!CACHE_ACTIVA) return null;
  try {
    const pares = await AsyncStorage.multiGet(COLECCIONES.map(clave));
    if (pares.some(([, valor]) => valor === null)) return null;

    const dominio: Partial<Record<Coleccion, unknown>> = {};
    pares.forEach(([, valor], indice) => {
      dominio[COLECCIONES[indice]] = JSON.parse(valor as string);
    });
    return dominio as Dominio;
  } catch {
    // Caché corrupta o almacenamiento que falla: se intenta borrar, y si tampoco se puede,
    // se sigue sin caché (los datos llegarán del API).
    await limpiarCache().catch(() => undefined);
    return null;
  }
}

/** Al cerrar sesión se borra todo lo de la app (security-rules.md, hallazgo S-03). */
export async function limpiarCache(): Promise<void> {
  if (!CACHE_ACTIVA) return;
  const claves = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(claves.filter((c) => c.startsWith(PREFIJO)));
}

/**
 * Migración al arrancar: las claves de versiones anteriores se descartan. Es una migración
 * válida porque la caché se reconstruye desde el API (persistence.md, "Migraciones").
 */
export async function descartarVersionesAnteriores(): Promise<void> {
  if (!CACHE_ACTIVA) return;
  const claves = await AsyncStorage.getAllKeys();
  const actuales = `${PREFIJO}${VERSION}:`;
  const antiguas = claves.filter((c) => c.startsWith(PREFIJO) && !c.startsWith(actuales));
  if (antiguas.length > 0) await AsyncStorage.multiRemove(antiguas);
}
