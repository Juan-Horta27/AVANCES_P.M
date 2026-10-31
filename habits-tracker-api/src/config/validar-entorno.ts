/** Variables de entorno que el API necesita para arrancar. */
export interface Entorno {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PORT: number;
  /** Zona horaria que define qué día es "hoy" para rachas y fechas futuras. */
  ZONA_HORARIA: string;
}

const LONGITUD_MINIMA_SECRETO = 32;

/**
 * Falla al arrancar si falta configuración, en lugar de fallar más tarde en la primera
 * petición. Un secreto JWT corto haría fácil falsificar tokens, por eso se exige un mínimo.
 */
export function validarEntorno(variables: Record<string, unknown>): Entorno {
  const faltantes = ['DATABASE_URL', 'JWT_SECRET'].filter(
    (nombre) => !variables[nombre],
  );
  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${faltantes.join(', ')}. Revisa backend/.env.example.`,
    );
  }

  const secreto = String(variables.JWT_SECRET);
  if (secreto.length < LONGITUD_MINIMA_SECRETO) {
    throw new Error(
      `JWT_SECRET debe tener al menos ${LONGITUD_MINIMA_SECRETO} caracteres.`,
    );
  }

  const zonaHoraria = String(variables.ZONA_HORARIA || 'America/Bogota');
  if (!esZonaHorariaValida(zonaHoraria)) {
    throw new Error(`ZONA_HORARIA no es válida: ${zonaHoraria}.`);
  }

  return {
    DATABASE_URL: String(variables.DATABASE_URL),
    JWT_SECRET: secreto,
    JWT_EXPIRES_IN: String(variables.JWT_EXPIRES_IN || '24h'),
    PORT: Number(variables.PORT || 3000),
    ZONA_HORARIA: zonaHoraria,
  };
}

function esZonaHorariaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}
