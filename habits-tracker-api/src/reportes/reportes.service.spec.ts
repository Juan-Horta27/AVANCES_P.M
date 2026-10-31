import { Prisma, Usuario } from '@prisma/client';

import { ProblemaException } from '../common/errores/problema.exception';
import { aFechaBD } from '../common/fechas';
import { PrismaService } from '../prisma/prisma.service';
import { ReportesService } from './reportes.service';

// Pruebas unitarias del reporte del profesional (M-09): la base se simula y se comprueban
// solo los cálculos y las reglas. Contra PostgreSQL real: test/reportes.e2e-spec.ts.

function paciente(cambios: Partial<Usuario> = {}): Usuario {
  return {
    id: 5,
    nombres: 'Carlos',
    apellidos: 'Gómez',
    correo: 'carlos@correo.com',
    contrasena: 'hash',
    edad: 28,
    peso: null,
    estatura: null,
    rol: 'paciente',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...cambios,
  };
}

function habito(
  id: number,
  registros: Array<[string, boolean]>,
  cambios: { activo?: boolean; meta?: number } = {},
) {
  return {
    id,
    nombre: `Hábito ${id}`,
    unidadMedida: 'vasos',
    activo: cambios.activo ?? true,
    categoria: { nombre: 'Hidratación', icono: '💧' },
    metas:
      cambios.meta === undefined
        ? []
        : [{ valorObjetivo: new Prisma.Decimal(cambios.meta) }],
    registros: registros.map(([fecha, metaCumplida]) => ({
      fecha: aFechaBD(fecha),
      metaCumplida,
    })),
  };
}

function crearServicio() {
  const usuario = { findUnique: jest.fn() };
  const habitoRepo = { findMany: jest.fn() };
  const prisma = { usuario, habito: habitoRepo } as unknown as PrismaService;
  return { servicio: new ReportesService(prisma), usuario, habito: habitoRepo };
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

describe('ReportesService.progreso', () => {
  test('progreso_conRegistros_calculaAdherenciaYRachaMaximaDelRango', async () => {
    const { servicio, usuario, habito: repo } = crearServicio();
    usuario.findUnique.mockResolvedValue(paciente());
    repo.findMany.mockResolvedValue([
      habito(
        1,
        [
          ['2026-10-01', true],
          ['2026-10-02', true],
          ['2026-10-03', true],
          ['2026-10-04', false],
          ['2026-10-05', true],
          ['2026-10-06', true],
        ],
        { meta: 8 },
      ),
    ]);

    const reporte = await servicio.progreso(5, '2026-10-01', '2026-10-31');

    expect(reporte.habitos[0]).toMatchObject({
      habitoId: 1,
      metaActiva: 8,
      diasEvaluados: 6,
      diasCumplidos: 5,
      porcentajeAdherencia: 83,
      rachaMaxima: 3,
    });
    expect(reporte.totales).toEqual({
      diasEvaluados: 6,
      diasCumplidos: 5,
      porcentajeAdherencia: 83,
    });
    expect(reporte.paciente).not.toHaveProperty('contrasena');
  });

  test('progreso_sinRegistros_daCeroPorCientoYNoNaN', async () => {
    const { servicio, usuario, habito: repo } = crearServicio();
    usuario.findUnique.mockResolvedValue(paciente());
    repo.findMany.mockResolvedValue([habito(1, [])]);

    const reporte = await servicio.progreso(5, '2026-10-01', '2026-10-31');

    expect(reporte.habitos[0].porcentajeAdherencia).toBe(0);
    expect(reporte.totales.porcentajeAdherencia).toBe(0);
  });

  test('progreso_habitoArchivado_soloApareceSiTuvoActividadEnElRango', async () => {
    const { servicio, usuario, habito: repo } = crearServicio();
    usuario.findUnique.mockResolvedValue(paciente());
    repo.findMany.mockResolvedValue([
      habito(1, [], { activo: false }),
      habito(2, [['2026-10-02', true]], { activo: false }),
    ]);

    const reporte = await servicio.progreso(5, '2026-10-01', '2026-10-31');

    expect(reporte.habitos.map((h) => h.habitoId)).toEqual([2]);
  });

  test('progreso_fechaInicialPosteriorALaFinal_responde422', async () => {
    const { servicio } = crearServicio();

    const problema = await capturarProblema(
      servicio.progreso(5, '2026-10-31', '2026-10-01'),
    );

    expect(problema.problema.status).toBe(422);
  });

  test.each([
    ['Inexistente', null],
    ['ConRolProfesional', paciente({ rol: 'profesional' })],
  ])('progreso_usuario%s_responde404', async (_caso, usuarioGuardado) => {
    const { servicio, usuario } = crearServicio();
    usuario.findUnique.mockResolvedValue(usuarioGuardado);

    const problema = await capturarProblema(
      servicio.progreso(5, '2026-10-01', '2026-10-31'),
    );

    expect(problema.problema).toMatchObject({
      status: 404,
      code: 'PATIENT_NOT_FOUND',
    });
  });
});
