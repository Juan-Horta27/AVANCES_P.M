import type { NestExpressApplication } from '@nestjs/platform-express';

import {
  Cuenta,
  como,
  crearApp,
  crearCuenta,
  crearHabito,
  limpiarBase,
} from './ayudantes';

// Metas (api-contract.md E-09, E-10, E-10b) y TC-004: una sola meta activa por hábito.

describe('Metas (e2e)', () => {
  let app: NestExpressApplication;
  let ana: Cuenta;
  let agua: number;

  beforeAll(async () => {
    app = await crearApp();
  });

  beforeEach(async () => {
    await limpiarBase(app);
    ana = await crearCuenta(app);
    agua = await crearHabito(app, ana, {
      nombre: 'Beber agua',
      metaInicial: { valorObjetivo: 8 },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const crearMeta = (habitoId: number, valorObjetivo: number) =>
    como(app, ana).post('/metas', {
      habitoId,
      valorObjetivo,
      descripcion: `${valorObjetivo} al día`,
    });

  test('crear_cuandoElHabitoYaTieneMetaActiva_responde409ActiveGoalExists_TC004paso3', async () => {
    const respuesta = await crearMeta(agua, 2000).expect(409);

    expect(respuesta.body).toMatchObject({
      code: 'ACTIVE_GOAL_EXISTS',
      detail:
        'Este hábito ya tiene una meta activa. Desactívala antes de crear otra.',
    });
  });

  test('crear_enHabitoSinMetaActiva_nace201Activa_TC004paso4', async () => {
    const meditar = await crearHabito(app, ana, { nombre: 'Meditar' });

    const respuesta = await crearMeta(meditar, 10).expect(201);

    expect(respuesta.body).toMatchObject({
      habitoId: meditar,
      valorObjetivo: 10,
      activa: true,
    });
  });

  test('reactivar_cuandoHayOtraActiva_responde409_TC004paso6', async () => {
    const meditar = await crearHabito(app, ana, { nombre: 'Meditar' });
    const antigua = (await crearMeta(meditar, 10).expect(201)).body.id;
    await como(app, ana)
      .patch(`/metas/${antigua}`, { activa: false })
      .expect(200);
    await crearMeta(meditar, 20).expect(201);

    const respuesta = await como(app, ana)
      .patch(`/metas/${antigua}`, { activa: true })
      .expect(409);

    expect(respuesta.body.detail).toBe(
      'Ya hay otra meta activa para este hábito. Desactívala primero.',
    );
  });

  test('desactivar_siempreEstaPermitido_yLuegoSePuedeReactivarOtra_TC004pasos7y8', async () => {
    const metas = await como(app, ana)
      .get(`/metas?habitoId=${agua}`)
      .expect(200);
    const activa = metas.body[0].id;

    await como(app, ana)
      .patch(`/metas/${activa}`, { activa: false })
      .expect(200);
    const nueva = await crearMeta(agua, 10).expect(201);

    expect(nueva.body.activa).toBe(true);
  });

  test('crear_conValorObjetivoCero_responde422', async () => {
    const respuesta = await crearMeta(agua, 0).expect(422);

    expect(respuesta.body.detail).toBe(
      'El valor objetivo de la meta debe ser mayor que cero.',
    );
  });

  test('crear_enHabitoDeOtraPersona_responde404SinRevelarQueExiste', async () => {
    const beto = await crearCuenta(app, 'beto@correo.com');
    const deBeto = await crearHabito(app, beto);

    const respuesta = await crearMeta(deBeto, 5).expect(404);

    expect(respuesta.body).toMatchObject({
      code: 'HABIT_NOT_FOUND',
      detail: 'El hábito especificado no existe o no te pertenece.',
    });
  });

  test('cambiarEstado_deMetaAjenaOInexistente_responde404GoalNotFound', async () => {
    const beto = await crearCuenta(app, 'beto@correo.com');
    await crearHabito(app, beto, { metaInicial: { valorObjetivo: 3 } });
    const metaDeBeto = (await como(app, beto).get('/metas').expect(200)).body[0]
      .id;

    await como(app, ana)
      .patch(`/metas/${metaDeBeto}`, { activa: false })
      .expect(404);
    const respuesta = await como(app, ana)
      .patch('/metas/999', { activa: false })
      .expect(404);
    expect(respuesta.body.code).toBe('GOAL_NOT_FOUND');
  });

  test('listar_conFiltroActivas0_devuelveSoloLasInactivas', async () => {
    const activa = (await como(app, ana).get('/metas').expect(200)).body[0].id;
    await como(app, ana)
      .patch(`/metas/${activa}`, { activa: false })
      .expect(200);
    await crearMeta(agua, 10).expect(201);

    const inactivas = await como(app, ana).get('/metas?activas=0').expect(200);

    expect(inactivas.body).toEqual([
      expect.objectContaining({ id: activa, activa: false }),
    ]);
  });
});
