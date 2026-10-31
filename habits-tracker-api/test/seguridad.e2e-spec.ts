import type { NestExpressApplication } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import { como, crearApp, crearCuenta, limpiarBase } from './ayudantes';

// Guardia JWT global (api-contract.md §1): todo exige token, salvo login y registro.

describe('Seguridad: guardia JWT (e2e)', () => {
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

  const api = () => request(app.getHttpServer());

  test('rutaProtegida_sinCabeceraAuthorization_responde401Unauthorized', async () => {
    const respuesta = await api().get('/api/v1/habitos').expect(401);

    expect(respuesta.body).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('rutaProtegida_conTokenMalFormado_responde401Unauthorized', async () => {
    const respuesta = await api()
      .get('/api/v1/habitos')
      .set('Authorization', 'Bearer esto-no-es-un-jwt')
      .expect(401);

    expect(respuesta.body.code).toBe('UNAUTHORIZED');
  });

  test('rutaProtegida_conTokenFirmadoConOtroSecreto_responde401Unauthorized', async () => {
    const falsificado = new JwtService({
      secret: 'otro-secreto-que-no-es-el-del-servidor-123456',
    }).sign({
      sub: 1,
    });

    const respuesta = await api()
      .get('/api/v1/habitos')
      .set('Authorization', `Bearer ${falsificado}`)
      .expect(401);

    expect(respuesta.body.code).toBe('UNAUTHORIZED');
  });

  test('rutaProtegida_conTokenVencido_responde401TokenExpired', async () => {
    const cuenta = await crearCuenta(app);
    // Mismo secreto del servidor, pero emitido ya vencido.
    const vencido = app
      .get(JwtService)
      .sign({ sub: cuenta.id }, { expiresIn: -10 });

    const respuesta = await api()
      .get('/api/v1/habitos')
      .set('Authorization', `Bearer ${vencido}`)
      .expect(401);

    expect(respuesta.body.code).toBe('TOKEN_EXPIRED');
  });

  test('rutaProtegida_conTokenValido_dejaPasar', async () => {
    const cuenta = await crearCuenta(app);

    await como(app, cuenta).get('/habitos').expect(200);
  });

  test('usuariosMe_conTokenValido_devuelveElPerfilSinContrasena', async () => {
    const cuenta = await crearCuenta(app, 'perfil@correo.com');

    const respuesta = await como(app, cuenta).get('/usuarios/me').expect(200);

    expect(respuesta.body).toMatchObject({
      id: cuenta.id,
      correo: 'perfil@correo.com',
    });
    expect(respuesta.body).not.toHaveProperty('contrasena');
  });

  test('usuariosMe_deUnaCuentaQueYaNoExiste_responde401', async () => {
    const cuenta = await crearCuenta(app, 'borrada@correo.com');
    await limpiarBase(app);

    const respuesta = await como(app, cuenta).get('/usuarios/me').expect(401);

    expect(respuesta.body.code).toBe('UNAUTHORIZED');
  });

  test('rutasDeAutenticacion_sinToken_siguenSiendoPublicas', async () => {
    await api()
      .post('/api/v1/auth/register')
      .send({
        nombres: 'Ana',
        correo: 'publica@correo.com',
        contrasena: 'Segura123',
      })
      .expect(201);
    await api()
      .post('/api/v1/auth/login')
      .send({ correo: 'publica@correo.com', contrasena: 'Segura123' })
      .expect(200);
  });
});

// Errores que ocurren antes de llegar a un controlador (api-contract.md §1 y §3).
describe('Formato de errores del lector de cuerpo (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await crearApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  test('cuerpoDeMasDe10MB_responde413EnProblemJson', async () => {
    const grande = JSON.stringify({ nombre: 'x'.repeat(11 * 1024 * 1024) });

    const respuesta = await api()
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(grande)
      .expect(413);

    expect(respuesta.headers['content-type']).toContain(
      'application/problem+json',
    );
    expect(respuesta.body).toMatchObject({
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
    });
  });

  test('jsonMalFormado_responde400ValidationFailed', async () => {
    const respuesta = await api()
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"correo": ')
      .expect(400);

    expect(respuesta.body).toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
    });
  });
});

describe('GET /api/v1/categorias (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await crearApp();
    await limpiarBase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  test('categorias_conToken_devuelveElCatalogoDeHU02', async () => {
    const cuenta = await crearCuenta(app, 'catalogo@correo.com');

    const respuesta = await como(app, cuenta).get('/categorias').expect(200);

    expect(
      respuesta.body.map(
        (c: { nombre: string; icono: string }) => `${c.icono} ${c.nombre}`,
      ),
    ).toEqual([
      '💧 Hidratación',
      '🏃 Ejercicio',
      '🥗 Alimentación',
      '😴 Sueño',
      '🧘 Meditación',
    ]);
  });
});
