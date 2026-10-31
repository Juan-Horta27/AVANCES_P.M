import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { hoyEnZona } from '../src/common/fechas';
import { configurarApp } from '../src/configurar-app';
import { PrismaService } from '../src/prisma/prisma.service';

// Ayudantes compartidos por las pruebas e2e.

/** Arranca la app con la misma configuración que main.ts. */
export async function crearApp(): Promise<NestExpressApplication> {
  const modulo = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = modulo.createNestApplication<NestExpressApplication>({
    bodyParser: false,
  });
  configurarApp(app);
  await app.init();
  return app;
}

/** Deja el esquema e2e vacío (el catálogo de categorías se conserva). Orden: hijos antes que padres. */
export async function limpiarBase(app: NestExpressApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.registroDiario.deleteMany();
  await prisma.meta.deleteMany();
  await prisma.habito.deleteMany();
  await prisma.usuario.deleteMany();
}

export interface Cuenta {
  token: string;
  id: number;
}

/** Registra una cuenta nueva y devuelve su token. */
export async function crearCuenta(
  app: NestExpressApplication,
  correo = 'ana@correo.com',
): Promise<Cuenta> {
  const respuesta = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ nombres: 'Persona de prueba', correo, contrasena: 'Segura123' })
    .expect(201);
  return { token: respuesta.body.token, id: respuesta.body.usuario.id };
}

/**
 * Crea una cuenta de profesional directamente en la base (el registro público solo crea
 * pacientes, ADR-011) e inicia sesión con ella.
 */
export async function crearProfesional(
  app: NestExpressApplication,
  correo = 'laura@centro.com',
): Promise<Cuenta> {
  const usuario = await app.get(PrismaService).usuario.create({
    data: {
      nombres: 'Laura',
      correo,
      contrasena: bcrypt.hashSync('Segura123', 4),
      rol: 'profesional',
    },
  });
  const respuesta = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ correo, contrasena: 'Segura123' })
    .expect(200);
  return { token: respuesta.body.token, id: usuario.id };
}

/**
 * Cliente HTTP con el token ya puesto. Ejemplo: `await como(app, cuenta).get('/habitos')`.
 * Las rutas se escriben sin el prefijo /api/v1.
 */
export function como(app: NestExpressApplication, cuenta: Cuenta) {
  const servidor = app.getHttpServer();
  const autorizar = (prueba: request.Test) =>
    prueba.set('Authorization', `Bearer ${cuenta.token}`);
  return {
    get: (ruta: string) => autorizar(request(servidor).get(`/api/v1${ruta}`)),
    post: (ruta: string, cuerpo?: object) =>
      autorizar(request(servidor).post(`/api/v1${ruta}`)).send(cuerpo ?? {}),
    put: (ruta: string, cuerpo?: object) =>
      autorizar(request(servidor).put(`/api/v1${ruta}`)).send(cuerpo ?? {}),
    patch: (ruta: string, cuerpo?: object) =>
      autorizar(request(servidor).patch(`/api/v1${ruta}`)).send(cuerpo ?? {}),
    delete: (ruta: string) =>
      autorizar(request(servidor).delete(`/api/v1${ruta}`)),
  };
}

/** Crea un hábito (por defecto en la categoría 1, Hidratación) y devuelve su id. */
export async function crearHabito(
  app: NestExpressApplication,
  cuenta: Cuenta,
  datos: { nombre?: string; metaInicial?: { valorObjetivo: number } } = {},
): Promise<number> {
  const respuesta = await como(app, cuenta)
    .post('/habitos', {
      categoriaHabitoId: 1,
      nombre: datos.nombre ?? 'Beber agua',
      unidadMedida: 'vasos',
      ...(datos.metaInicial ? { metaInicial: datos.metaInicial } : {}),
    })
    .expect(201);
  return respuesta.body.id;
}

/** "Hoy" tal como lo calcula el API (zona del centro), desplazado `dias` días. */
export function fechaRelativa(dias = 0): string {
  const hoy = new Date(
    `${hoyEnZona(process.env.ZONA_HORARIA ?? 'America/Bogota')}T00:00:00Z`,
  );
  hoy.setUTCDate(hoy.getUTCDate() + dias);
  return hoy.toISOString().slice(0, 10);
}

let contadorUuid = 0;

/** UUID v4 válido y distinto en cada llamada (clave de idempotencia de los registros). */
export function nuevoClienteId(): string {
  contadorUuid += 1;
  const sufijo = String(contadorUuid).padStart(12, '0');
  return `9f1c0a7e-3b2d-4c5e-8a10-${sufijo}`;
}
