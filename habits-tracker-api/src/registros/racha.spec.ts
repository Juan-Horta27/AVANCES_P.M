import { calcularRacha } from './racha';

// Mismos casos que src/utils/racha.test.ts de la app (testing-strategy.md): cliente y
// servidor deben dar siempre el mismo número (ADR-008, D-19).
const HOY = '2026-09-17';

describe('calcularRacha (servidor)', () => {
  test('calcularRacha_sinRegistros_devuelveCero', () => {
    expect(calcularRacha([], HOY)).toEqual({ rachaActual: 0, rachaMaxima: 0 });
  });

  test('calcularRacha_unSoloRegistroDeHoy_devuelveUno', () => {
    expect(calcularRacha(['2026-09-17'], HOY)).toEqual({
      rachaActual: 1,
      rachaMaxima: 1,
    });
  });

  test('calcularRacha_unSoloRegistroDeAyer_mantieneLaRachaViva', () => {
    expect(calcularRacha(['2026-09-16'], HOY)).toEqual({
      rachaActual: 1,
      rachaMaxima: 1,
    });
  });

  test('calcularRacha_unSoloRegistroDeHaceTresDias_soloCuentaParaLaMaxima', () => {
    expect(calcularRacha(['2026-09-14'], HOY)).toEqual({
      rachaActual: 0,
      rachaMaxima: 1,
    });
  });

  test('calcularRacha_cincoDiasConsecutivosHastaHoy_devuelveCinco', () => {
    const fechas = [
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
    ];
    expect(calcularRacha(fechas, HOY)).toEqual({
      rachaActual: 5,
      rachaMaxima: 5,
    });
  });

  test('calcularRacha_cuandoElTramoSeCorta_congelaLaRachaActual', () => {
    const recientes = ['2026-09-15', '2026-09-16', '2026-09-17'];
    const antiguos = [
      '2026-09-06',
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
    ];
    expect(calcularRacha([...recientes, ...antiguos], HOY)).toEqual({
      rachaActual: 3,
      rachaMaxima: 7,
    });
  });

  test('calcularRacha_sinRegistroDeHoyNiDeAyer_dejaLaActualEnCero', () => {
    expect(
      calcularRacha(['2026-09-13', '2026-09-14', '2026-09-15'], HOY),
    ).toEqual({
      rachaActual: 0,
      rachaMaxima: 3,
    });
  });

  test('calcularRacha_tramoQueCruzaUnCambioDeAnio_cuentaSinSaltos', () => {
    const fechas = ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'];
    expect(calcularRacha(fechas, '2027-01-02')).toEqual({
      rachaActual: 4,
      rachaMaxima: 4,
    });
  });

  test('calcularRacha_conFechasDesordenadas_daElMismoResultado', () => {
    const fechas = [
      '2026-09-16',
      '2026-09-12',
      '2026-09-17',
      '2026-09-11',
      '2026-09-15',
    ];
    expect(calcularRacha(fechas, HOY)).toEqual({
      rachaActual: 3,
      rachaMaxima: 3,
    });
  });

  test('calcularRacha_noModificaElArregloRecibido', () => {
    const fechas = ['2026-09-15', '2026-09-17', '2026-09-16'];
    calcularRacha(fechas, HOY);
    expect(fechas).toEqual(['2026-09-15', '2026-09-17', '2026-09-16']);
  });
});
