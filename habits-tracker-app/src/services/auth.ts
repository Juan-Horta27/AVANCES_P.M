import type { DatosNuevaCuenta, Usuario } from '../types';
import { Resultado, apiFetch } from './api';

/** Respuesta de login y registro (api-contract.md E-01 y E-02). */
export interface Sesion {
  token: string;
  usuario: Usuario;
}

export function iniciarSesion(correo: string, contrasena: string): Promise<Resultado<Sesion>> {
  return apiFetch<Sesion>('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo, contrasena },
    publico: true,
  });
}

export function crearCuenta(datos: DatosNuevaCuenta): Promise<Resultado<Sesion>> {
  return apiFetch<Sesion>('/auth/register', { metodo: 'POST', cuerpo: datos, publico: true });
}

/** Perfil del dueño del token; se usa al arrancar para restaurar la sesión (E-14). */
export function obtenerPerfil(): Promise<Resultado<Usuario>> {
  return apiFetch<Usuario>('/usuarios/me');
}
