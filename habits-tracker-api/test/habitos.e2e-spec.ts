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

// Hábitos (api-contract.md E-04 a E-08), con TC-002 (rachas) y TC-003 (borrado / archivado).

describe('Hábitos (e2e)', () => {
  let app: NestExpressApplication;
  let ana: Cuenta;
  let beto: Cuenta;

  beforeAll(async () => {
    app = await crearApp();
  });

  beforeEach(async () => {
    await limpiarBase(app);
    ana = await crearCuenta(app, 'ana@correo.com');
    beto = await crearCuenta(app, 'beto@correo.com');
  });

  afterAll(async () => {
    await app.close();
  });

  async function registrar(
    cuenta: Cuenta,
    habitoId: number,
    fecha: string,
    valor: number,
  ) {
    await como(app, cuenta)
      .post('/registros', {
        habitoId,
        fecha,
        valorRegistrado: valor,
        clienteId: nuevoClienteId(),
      })
      .expect(201);
  }

  describe('POST /habitos', () => {
    test('crear_conMetaInicial_responde201ConLaMetaActivaYRachaCero', async () => {
      const respuesta = await como(app, ana)
        .post('/habitos', {
          categoriaHabitoId: 1,
          nombre: '  Beber agua ',
          descripcion: 'Durante el día',
          unidadMedida: 'vasos',
          metaInicial: { valorObjetivo: 8 },
        })
        .expect(201);

      expect(respuesta.body).toEqual({
        id: expect.any(Number),
        categoriaHabitoId: 1,
        nombre: 'Beber agua',
        descripcion: 'Durante el día',
        unidadMedida: 'vasos',
        frecuencia: 'diaria',
        activo: true,
        rachaActual: 0,
        rachaMaxima: 0,
        metaActiva: {
          id: expect.any(Number),
          habitoId: respuesta.body.id,
          valorObjetivo: 8,
          descripcion: null,
          activa: true,
        },
      });
    });

    test('crear_sinNombre_responde400ConElMensajeDelContrato', async () => {
      const respuesta = await como(app, ana)
        .post('/habitos', { categoriaHabitoId: 1, unidadMedida: 'vasos' })
        .expect(400);

      expect(respuesta.body.detail).toBe(
        'Faltan datos obligatorios para crear el hábito.',
      );
      expect(respuesta.body.errors).toHaveProperty('nombre');
    });

    test('crear_conCategoriaInexistente_responde404CategoryNotFound', async () => {
      const respuesta = await como(app, ana)
        .post('/habitos', {
          categoriaHabitoId: 999,
          nombre: 'Leer',
          unidadMedida: 'páginas',
        })
        .expect(404);

      expect(respuesta.body.code).toBe('CATEGORY_NOT_FOUND');
    });

    test('crear_conMetaInicialEnCero_responde422ReglaDeNegocio', async () => {
      const respuesta = await como(app, ana)
        .post('/habitos', {
          categoriaHabitoId: 1,
          nombre: 'Beber agua',
          unidadMedida: 'vasos',
          metaInicial: { valorObjetivo: 0 },
        })
        .expect(422);

      expect(respuesta.body.code).toBe('BUSINESS_RULE_VIOLATION');
    });

    test('crear_conMetaInicialNoNumerica_responde400ConLaRutaDelCampo', async () => {
      const respuesta = await como(app, ana)
        .post('/habitos', {
          categoriaHabitoId: 1,
          nombre: 'Beber agua',
          unidadMedida: 'vasos',
          metaInicial: { valorObjetivo: 'ocho' },
        })
        .expect(400);

      expect(respuesta.body.errors).toHaveProperty([
        'metaInicial.valorObjetivo',
      ]);
    });

    test('crear_conUsuarioIdEnElCuerpo_loRechaza', async () => {
      // D-03: el dueño sale del token; enviar usuarioId no debe permitir escribir en otra cuenta.
      const respuesta = await como(app, ana)
        .post('/habitos', {
          categoriaHabitoId: 1,
          nombre: 'Beber agua',
          unidadMedida: 'vasos',
          usuarioId: beto.id,
        })
        .expect(400);

      expect(respuesta.body.errors.usuarioId).toEqual([
        'Este campo no está permitido.',
      ]);
    });
  });

  describe('GET /habitos y GET /habitos/:id', () => {
    test('listar_soloDevuelveLosHabitosDelUsuarioDelToken', async () => {
      await crearHabito(app, ana, { nombre: 'De Ana' });
      await crearHabito(app, beto, { nombre: 'De Beto' });

      const respuesta = await como(app, ana).get('/habitos').expect(200);

      expect(respuesta.body.map((h: { nombre: string }) => h.nombre)).toEqual([
        'De Ana',
      ]);
    });

    test('listar_sinHabitos_devuelveArregloVacioYNoNull', async () => {
      const respuesta = await como(app, ana).get('/habitos').expect(200);

      expect(respuesta.body).toEqual([]);
    });

    test('obtener_habitoDeOtraPersona_responde403', async () => {
      const deBeto = await crearHabito(app, beto);

      const respuesta = await como(app, ana)
        .get(`/habitos/${deBeto}`)
        .expect(403);

      expect(respuesta.body).toMatchObject({
        code: 'FORBIDDEN_RESOURCE',
        detail: 'No tienes permiso para acceder a este hábito.',
      });
    });

    test('obtener_habitoInexistente_responde404HabitNotFound', async () => {
      const respuesta = await como(app, ana).get('/habitos/999').expect(404);

      expect(respuesta.body).toMatchObject({
        code: 'HABIT_NOT_FOUND',
        detail: 'El hábito solicitado no fue encontrado.',
      });
    });

    test('obtener_habitoPropio_incluyeCategoriaEHistorialDeMetas', async () => {
      const id = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });

      const respuesta = await como(app, ana).get(`/habitos/${id}`).expect(200);

      expect(respuesta.body.categoria).toEqual({
        id: 1,
        nombre: 'Hidratación',
        icono: '💧',
      });
      expect(respuesta.body.metas).toHaveLength(1);
    });

    test('listar_conRegistros_calculaRachaActualYMaxima_TC002', async () => {
      const id = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 30 },
      });
      // Tramo actual: hoy, ayer y anteayer. Hace 3 días no cumplió. Tramo antiguo: 4 a 8 días atrás.
      for (const dias of [0, -1, -2])
        await registrar(ana, id, fechaRelativa(dias), 35);
      await registrar(ana, id, fechaRelativa(-3), 10);
      for (const dias of [-4, -5, -6, -7, -8])
        await registrar(ana, id, fechaRelativa(dias), 50);

      const respuesta = await como(app, ana).get('/habitos').expect(200);

      expect(respuesta.body[0]).toMatchObject({
        rachaActual: 3,
        rachaMaxima: 5,
      });
    });
  });

  describe('PUT /habitos/:id', () => {
    test('actualizar_soloCambiaLosCamposEnviados', async () => {
      const id = await crearHabito(app, ana);

      const respuesta = await como(app, ana)
        .put(`/habitos/${id}`, { unidadMedida: 'litros' })
        .expect(200);

      expect(respuesta.body).toMatchObject({
        nombre: 'Beber agua',
        unidadMedida: 'litros',
      });
    });

    test('actualizar_habitoDeOtraPersona_responde403SinModificarlo', async () => {
      const deBeto = await crearHabito(app, beto);

      await como(app, ana)
        .put(`/habitos/${deBeto}`, { nombre: 'Robado' })
        .expect(403);

      const deBetoAhora = await como(app, beto)
        .get(`/habitos/${deBeto}`)
        .expect(200);
      expect(deBetoAhora.body.nombre).toBe('Beber agua');
    });

    test('actualizar_conCategoria_loRechazaPorqueNoEsModificable', async () => {
      const id = await crearHabito(app, ana);

      await como(app, ana)
        .put(`/habitos/${id}`, { categoriaHabitoId: 2 })
        .expect(400);
    });
  });

  describe('DELETE /habitos/:id (TC-003, ADR-008 D-10)', () => {
    test('eliminar_habitoSinRegistros_loBorraFisicamenteConSusMetas', async () => {
      const id = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 20 },
      });

      await como(app, ana).delete(`/habitos/${id}`).expect(204);

      await como(app, ana).get(`/habitos/${id}`).expect(404);
      const metas = await como(app, ana).get('/metas').expect(200);
      expect(metas.body).toEqual([]);
    });

    test('eliminar_habitoConRegistros_loArchivaYConservaSusRegistros', async () => {
      const id = await crearHabito(app, ana, {
        metaInicial: { valorObjetivo: 8 },
      });
      await registrar(ana, id, fechaRelativa(0), 9);

      await como(app, ana).delete(`/habitos/${id}`).expect(204);

      const activos = await como(app, ana).get('/habitos').expect(200);
      expect(activos.body).toEqual([]);
      const todos = await como(app, ana)
        .get('/habitos?activos=false')
        .expect(200);
      expect(todos.body).toEqual([
        expect.objectContaining({ id, activo: false }),
      ]);
      const registros = await como(app, ana).get('/registros').expect(200);
      expect(registros.body.total).toBe(1);
    });

    test('eliminar_habitoArchivado_puedeReactivarseConPut', async () => {
      const id = await crearHabito(app, ana);
      await registrar(ana, id, fechaRelativa(0), 1);
      await como(app, ana).delete(`/habitos/${id}`).expect(204);

      await como(app, ana).put(`/habitos/${id}`, { activo: true }).expect(200);

      const activos = await como(app, ana).get('/habitos').expect(200);
      expect(activos.body).toEqual([
        expect.objectContaining({ id, activo: true }),
      ]);
    });

    test('eliminar_habitoDeOtraPersona_responde403', async () => {
      const deBeto = await crearHabito(app, beto);

      const respuesta = await como(app, ana)
        .delete(`/habitos/${deBeto}`)
        .expect(403);

      expect(respuesta.body.detail).toBe(
        'No tienes permiso para eliminar este hábito.',
      );
    });

    test('eliminar_habitoInexistente_responde404', async () => {
      const respuesta = await como(app, ana).delete('/habitos/999').expect(404);

      expect(respuesta.body.detail).toBe('El hábito no existe.');
    });
  });
});
