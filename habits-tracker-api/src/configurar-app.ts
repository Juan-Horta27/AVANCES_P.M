import type { NestExpressApplication } from '@nestjs/platform-express';

import { ProblemaFilter } from './common/errores/problema.filter';
import { crearValidationPipe } from './common/validacion/crear-validation-pipe';

/** Tamaño máximo de una petición (api-contract.md §1). */
const LIMITE_CUERPO = '10mb';

/**
 * Configuración compartida por `main.ts` y por las pruebas e2e: así las pruebas ejercitan
 * exactamente el mismo prefijo, la misma validación y el mismo formato de errores.
 */
export function configurarApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('api/v1');
  app.useBodyParser('json', { limit: LIMITE_CUERPO });
  app.useGlobalPipes(crearValidationPipe());
  app.useGlobalFilters(new ProblemaFilter());
  // La app nativa no necesita CORS, pero la versión web de Expo (expo start --web) sí.
  app.enableCors();
}
