import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import {
  como,
  crearApp,
  crearCuenta,
  crearHabito,
  crearProfesional,
  limpiarBase,
} from './ayudantes';

// Roles (ADR-011; guía del proyecto de aula §6): sin token → 401; con el rol equivocado → 403.

describe('Roles: paciente y profesional (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await crearApp();
  });

  beforeEach(async () => {
    await limpiarBase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  test('registro_siempre_creaUnPaciente', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nombres: 'Ana',
        correo: 'ana@correo.com',
        contrasena: 'Segura123',
      })
      .expect(201);

    expect(respuesta.body.usuario.rol).toBe('paciente');
  });

  test('registro_conCampoRol_responde400SinCrearProfesionales', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nombres: 'Intruso',
        correo: 'intruso@correo.com',
        contrasena: 'Segura123',
        rol: 'profesional',
      })
      .expect(400);

    expect(respuesta.body.errors).toHaveProperty('rol');
  });

  test('login_deProfesional_devuelveSuRolEnElPerfil', async () => {
    const profesional = await crearProfesional(app);

    const respuesta = await como(app, profesional)
      .get('/usuarios/me')
      .expect(200);

    expect(respuesta.body.rol).toBe('profesional');
  });

  test('rutaDePaciente_sinToken_responde401', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/habitos')
      .expect(401);

    expect(respuesta.body.code).toBe('UNAUTHORIZED');
  });

  test.each([
    ['GET', '/habitos'],
    ['POST', '/habitos'],
    ['GET', '/metas'],
    ['POST', '/metas'],
    ['GET', '/registros'],
    ['POST', '/registros'],
  ])(
    'rutaDePaciente_%s_%s_conProfesional_responde403ForbiddenRole',
    async (metodo, ruta) => {
      const profesional = await crearProfesional(app);
      const cliente = como(app, profesional);

      const respuesta = await (
        metodo === 'GET' ? cliente.get(ruta) : cliente.post(ruta, {})
      ).expect(403);

      expect(respuesta.body).toMatchObject({
        status: 403,
        code: 'FORBIDDEN_ROLE',
        detail: 'No tienes permiso para realizar esta acción con tu rol.',
      });
    },
  );

  test('rutaDePaciente_conPaciente_dejaPasar', async () => {
    const paciente = await crearCuenta(app);

    await crearHabito(app, paciente);
    await como(app, paciente).get('/habitos').expect(200);
  });

  test('rutasComunes_conProfesional_dejanPasar', async () => {
    const profesional = await crearProfesional(app);

    await como(app, profesional).get('/categorias').expect(200);
    await como(app, profesional).get('/usuarios/me').expect(200);
  });
});
