import type { NestExpressApplication } from '@nestjs/platform-express';

import {
  Cuenta,
  como,
  crearApp,
  crearCuenta,
  crearHabito,
  fechaRelativa,
  limpiarBase,
  nuevoClienteId,
} from './ayudantes';

// Registros diarios (api-contract.md E-11, E-12, E-12b): TC-001, idempotencia y meta cumplida.

describe('Registros (e2e)', () => {
  let app: NestExpressApplication;
  let ana: Cuenta;
  let agua: number;

  beforeAll(async () => {
    app = await crearApp();
  });

  beforeEach(async () => {
    await limpiarBase(app);
    ana = await crearCuenta(app);
    agua = await crearHabito(app, ana, { metaInicial: { valorObjetivo: 8 } });
  });

  afterAll(async () => {
    await app.close();
  });

  const registro = (cambios: object = {}) => ({
    habitoId: agua,
    fecha: fechaRelativa(0),
    valorRegistrado: 9,
    clienteId: nuevoClienteId(),
    ...cambios,
  });

  describe('POST /registros', () => {
    test('crear_conValorQueAlcanzaLaMeta_responde201ConMetaCumplida', async () => {
      const respuesta = await como(app, ana)
        .post('/registros', registro({ notas: '  Después de entrenar ' }))
        .expect(201);

      expect(respuesta.body).toEqual({
        id: expect.any(Number),
        habitoId: agua,
        fecha: fechaRelativa(0),
        valorRegistrado: 9,
        metaCumplida: true,
        notas: 'Después de entrenar',
      });
    });

    test('crear_conValorIgualALaMeta_cuentaComoCumplida', async () => {
      const respuesta = await como(app, ana)
        .post('/registros', registro({ valorRegistrado: 8 }))
        .expect(201);

      expect(respuesta.body.metaCumplida).toBe(true);
    });

    test('crear_conValorMenorALaMeta_noCumple', async () => {
      const respuesta = await como(app, ana)
        .post('/registros', registro({ valorRegistrado: 5 }))
        .expect(201);

      expect(respuesta.body.metaCumplida).toBe(false);
    });

    test('crear_enHabitoSinMetaActiva_quedaSinCumplir', async () => {
      const meditar = await crearHabito(app, ana, { nombre: 'Meditar' });

      const respuesta = await como(app, ana)
        .post(
          '/registros',
          registro({ habitoId: meditar, valorRegistrado: 100 }),
        )
        .expect(201);

      expect(respuesta.body.metaCumplida).toBe(false);
    });

    test('crear_dosVecesElMismoHabitoYFecha_responde409DuplicateDailyLog_TC001', async () => {
      await como(app, ana).post('/registros', registro()).expect(201);

      const respuesta = await como(app, ana)
        .post('/registros', registro({ valorRegistrado: 5 }))
        .expect(409);

      expect(respuesta.body).toMatchObject({
        code: 'DUPLICATE_DAILY_LOG',
        detail: 'Ya existe un registro para este hábito en la fecha indicada.',
      });
    });

    test('crear_mismoHabitoOtraFecha_oOtroHabitoMismaFecha_estanPermitidos_TC001pasos8y9', async () => {
      const caminar = await crearHabito(app, ana, { nombre: 'Caminar' });
      await como(app, ana).post('/registros', registro()).expect(201);

      await como(app, ana)
        .post('/registros', registro({ fecha: fechaRelativa(-1) }))
        .expect(201);
      await como(app, ana)
        .post('/registros', registro({ habitoId: caminar }))
        .expect(201);
    });

    test('crear_reenviadoConMismoClienteIdYCuerpo_responde200ConElMismoRegistro', async () => {
      const cuerpo = registro();
      const primero = await como(app, ana)
        .post('/registros', cuerpo)
        .expect(201);

      const reenvio = await como(app, ana)
        .post('/registros', cuerpo)
        .expect(200);

      expect(reenvio.body).toEqual(primero.body);
      const lista = await como(app, ana).get('/registros').expect(200);
      expect(lista.body.total).toBe(1);
    });

    test('crear_mismoClienteIdConOtroCuerpo_responde409IdempotencyConflict', async () => {
      const cuerpo = registro();
      await como(app, ana).post('/registros', cuerpo).expect(201);

      const respuesta = await como(app, ana)
        .post('/registros', { ...cuerpo, valorRegistrado: 3 })
        .expect(409);

      expect(respuesta.body.code).toBe('IDEMPOTENCY_CONFLICT');
    });

    test('crear_conElClienteIdDeOtraPersona_noDevuelveSusDatos', async () => {
      const cuerpo = registro();
      await como(app, ana).post('/registros', cuerpo).expect(201);
      const beto = await crearCuenta(app, 'beto@correo.com');

      const respuesta = await como(app, beto)
        .post('/registros', cuerpo)
        .expect(409);

      expect(respuesta.body.code).toBe('IDEMPOTENCY_CONFLICT');
      expect(respuesta.body).not.toHaveProperty('valorRegistrado');
    });

    test('crear_enHabitoDeOtraPersona_responde403', async () => {
      const beto = await crearCuenta(app, 'beto@correo.com');
      const deBeto = await crearHabito(app, beto);

      const respuesta = await como(app, ana)
        .post('/registros', registro({ habitoId: deBeto }))
        .expect(403);

      expect(respuesta.body.code).toBe('FORBIDDEN_RESOURCE');
    });

    test('crear_enHabitoArchivado_responde404', async () => {
      await como(app, ana).post('/registros', registro()).expect(201);
      await como(app, ana).delete(`/habitos/${agua}`).expect(204); // tiene registros: se archiva

      const respuesta = await como(app, ana)
        .post('/registros', registro({ fecha: fechaRelativa(-1) }))
        .expect(404);

      expect(respuesta.body.detail).toBe(
        'El hábito indicado no está disponible.',
      );
    });

    test('crear_conFechaFutura_responde422', async () => {
      const respuesta = await como(app, ana)
        .post('/registros', registro({ fecha: fechaRelativa(1) }))
        .expect(422);

      expect(respuesta.body.detail).toBe(
        'No se puede registrar una fecha futura.',
      );
    });

    test('crear_conFechaInexistente_responde400ConElMensajeDelContrato', async () => {
      const respuesta = await como(app, ana)
        .post('/registros', registro({ fecha: '2026-02-30' }))
        .expect(400);

      expect(respuesta.body.detail).toBe(
        'La fecha debe tener formato YYYY-MM-DD y el valor registrado no puede ser negativo.',
      );
      expect(Object.keys(respuesta.body.errors)).toEqual(['fecha']);
    });

    test('crear_conValorNegativo_responde400', async () => {
      const respuesta = await como(app, ana)
        .post('/registros', registro({ valorRegistrado: -1 }))
        .expect(400);

      expect(respuesta.body.errors.valorRegistrado).toEqual([
        'El valor registrado no puede ser negativo.',
      ]);
    });

    test('crear_sinClienteId_responde400', async () => {
      const sinClave = {
        habitoId: agua,
        fecha: fechaRelativa(0),
        valorRegistrado: 9,
      };

      const respuesta = await como(app, ana)
        .post('/registros', sinClave)
        .expect(400);

      expect(respuesta.body.errors).toHaveProperty('clienteId');
    });

    test('metaCumplida_quedaCongeladaAunqueLaMetaCambieDespues_TC004paso12', async () => {
      const original = await como(app, ana)
        .post('/registros', registro({ valorRegistrado: 9 }))
        .expect(201);
      const meta = (await como(app, ana).get('/metas').expect(200)).body[0].id;
      await como(app, ana)
        .patch(`/metas/${meta}`, { activa: false })
        .expect(200);
      await como(app, ana)
        .post('/metas', { habitoId: agua, valorObjetivo: 20 })
        .expect(201);

      const lista = await como(app, ana).get('/registros').expect(200);

      expect(lista.body.items).toEqual([
        expect.objectContaining({ id: original.body.id, metaCumplida: true }),
      ]);
    });
  });

  describe('GET /registros', () => {
    beforeEach(async () => {
      for (const dias of [0, -1, -2, -3, -4]) {
        await como(app, ana)
          .post('/registros', registro({ fecha: fechaRelativa(dias) }))
          .expect(201);
      }
    });

    test('listar_paginaEnOrdenDelMasRecienteAlMasAntiguo', async () => {
      const respuesta = await como(app, ana)
        .get('/registros?page=1&size=2')
        .expect(200);

      expect(respuesta.body).toMatchObject({
        page: 1,
        size: 2,
        total: 5,
        totalPages: 3,
      });
      expect(
        respuesta.body.items.map((r: { fecha: string }) => r.fecha),
      ).toEqual([fechaRelativa(0), fechaRelativa(-1)]);
    });

    test('listar_conFromIncluidoYToExcluido_filtraPorRango', async () => {
      const respuesta = await como(app, ana)
        .get(`/registros?from=${fechaRelativa(-3)}&to=${fechaRelativa(-1)}`)
        .expect(200);

      expect(
        respuesta.body.items.map((r: { fecha: string }) => r.fecha),
      ).toEqual([fechaRelativa(-2), fechaRelativa(-3)]);
    });

    test('listar_noIncluyeRegistrosDeOtrasPersonas', async () => {
      const beto = await crearCuenta(app, 'beto@correo.com');

      const respuesta = await como(app, beto).get('/registros').expect(200);

      expect(respuesta.body).toMatchObject({ items: [], total: 0 });
    });

    test('listar_conSizeMayorA100_responde400', async () => {
      await como(app, ana).get('/registros?size=101').expect(400);
    });
  });

  describe('DELETE /registros/:id', () => {
    test('eliminar_registroPropio_responde204YLaRachaSeRecalcula', async () => {
      const hoy = await como(app, ana)
        .post('/registros', registro())
        .expect(201);
      await como(app, ana)
        .post('/registros', registro({ fecha: fechaRelativa(-1) }))
        .expect(201);

      await como(app, ana).delete(`/registros/${hoy.body.id}`).expect(204);

      // TC-002 paso 8: sin el registro de hoy, la racha cuenta hasta ayer y no baja a cero.
      const habitos = await como(app, ana).get('/habitos').expect(200);
      expect(habitos.body[0]).toMatchObject({ rachaActual: 1, rachaMaxima: 1 });
    });

    test('eliminar_registroDeOtraPersona_responde404DailyLogNotFound', async () => {
      const deAna = await como(app, ana)
        .post('/registros', registro())
        .expect(201);
      const beto = await crearCuenta(app, 'beto@correo.com');

      const respuesta = await como(app, beto)
        .delete(`/registros/${deAna.body.id}`)
        .expect(404);

      expect(respuesta.body.code).toBe('DAILY_LOG_NOT_FOUND');
      await como(app, ana).get('/registros').expect(200);
    });
  });
});
