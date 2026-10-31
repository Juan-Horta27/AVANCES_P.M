import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import {
  Cuenta,
  como,
  crearApp,
  crearCuenta,
  crearHabito,
  crearProfesional,
  fechaRelativa,
  limpiarBase,
} from './ayudantes';

// Panel del profesional (ADR-011, M-09; HU-02 Flujo 5): lista de pacientes y progreso por rango.

describe('Panel del profesional (e2e)', () => {
  let app: NestExpressApplication;
  let profesional: Cuenta;
  let paciente: Cuenta;

  beforeAll(async () => {
    app = await crearApp();
  });

  beforeEach(async () => {
    await limpiarBase(app);
    profesional = await crearProfesional(app);
    paciente = await crearCuenta(app, 'carlos@correo.com');
  });

  afterAll(async () => {
    await app.close();
  });

  /** Registra `valor` en el hábito, `dias` días atrás. */
  const registrar = (habitoId: number, dias: number, valor: number) =>
    como(app, paciente)
      .post('/registros', {
        habitoId,
        fecha: fechaRelativa(-dias),
        valorRegistrado: valor,
        clienteId: crypto.randomUUID(),
      })
      .expect(201);

  describe('GET /api/v1/usuarios', () => {
    test('usuarios_conProfesional_listaSoloPacientesSinContrasena', async () => {
      await crearCuenta(app, 'ana@correo.com');

      const respuesta = await como(app, profesional)
        .get('/usuarios?rol=paciente')
        .expect(200);

      // Ambas cuentas de prueba se llaman igual, así que se compara el conjunto, no el orden.
      const correos = respuesta.body.map((u: { correo: string }) => u.correo);
      expect(correos.sort()).toEqual(['ana@correo.com', 'carlos@correo.com']);
      expect(
        respuesta.body.every((u: { rol: string }) => u.rol === 'paciente'),
      ).toBe(true);
      expect(respuesta.body[0]).not.toHaveProperty('contrasena');
    });

    test('usuarios_conPaciente_responde403ForbiddenRole', async () => {
      const respuesta = await como(app, paciente).get('/usuarios').expect(403);

      expect(respuesta.body.code).toBe('FORBIDDEN_ROLE');
    });

    test('usuarios_sinToken_responde401', async () => {
      await request(app.getHttpServer()).get('/api/v1/usuarios').expect(401);
    });

    test('usuarios_conRolNoPermitido_responde400', async () => {
      await como(app, profesional).get('/usuarios?rol=profesional').expect(400);
    });
  });

  describe('GET /api/v1/reportes/progreso', () => {
    test('progreso_conRegistros_devuelveAdherenciaYRachaPorHabito', async () => {
      const agua = await crearHabito(app, paciente, {
        metaInicial: { valorObjetivo: 8 },
      });
      await registrar(agua, 1, 9);
      await registrar(agua, 2, 8);
      await registrar(agua, 3, 5);
      await registrar(agua, 4, 10);

      const respuesta = await como(app, profesional)
        .get(
          `/reportes/progreso?usuarioId=${paciente.id}&fechaInicio=${fechaRelativa(-6)}&fechaFin=${fechaRelativa(0)}`,
        )
        .expect(200);

      expect(respuesta.body.paciente.correo).toBe('carlos@correo.com');
      expect(respuesta.body.habitos).toEqual([
        expect.objectContaining({
          habitoId: agua,
          metaActiva: 8,
          diasEvaluados: 4,
          diasCumplidos: 3,
          porcentajeAdherencia: 75,
          rachaMaxima: 2,
        }),
      ]);
      expect(respuesta.body.totales).toEqual({
        diasEvaluados: 4,
        diasCumplidos: 3,
        porcentajeAdherencia: 75,
      });
    });

    test('progreso_soloCuentaLosRegistrosDentroDelRango', async () => {
      const agua = await crearHabito(app, paciente, {
        metaInicial: { valorObjetivo: 8 },
      });
      await registrar(agua, 1, 9);
      await registrar(agua, 10, 9);

      const respuesta = await como(app, profesional)
        .get(
          `/reportes/progreso?usuarioId=${paciente.id}&fechaInicio=${fechaRelativa(-5)}&fechaFin=${fechaRelativa(0)}`,
        )
        .expect(200);

      expect(respuesta.body.habitos[0].diasEvaluados).toBe(1);
    });

    test('progreso_conPaciente_responde403ForbiddenRole', async () => {
      const respuesta = await como(app, paciente)
        .get(
          `/reportes/progreso?usuarioId=${paciente.id}&fechaInicio=2026-10-01&fechaFin=2026-10-31`,
        )
        .expect(403);

      expect(respuesta.body.code).toBe('FORBIDDEN_ROLE');
    });

    test('progreso_deUnProfesional_responde404PatientNotFound', async () => {
      const respuesta = await como(app, profesional)
        .get(
          `/reportes/progreso?usuarioId=${profesional.id}&fechaInicio=2026-10-01&fechaFin=2026-10-31`,
        )
        .expect(404);

      expect(respuesta.body.code).toBe('PATIENT_NOT_FOUND');
    });

    test('progreso_fechaInicialPosterior_responde422', async () => {
      await como(app, profesional)
        .get(
          `/reportes/progreso?usuarioId=${paciente.id}&fechaInicio=2026-10-31&fechaFin=2026-10-01`,
        )
        .expect(422);
    });

    test('progreso_sinParametros_responde400ConErroresPorCampo', async () => {
      const respuesta = await como(app, profesional)
        .get('/reportes/progreso')
        .expect(400);

      expect(Object.keys(respuesta.body.errors).sort()).toEqual([
        'fechaFin',
        'fechaInicio',
        'usuarioId',
      ]);
    });
  });
});
