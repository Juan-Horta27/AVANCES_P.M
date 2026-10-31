import { JwtService } from '@nestjs/jwt';
import { Prisma, Usuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { ProblemaException } from '../common/errores/problema.exception';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

// Pruebas unitarias: la base de datos se simula, así se prueban solo las reglas del servicio.
// El comportamiento contra PostgreSQL real se prueba en test/auth.e2e-spec.ts.

const SECRETO_PRUEBAS = 'secreto-solo-para-pruebas-unitarias-0123456789';

function usuarioGuardado(cambios: Partial<Usuario> = {}): Usuario {
  return {
    id: 7,
    nombres: 'Ana',
    apellidos: null,
    correo: 'ana@correo.com',
    contrasena: bcrypt.hashSync('Segura123', 4),
    edad: 30,
    peso: new Prisma.Decimal('62.50'),
    estatura: null,
    rol: 'paciente',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...cambios,
  };
}

function crearServicio() {
  const usuario = { create: jest.fn(), findUnique: jest.fn() };
  const prisma = { usuario } as unknown as PrismaService;
  const jwt = new JwtService({ secret: SECRETO_PRUEBAS });
  return { servicio: new AuthService(prisma, jwt), usuario, jwt };
}

async function capturarProblema(
  promesa: Promise<unknown>,
): Promise<ProblemaException> {
  try {
    await promesa;
  } catch (error) {
    if (error instanceof ProblemaException) return error;
    throw error;
  }
  throw new Error(
    'Se esperaba un ProblemaException y la operación terminó bien',
  );
}

describe('AuthService.registrar', () => {
  test('registrar_conDatosValidos_guardaElHashYNoLaContrasena', async () => {
    const { servicio, usuario } = crearServicio();
    usuario.create.mockResolvedValue(usuarioGuardado());

    await servicio.registrar({
      nombres: 'Ana',
      correo: 'ana@correo.com',
      contrasena: 'Segura123',
    });

    const guardado = usuario.create.mock.calls[0][0].data;
    expect(guardado.contrasena).not.toBe('Segura123');
    expect(await bcrypt.compare('Segura123', guardado.contrasena)).toBe(true);
  });

  test('registrar_conDatosValidos_devuelveTokenConElIdDelUsuario', async () => {
    const { servicio, usuario, jwt } = crearServicio();
    usuario.create.mockResolvedValue(usuarioGuardado());

    const sesion = await servicio.registrar({
      nombres: 'Ana',
      correo: 'ana@correo.com',
      contrasena: 'Segura123',
    });

    expect(jwt.verify(sesion.token)).toMatchObject({ sub: 7, rol: 'paciente' });
  });

  test('registrar_siempre_devuelveElPerfilSinContrasenaYConNumeros', async () => {
    const { servicio, usuario } = crearServicio();
    usuario.create.mockResolvedValue(usuarioGuardado());

    const { usuario: perfil } = await servicio.registrar({
      nombres: 'Ana',
      correo: 'ana@correo.com',
      contrasena: 'Segura123',
    });

    expect(perfil).not.toHaveProperty('contrasena');
    expect(perfil.peso).toBe(62.5);
    expect(perfil.estatura).toBeNull();
  });

  test('registrar_cuandoElCorreoYaExiste_lanzaDuplicateEmail409', async () => {
    const { servicio, usuario } = crearServicio();
    usuario.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );

    const error = await capturarProblema(
      servicio.registrar({
        nombres: 'Ana',
        correo: 'ana@correo.com',
        contrasena: 'Segura123',
      }),
    );

    expect(error.problema).toMatchObject({
      status: 409,
      code: 'DUPLICATE_EMAIL',
    });
  });

  test('registrar_anteUnErrorInesperadoDeLaBase_loPropagaSinDisfrazarlo', async () => {
    const { servicio, usuario } = crearServicio();
    usuario.create.mockRejectedValue(new Error('conexión perdida'));

    await expect(
      servicio.registrar({
        nombres: 'Ana',
        correo: 'ana@correo.com',
        contrasena: 'Segura123',
      }),
    ).rejects.toThrow('conexión perdida');
  });
});

describe('AuthService.iniciarSesion', () => {
  test('iniciarSesion_conCredencialesCorrectas_devuelveSesion', async () => {
    const { servicio, usuario } = crearServicio();
    usuario.findUnique.mockResolvedValue(usuarioGuardado());

    const sesion = await servicio.iniciarSesion({
      correo: 'ana@correo.com',
      contrasena: 'Segura123',
    });

    expect(sesion.usuario.id).toBe(7);
    expect(sesion.token).toEqual(expect.any(String));
  });

  test('iniciarSesion_conContrasenaIncorrecta_lanzaInvalidCredentials401', async () => {
    const { servicio, usuario } = crearServicio();
    usuario.findUnique.mockResolvedValue(usuarioGuardado());

    const error = await capturarProblema(
      servicio.iniciarSesion({
        correo: 'ana@correo.com',
        contrasena: 'Otra1234',
      }),
    );

    expect(error.problema).toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  test('iniciarSesion_conCorreoInexistente_daElMismoErrorQueConContrasenaIncorrecta', async () => {
    const { servicio, usuario } = crearServicio();
    usuario.findUnique.mockResolvedValue(null);

    const error = await capturarProblema(
      servicio.iniciarSesion({
        correo: 'nadie@correo.com',
        contrasena: 'Segura123',
      }),
    );

    // Mismo código y mismo texto: así no se puede averiguar qué correos tienen cuenta (D-06).
    expect(error.problema).toEqual({
      title: 'No autorizado',
      status: 401,
      code: 'INVALID_CREDENTIALS',
      detail: 'Credenciales incorrectas.',
    });
  });
});
