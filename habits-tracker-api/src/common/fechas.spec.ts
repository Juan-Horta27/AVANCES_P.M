import {
  aFechaBD,
  aTextoISO,
  diferenciaDias,
  esFechaISOValida,
  hoyEnZona,
} from './fechas';

describe('esFechaISOValida', () => {
  test('esFechaISOValida_conUnDiaReal_esTrue', () => {
    expect(esFechaISOValida('2028-02-29')).toBe(true);
  });

  test('esFechaISOValida_conUnDiaQueNoExiste_esFalse', () => {
    expect(esFechaISOValida('2026-02-30')).toBe(false);
    expect(esFechaISOValida('2026-02-29')).toBe(false);
  });

  test('esFechaISOValida_conHoraOFormatoDistinto_esFalse', () => {
    expect(esFechaISOValida('2026-09-17T10:00:00Z')).toBe(false);
    expect(esFechaISOValida('17/09/2026')).toBe(false);
    expect(esFechaISOValida('2026-9-7')).toBe(false);
  });
});

describe('conversión con la base de datos', () => {
  test('aFechaBD_seguidoDeATextoISO_conservaLaFecha', () => {
    expect(aTextoISO(aFechaBD('2026-12-31'))).toBe('2026-12-31');
  });

  test('diferenciaDias_cruzandoElAnio_cuentaDiasReales', () => {
    expect(diferenciaDias('2027-01-02', '2026-12-30')).toBe(3);
  });
});

describe('hoyEnZona', () => {
  test('hoyEnZona_alas20HorasDeColombia_sigueSiendoElMismoDiaAunqueEnUTCYaSeaManana', () => {
    // 2026-09-18 01:00 UTC equivale al 2026-09-17 20:00 en Bogotá (UTC-5).
    const instante = new Date('2026-09-18T01:00:00Z');
    expect(hoyEnZona('America/Bogota', instante)).toBe('2026-09-17');
    expect(hoyEnZona('UTC', instante)).toBe('2026-09-18');
  });
});
