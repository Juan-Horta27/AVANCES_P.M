import type { NestExpressApplication } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { crearApp, limpiarBase } from './ayudantes';

// Pruebas de extremo a extremo: petición HTTP real → validación → servicio → PostgreSQL → respuesta.
// Cubren las sondas de api-contract.md §10 que corresponden a E-01 y E-02.

const REGISTRO_VALIDO = {
  nombres: 'Ana María',
  correo: 'ana@correo.com',
  contrasena: 'Segura123',
};

describe('Autenticación (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await crearApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await limpiarBase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  describe('POST /api/v1/auth/register', () => {
    test('registro_conDatosValidos_responde201ConTokenYPerfil', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/register')
        .send(REGISTRO_VALIDO)
        .expect(201);

      expect(respuesta.body.token).toEqual(expect.any(String));
      expect(respuesta.body.usuario).toEqual({
        id: expect.any(Number),
        nombres: 'Ana María',
        apellidos: null,
        correo: 'ana@correo.com',
        edad: null,
        peso: null,
        estatura: null,
        rol: 'paciente',
      });
    });

    test('registro_conDatosValidos_guardaLaContrasenaComoHashBcrypt', async () => {
      await api()
        .post('/api/v1/auth/register')
        .send(REGISTRO_VALIDO)
        .expect(201);

      const guardado = await prisma.usuario.findUniqueOrThrow({
        where: { correo: 'ana@correo.com' },
      });
      expect(guardado.contrasena).not.toBe('Segura123');
      expect(guardado.contrasena).toMatch(/^\$2[aby]\$10\$/);
    });

    test('registro_conCorreoEnMayusculasYEspacios_loGuardaNormalizado', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/register')
        .send({ ...REGISTRO_VALIDO, correo: '  Ana@Correo.COM ' })
        .expect(201);

      expect(respuesta.body.usuario.correo).toBe('ana@correo.com');
    });

    test('registro_conCorreoRepetidoConOtrasMayusculas_responde409DuplicateEmail', async () => {
      await api()
        .post('/api/v1/auth/register')
        .send(REGISTRO_VALIDO)
        .expect(201);

      const respuesta = await api()
        .post('/api/v1/auth/register')
        .send({ ...REGISTRO_VALIDO, correo: 'ANA@correo.com' })
        .expect(409);

      expect(respuesta.body).toEqual({
        title: 'Conflicto con el estado actual',
        status: 409,
        code: 'DUPLICATE_EMAIL',
        detail:
          'El correo electrónico ya se encuentra registrado en la plataforma.',
      });
    });

    test('registro_conContrasenaDebil_responde400ConElErrorEnElCampo', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/register')
        .send({ ...REGISTRO_VALIDO, contrasena: 'debil' })
        .expect(400)
        .expect('Content-Type', /application\/problem\+json/);

      expect(respuesta.body.code).toBe('VALIDATION_FAILED');
      expect(respuesta.body.detail).toBe(
        'Datos de registro incompletos o inválidos.',
      );
      expect(respuesta.body.errors.contrasena).toEqual(
        expect.arrayContaining([
          'La contraseña debe tener al menos 8 caracteres.',
        ]),
      );
    });

    test('registro_conUnCampoNoDeclarado_loRechazaEnLugarDeIgnorarlo', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/register')
        .send({ ...REGISTRO_VALIDO, rol: 'admin' })
        .expect(400);

      expect(respuesta.body.errors.rol).toEqual([
        'Este campo no está permitido.',
      ]);
    });

    test('registro_conEstaturaFueraDeRango_responde400', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/register')
        .send({ ...REGISTRO_VALIDO, estatura: 175 })
        .expect(400);

      expect(Object.keys(respuesta.body.errors)).toEqual(['estatura']);
    });

    test('registro_conDatosCorporales_losDevuelveComoNumeros', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/register')
        .send({
          ...REGISTRO_VALIDO,
          apellidos: 'Gómez',
          edad: 28,
          peso: 70.5,
          estatura: 1.75,
        })
        .expect(201);

      expect(respuesta.body.usuario).toMatchObject({
        apellidos: 'Gómez',
        edad: 28,
        peso: 70.5,
        estatura: 1.75,
      });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await api()
        .post('/api/v1/auth/register')
        .send(REGISTRO_VALIDO)
        .expect(201);
    });

    test('login_conCredencialesValidas_responde200ConTokenDelUsuario', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/login')
        .send({ correo: 'ANA@correo.com', contrasena: 'Segura123' })
        .expect(200);

      const { sub } = app
        .get(JwtService)
        .verify<{ sub: number }>(respuesta.body.token);
      expect(sub).toBe(respuesta.body.usuario.id);
      expect(respuesta.body.usuario).not.toHaveProperty('contrasena');
    });

    test('login_conContrasenaIncorrecta_responde401InvalidCredentials', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/login')
        .send({ correo: 'ana@correo.com', contrasena: 'Equivocada1' })
        .expect(401);

      expect(respuesta.body).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        detail: 'Credenciales incorrectas.',
      });
    });

    test('login_conCorreoNoRegistrado_respondeExactamenteIgualQueConContrasenaIncorrecta', async () => {
      const contrasenaMala = await api()
        .post('/api/v1/auth/login')
        .send({ correo: 'ana@correo.com', contrasena: 'Equivocada1' });
      const correoInexistente = await api()
        .post('/api/v1/auth/login')
        .send({ correo: 'nadie@correo.com', contrasena: 'Equivocada1' });

      expect(correoInexistente.status).toBe(contrasenaMala.status);
      expect(correoInexistente.body).toEqual(contrasenaMala.body);
    });

    test('login_sinContrasena_responde400ConElMensajeDelContrato', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/login')
        .send({ correo: 'ana@correo.com' })
        .expect(400);

      expect(respuesta.body.detail).toBe(
        'El correo y la contraseña son obligatorios y deben ser válidos.',
      );
      expect(respuesta.body.errors).toHaveProperty('contrasena');
    });

    test('login_conJsonMalFormado_responde400SinRomperElServidor', async () => {
      const respuesta = await api()
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"correo":')
        .expect(400);

      expect(respuesta.body.code).toBe('VALIDATION_FAILED');
    });
  });

  test('rutaInexistente_responde404ConFormatoRfc7807', async () => {
    const respuesta = await api().get('/api/v1/no-existe').expect(404);

    expect(respuesta.body).toMatchObject({
      status: 404,
      code: 'ROUTE_NOT_FOUND',
    });
  });
});
