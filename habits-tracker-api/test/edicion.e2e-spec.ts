import type { NestExpressApplication } from '@nestjs/platform-express';

import {
  Cuenta,
  como,
  crearApp,
  crearCuenta,
  crearHabito,
  fechaRelativa,
  limpiarBase,
} from './ayudantes';

// Edición de metas y registros (ADR-011, C-04): con ella Habito, Meta y RegistroDiario tienen
// CRUD completo (guía del proyecto de aula §3).

describe('Edición de metas y registros (e2e)', () => {
  let app: NestExpressApplication;
  let ana: Cuenta;

  beforeAll(async () => {
    app = await crearApp();
  });

  beforeEach(async () => {
    await limpiarBase(app);
    ana = await crearCuenta(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const metaActivaDe = async (habitoId: number) => {
    const respuesta = await como(app, ana)
      .get(`/metas?habitoId=${habitoId}&activas=1`)
      .expect(200);
    return respuesta.body[0];
  };

  const registrar = async (habitoId: number, dias: number, valor: number) => {
    const respuesta = await como(app, ana)
      .post('/registros', {
        habitoId,
        fecha: fechaRelativa(-dias),
        valorRegistrado: valor,
        clienteId: crypto.randomUUID(),
      })
      .expect(201);
    return respuesta.body;
  };

  describe('PATCH /api/v1/metas/:id', () => {
    test('editarMeta_valorYDescripcion_responde200ConLosCambios', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const meta = await metaActivaDe(habito);

      const respuesta = await como(app, ana)
        .patch(`/metas/${meta.id}`, {
          valorObjetivo: 10,
          descripcion: 'Diez vasos',
        })
        .expect(200);

      expect(respuesta.body).toMatchObject({
        id: meta.id,
        valorObjetivo: 10,
        descripcion: 'Diez vasos',
        activa: true,
      });
    });

    test('editarMeta_noReescribeLosRegistrosYaEvaluados_D18', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const meta = await metaActivaDe(habito);
      const registro = await registrar(habito, 1, 9);

      await como(app, ana)
        .patch(`/metas/${meta.id}`, { valorObjetivo: 12 })
        .expect(200);

      const lista = await como(app, ana)
        .get(`/registros?habitoId=${habito}`)
        .expect(200);
      expect(lista.body.items[0]).toMatchObject({
        id: registro.id,
        metaCumplida: true,
      });
    });

    test('editarMeta_descripcionVacia_laBorra', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const meta = await metaActivaDe(habito);

      const respuesta = await como(app, ana)
        .patch(`/metas/${meta.id}`, { descripcion: '   ' })
        .expect(200);

      expect(respuesta.body.descripcion).toBeNull();
    });

    test('editarMeta_valorCero_responde422', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const meta = await metaActivaDe(habito);

      const respuesta = await como(app, ana)
        .patch(`/metas/${meta.id}`, { valorObjetivo: 0 })
        .expect(422);

      expect(respuesta.body.detail).toBe(
        'El valor objetivo de la meta debe ser mayor que cero.',
      );
    });

    test('editarMeta_sinCampos_responde400', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const meta = await metaActivaDe(habito);

      const respuesta = await como(app, ana)
        .patch(`/metas/${meta.id}`, {})
        .expect(400);

      expect(respuesta.body.code).toBe('VALIDATION_FAILED');
    });

    test('editarMeta_ajena_responde404GoalNotFound', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const meta = await metaActivaDe(habito);
      const bruno = await crearCuenta(app, 'bruno@correo.com');

      const respuesta = await como(app, bruno)
        .patch(`/metas/${meta.id}`, { valorObjetivo: 5 })
        .expect(404);

      expect(respuesta.body.code).toBe('GOAL_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/metas/:id', () => {
    test('eliminarMeta_responde204YConservaLosRegistros', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const meta = await metaActivaDe(habito);
      await registrar(habito, 1, 9);

      await como(app, ana).delete(`/metas/${meta.id}`).expect(204);

      const metas = await como(app, ana)
        .get(`/metas?habitoId=${habito}`)
        .expect(200);
      expect(metas.body).toEqual([]);
      const registros = await como(app, ana)
        .get(`/registros?habitoId=${habito}`)
        .expect(200);
      expect(registros.body.items[0].metaCumplida).toBe(true);
    });

    test('eliminarMeta_dosVeces_responde404', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const meta = await metaActivaDe(habito);
      await como(app, ana).delete(`/metas/${meta.id}`).expect(204);

      await como(app, ana).delete(`/metas/${meta.id}`).expect(404);
    });
  });

  describe('PUT /api/v1/registros/:id', () => {
    test('editarRegistro_valorQueYaNoCumple_recalculaMetaCumplidaYLaRacha', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const hoy = await registrar(habito, 0, 9);
      await registrar(habito, 1, 9);

      const respuesta = await como(app, ana)
        .put(`/registros/${hoy.id}`, { valorRegistrado: 5 })
        .expect(200);

      expect(respuesta.body).toMatchObject({
        id: hoy.id,
        valorRegistrado: 5,
        metaCumplida: false,
      });
      const habitos = await como(app, ana).get('/habitos').expect(200);
      // Hoy ya no cumple; ayer sí: la racha actual queda en 1 (tolerancia de un día).
      expect(habitos.body[0].rachaActual).toBe(1);
    });

    test('editarRegistro_soloNotas_conservaMetaCumplida', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const registro = await registrar(habito, 0, 9);

      const respuesta = await como(app, ana)
        .put(`/registros/${registro.id}`, { notas: 'Después de entrenar' })
        .expect(200);

      expect(respuesta.body).toMatchObject({
        notas: 'Después de entrenar',
        metaCumplida: true,
        valorRegistrado: 9,
      });
    });

    test('editarRegistro_notasVacias_lasBorra', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const registro = await registrar(habito, 0, 9);
      await como(app, ana)
        .put(`/registros/${registro.id}`, { notas: 'algo' })
        .expect(200);

      const respuesta = await como(app, ana)
        .put(`/registros/${registro.id}`, { notas: '' })
        .expect(200);

      expect(respuesta.body.notas).toBeNull();
    });

    test.each([
      ['sinCampos', {}],
      ['valorNegativo', { valorRegistrado: -1 }],
      ['conFecha', { fecha: '2026-01-01' }],
      ['conHabito', { habitoId: 99 }],
    ])('editarRegistro_%s_responde400', async (_caso, cuerpo) => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const registro = await registrar(habito, 0, 9);

      const respuesta = await como(app, ana)
        .put(`/registros/${registro.id}`, cuerpo)
        .expect(400);

      expect(respuesta.body.code).toBe('VALIDATION_FAILED');
    });

    test('editarRegistro_ajeno_responde404DailyLogNotFound', async () => {
      const habito = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      const registro = await registrar(habito, 0, 9);
      const bruno = await crearCuenta(app, 'bruno@correo.com');

      const respuesta = await como(app, bruno)
        .put(`/registros/${registro.id}`, { valorRegistrado: 1 })
        .expect(404);

      expect(respuesta.body.code).toBe('DAILY_LOG_NOT_FOUND');
    });
  });
});
