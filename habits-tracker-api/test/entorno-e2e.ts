// Entorno de las pruebas e2e: la misma base de desarrollo, pero en un esquema propio ("e2e"),
// para que las pruebas puedan borrar datos sin tocar los de desarrollo.
// Lo usan tanto la preparación global (migraciones) como cada archivo de pruebas.

export function prepararEntornoE2E(): void {
  if (!process.env.DATABASE_URL) {
    process.loadEnvFile('.env'); // backend/.env, creado a partir de .env.example
  }
  const url = new URL(process.env.DATABASE_URL ?? '');
  url.searchParams.set('schema', 'e2e');
  process.env.DATABASE_URL = url.toString();
}

prepararEntornoE2E();
