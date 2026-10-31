// Cola de registros pendientes de subir (HU-02 S-06, offline-sync.md, ADR-011): si al guardar un
// registro no hay red, se guarda aquí con su clienteId y se reenvía al volver la conexión. El
// servidor no lo duplica, porque reconoce el clienteId (idempotencia, ADR-008 D-17).
//
// A diferencia de la caché (cache.ts), la cola funciona también en la web: es justo lo que la
// persona necesita para no perder un registro hecho sin señal. Solo guarda los datos del registro
// (hábito, fecha, valor y notas), nunca el perfil.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DatosNuevoRegistro } from '../services/registros';

export interface RegistroPendiente extends DatosNuevoRegistro {
  clienteId: string;
}

/** Lo guardado: la cola y su dueño, para no reenviar registros bajo la cuenta de otra persona. */
interface ColaGuardada {
  usuarioId: number;
  registros: RegistroPendiente[];
}

export const CLAVE_PENDIENTES = 'hst:v1:pendientes';

/** Registros pendientes de `usuarioId`. Si la cola es de otra cuenta o está corrupta, se descarta. */
export async function leerPendientes(usuarioId: number): Promise<RegistroPendiente[]> {
  try {
    const texto = await AsyncStorage.getItem(CLAVE_PENDIENTES);
    if (texto === null) return [];
    const guardado = JSON.parse(texto) as ColaGuardada;
    if (guardado.usuarioId === usuarioId && Array.isArray(guardado.registros)) {
      return guardado.registros;
    }
  } catch {
    // Cola ilegible: no hay nada recuperable; se borra abajo.
  }
  await borrarPendientes();
  return [];
}

export async function guardarPendientes(
  usuarioId: number,
  registros: RegistroPendiente[],
): Promise<void> {
  try {
    if (registros.length === 0) {
      await AsyncStorage.removeItem(CLAVE_PENDIENTES);
      return;
    }
    const cola: ColaGuardada = { usuarioId, registros };
    await AsyncStorage.setItem(CLAVE_PENDIENTES, JSON.stringify(cola));
  } catch {
    // Si el almacenamiento falla, la cola sigue en memoria durante la sesión.
    console.warn('No se pudo guardar la cola de registros pendientes.');
  }
}

/** Al cerrar sesión, en cualquier plataforma (security-rules.md: se limpia todo). */
export async function borrarPendientes(): Promise<void> {
  await AsyncStorage.removeItem(CLAVE_PENDIENTES).catch(() => undefined);
}
