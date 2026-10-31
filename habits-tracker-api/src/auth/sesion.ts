import type { Rol, Usuario } from '@prisma/client';

/** Perfil que viaja al cliente: nunca incluye la contraseña ni su hash (authentication.md). */
export interface UsuarioPublico {
  id: number;
  nombres: string;
  apellidos: string | null;
  correo: string;
  edad: number | null;
  peso: number | null;
  estatura: number | null;
  rol: Rol;
}

/** Respuesta de login y registro (api-contract.md E-01 y E-02). */
export interface Sesion {
  token: string;
  usuario: UsuarioPublico;
}

/**
 * Convierte la fila de la base de datos en el perfil público. Prisma devuelve las columnas
 * `numeric` como objetos Decimal; el contrato las define como números JSON.
 */
export function aUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    correo: usuario.correo,
    edad: usuario.edad,
    peso: usuario.peso?.toNumber() ?? null,
    estatura: usuario.estatura?.toNumber() ?? null,
    rol: usuario.rol,
  };
}
