// Almacén del token de sesión (ADR-004, security-rules.md): solo en almacenamiento seguro de
// la plataforma (Keychain en iOS, Keystore en Android), nunca en AsyncStorage ni en un log.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CLAVE_TOKEN = 'hst.token';

// En la web no existe almacenamiento seguro: el token vive solo en memoria y la sesión se
// pierde al recargar la página. Es preferible a dejarlo legible en localStorage.
const ES_WEB = Platform.OS === 'web';
let tokenEnMemoria: string | null = null;

export async function guardarToken(token: string): Promise<void> {
  if (ES_WEB) {
    tokenEnMemoria = token;
    return;
  }
  await SecureStore.setItemAsync(CLAVE_TOKEN, token);
}

export async function leerToken(): Promise<string | null> {
  if (ES_WEB) return tokenEnMemoria;
  return SecureStore.getItemAsync(CLAVE_TOKEN);
}

export async function borrarToken(): Promise<void> {
  if (ES_WEB) {
    tokenEnMemoria = null;
    return;
  }
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}
