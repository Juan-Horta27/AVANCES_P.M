import type { RegistroDiario } from '../types';
import { calcularRacha } from './racha';

// "Hoy" queda fijo para que las pruebas no cambien de resultado segun el dia en que corran.
const HOY = new Date(2026, 8, 17, 10, 0); // jueves 17 de septiembre de 2026
const HABITO = 1;
const OTRO_HABITO = 2;

let siguienteId = 1;

/** Crea un registro de prueba; por defecto cumplido y del habito principal. */
function registro(
  fecha: string,
  metaCumplida = true,
  habitoId = HABITO,
): RegistroDiario {
  return { id: siguienteId++, habitoId, fecha, valorRegistrado: 1, metaCumplida, notas: null };
}

/** Registros cumplidos para cada fecha indicada. */
function cumplidos(...fechas: string[]): RegistroDiario[] {
  return fechas.map((fecha) => registro(fecha));
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(HOY);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('calcularRacha — casos basicos', () => {
  test('calcularRacha_sinRegistros_devuelveCero', () => {
    expect(calcularRacha(HABITO, [])).toEqual({ habitoId: HABITO, rachaActual: 0, rachaMaxima: 0 });
  });

  test('calcularRacha_conRegistrosSinMetaCumplida_devuelveCero', () => {
    const registros = [registro('2026-09-17', false), registro('2026-09-16', false)];
    expect(calcularRacha(HABITO, registros)).toMatchObject({ rachaActual: 0, rachaMaxima: 0 });
  });

  test('calcularRacha_unSoloRegistroDeHoy_devuelveUno', () => {
    expect(calcularRacha(HABITO, cumplidos('2026-09-17'))).toMatchObject({
      rachaActual: 1,
      rachaMaxima: 1,
    });
  });

  test('calcularRacha_unSoloRegistroDeAyer_mantieneLaRachaViva', () => {
    // Tolerancia deliberada: no se castiga a quien aun no registra el dia en curso.
    expect(calcularRacha(HABITO, cumplidos('2026-09-16'))).toMatchObject({
      rachaActual: 1,
      rachaMaxima: 1,
    });
  });

  test('calcularRacha_unSoloRegistroDeHaceTresDias_soloCuentaParaLaMaxima', () => {
    expect(calcularRacha(HABITO, cumplidos('2026-09-14'))).toMatchObject({
      rachaActual: 0,
      rachaMaxima: 1,
    });
  });

  test('calcularRacha_cincoDiasConsecutivosHastaHoy_devuelveCinco', () => {
    const registros = cumplidos('2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17');
    expect(calcularRacha(HABITO, registros)).toMatchObject({ rachaActual: 5, rachaMaxima: 5 });
  });
});

describe('calcularRacha — tramos cortados', () => {
  test('calcularRacha_cuandoElTramoSeCorta_congelaLaRachaActual', () => {
    // 3 dias recientes (15 al 17), hueco el 13 y el 14, y 7 dias antiguos (6 al 12).
    const recientes = cumplidos('2026-09-15', '2026-09-16', '2026-09-17');
    const antiguos = cumplidos(
      '2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09',
      '2026-09-10', '2026-09-11', '2026-09-12',
    );
    expect(calcularRacha(HABITO, [...recientes, ...antiguos])).toMatchObject({
      rachaActual: 3,
      rachaMaxima: 7,
    });
  });

  test('calcularRacha_unDiaConMetaIncumplida_rompeLaContinuidad', () => {
    // TC-002 pasos 5 y 6: el dia 14 existe pero no cumplio la meta.
    const registros = [
      ...cumplidos('2026-09-15', '2026-09-16', '2026-09-17'),
      registro('2026-09-14', false),
      ...cumplidos('2026-09-13'),
    ];
    expect(calcularRacha(HABITO, registros)).toMatchObject({ rachaActual: 3, rachaMaxima: 3 });
  });

  test('calcularRacha_sinRegistroDeHoyPeroConAyer_cuentaElTramoHastaAyer', () => {
    // TC-002 paso 8: se elimino el registro de hoy y la racha no baja a cero.
    const registros = cumplidos('2026-09-15', '2026-09-16');
    expect(calcularRacha(HABITO, registros)).toMatchObject({ rachaActual: 2, rachaMaxima: 2 });
  });

  test('calcularRacha_sinRegistroDeHoyNiDeAyer_dejaLaActualEnCero', () => {
    // TC-002 paso 9: el tramo ya no llega ni a ayer.
    const registros = cumplidos('2026-09-13', '2026-09-14', '2026-09-15');
    expect(calcularRacha(HABITO, registros)).toMatchObject({ rachaActual: 0, rachaMaxima: 3 });
  });
});

describe('calcularRacha — calendario', () => {
  test('calcularRacha_tramoQueCruzaUnCambioDeMes_cuentaSinSaltos', () => {
    jest.setSystemTime(new Date(2026, 9, 2, 10, 0)); // 2 de octubre
    const registros = cumplidos('2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02');
    expect(calcularRacha(HABITO, registros)).toMatchObject({ rachaActual: 4, rachaMaxima: 4 });
  });

  test('calcularRacha_tramoQueCruzaUnCambioDeAnio_cuentaSinSaltos', () => {
    jest.setSystemTime(new Date(2027, 0, 2, 10, 0)); // 2 de enero de 2027
    const registros = cumplidos('2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02');
    expect(calcularRacha(HABITO, registros)).toMatchObject({ rachaActual: 4, rachaMaxima: 4 });
  });
});

describe('calcularRacha — robustez de la entrada', () => {
  test('calcularRacha_conRegistrosDesordenados_daElMismoResultado', () => {
    const registros = cumplidos('2026-09-16', '2026-09-12', '2026-09-17', '2026-09-11', '2026-09-15');
    expect(calcularRacha(HABITO, registros)).toMatchObject({ rachaActual: 3, rachaMaxima: 3 });
  });

  test('calcularRacha_conRegistrosDeOtrosHabitos_losIgnora', () => {
    const registros = [
      ...cumplidos('2026-09-17'),
      registro('2026-09-16', true, OTRO_HABITO),
      registro('2026-09-15', true, OTRO_HABITO),
    ];
    expect(calcularRacha(HABITO, registros)).toMatchObject({ rachaActual: 1, rachaMaxima: 1 });
  });

  test('calcularRacha_siempre_devuelveElIdDelHabitoConsultado', () => {
    expect(calcularRacha(OTRO_HABITO, cumplidos('2026-09-17')).habitoId).toBe(OTRO_HABITO);
  });
});
