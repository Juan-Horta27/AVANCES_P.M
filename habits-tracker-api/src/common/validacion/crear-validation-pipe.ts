import { HttpStatus, ValidationError, ValidationPipe } from '@nestjs/common';

import { ProblemaException } from '../errores/problema.exception';

const DETALLE_GENERICO = 'Los datos enviados no son válidos.';

/** class-validator no permite personalizar el mensaje de `forbidNonWhitelisted`; se traduce aquí. */
const MENSAJE_CAMPO_NO_PERMITIDO = 'Este campo no está permitido.';

/**
 * Un DTO puede declarar `static readonly mensajeDeError` para fijar el `detail` literal
 * que exige el contrato para su endpoint (por ejemplo, el de registro).
 */
interface ConMensajeDeError {
  mensajeDeError?: string;
}

/**
 * Validación global de los cuerpos de petición con class-validator (HU-02 S-04):
 * - `whitelist` + `forbidNonWhitelisted`: un campo que el DTO no declara se rechaza, en vez
 *   de ignorarse en silencio (evita, por ejemplo, que alguien envíe `"usuarioId"`).
 * - `transform`: el controlador recibe una instancia del DTO, ya normalizada.
 * - Los errores se responden como `400 VALIDATION_FAILED` con el mapa `errors` por campo.
 */
export function crearValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errores) =>
      new ProblemaException({
        title: 'Error de validación',
        status: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_FAILED',
        detail: detalleDe(errores),
        errors: aMapaDeErrores(errores),
      }),
  });
}

function detalleDe(errores: ValidationError[]): string {
  const dto = errores[0]?.target?.constructor as ConMensajeDeError | undefined;
  return dto?.mensajeDeError ?? DETALLE_GENERICO;
}

/**
 * Aplana los errores en un mapa `campo → mensajes`. Los objetos anidados usan la ruta
 * con punto (por ejemplo `metaInicial.valorObjetivo`), para que el formulario sepa qué campo marcar.
 */
function aMapaDeErrores(
  errores: ValidationError[],
  prefijo = '',
): Record<string, string[]> {
  const mapa: Record<string, string[]> = {};
  for (const error of errores) {
    const ruta = prefijo + error.property;
    const mensajes = mensajesDe(error);
    if (mensajes.length > 0) mapa[ruta] = mensajes;
    Object.assign(mapa, aMapaDeErrores(error.children ?? [], `${ruta}.`));
  }
  return mapa;
}

function mensajesDe(error: ValidationError): string[] {
  return Object.entries(error.constraints ?? {}).map(([regla, mensaje]) =>
    regla === 'whitelistValidation' ? MENSAJE_CAMPO_NO_PERMITIDO : mensaje,
  );
}
