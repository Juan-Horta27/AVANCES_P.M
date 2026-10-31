import { execSync } from 'node:child_process';

import { prepararEntornoE2E } from './entorno-e2e';

/** Se ejecuta una vez antes de todas las pruebas e2e: deja el esquema "e2e" con todas las migraciones. */
export default function prepararBaseDePruebas(): void {
  prepararEntornoE2E();
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
