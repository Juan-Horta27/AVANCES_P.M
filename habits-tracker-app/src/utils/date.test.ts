import {
  aDate,
  aISO,
  diaCorto,
  diferenciaDias,
  fechaCorta,
  fechaLarga,
  horaDe,
  hoyISO,
  inicioDeSemana,
  nombreMes,
  semanaDe,
  sumarDias,
} from './date';

// Referencias del calendario usadas en estas pruebas:
// 2026-09-17 es jueves · 2026-09-20 es domingo · 2027-01-01 es viernes.

describe('aISO', () => {
  test('aISO_conMesYDiaDeUnDigito_rellenaConCeros', () => {
    expect(aISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  test('aISO_cercaDeMedianoche_usaElDiaLocalYNoElDeUTC', () => {
    // 23:30 hora local: con toISOString() podria caer en el dia siguiente (bug de ADR-003).
    expect(aISO(new Date(2026, 8, 17, 23, 30))).toBe('2026-09-17');
  });
});

describe('aDate', () => {
  test('aDate_conTextoISO_devuelveMedianocheLocalDeEseDia', () => {
    const fecha = aDate('2026-09-17');
    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(8);
    expect(fecha.getDate()).toBe(17);
    expect(fecha.getHours()).toBe(0);
  });

  test('aDate_seguidoDeAISO_conservaLaMismaFecha', () => {
    expect(aISO(aDate('2028-02-29'))).toBe('2028-02-29');
  });
});

describe('hoyISO', () => {
  afterEach(() => jest.useRealTimers());

  test('hoyISO_conRelojFijo_devuelveLaFechaDelReloj', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 17, 10, 0));
    expect(hoyISO()).toBe('2026-09-17');
  });
});

describe('sumarDias', () => {
  test('sumarDias_alFinalDelMes_pasaAlMesSiguiente', () => {
    expect(sumarDias('2026-09-30', 1)).toBe('2026-10-01');
  });

  test('sumarDias_conDiasNegativos_retrocede', () => {
    expect(sumarDias('2026-10-01', -1)).toBe('2026-09-30');
  });

  test('sumarDias_alFinalDelAnio_pasaAlAnioSiguiente', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });

  test('sumarDias_enAnioBisiesto_incluyeEl29DeFebrero', () => {
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
  });

  test('sumarDias_enAnioNoBisiesto_saltaAMarzo', () => {
    expect(sumarDias('2026-02-28', 1)).toBe('2026-03-01');
  });

  test('sumarDias_conCero_devuelveLaMismaFecha', () => {
    expect(sumarDias('2026-09-17', 0)).toBe('2026-09-17');
  });
});

describe('diferenciaDias', () => {
  test('diferenciaDias_entreDiasConsecutivos_esUno', () => {
    expect(diferenciaDias('2026-09-17', '2026-09-16')).toBe(1);
  });

  test('diferenciaDias_conLaFechaMasAntiguaPrimero_esNegativa', () => {
    expect(diferenciaDias('2026-09-16', '2026-09-17')).toBe(-1);
  });

  test('diferenciaDias_cruzandoMesYAnio_cuentaDiasReales', () => {
    expect(diferenciaDias('2027-01-02', '2026-12-30')).toBe(3);
  });

  test('diferenciaDias_cruzandoElFebreroBisiesto_cuentaEl29', () => {
    expect(diferenciaDias('2028-03-01', '2028-02-28')).toBe(2);
  });
});

describe('inicioDeSemana', () => {
  test('inicioDeSemana_cuandoEsJueves_devuelveElLunesDeEsaSemana', () => {
    expect(inicioDeSemana('2026-09-17')).toBe('2026-09-14');
  });

  test('inicioDeSemana_cuandoEsLunes_devuelveElMismoDia', () => {
    expect(inicioDeSemana('2026-09-14')).toBe('2026-09-14');
  });

  test('inicioDeSemana_cuandoEsDomingo_devuelveElLunesAnterior', () => {
    expect(inicioDeSemana('2026-09-20')).toBe('2026-09-14');
  });

  test('inicioDeSemana_cuandoLaSemanaCruzaElAnio_devuelveElLunesDelAnioAnterior', () => {
    expect(inicioDeSemana('2027-01-01')).toBe('2026-12-28');
  });
});

describe('funciones de semana sin argumento (usan la fecha de hoy)', () => {
  afterEach(() => jest.useRealTimers());

  test('inicioDeSemana_sinArgumento_usaLaSemanaDeHoy', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 17, 10, 0));
    expect(inicioDeSemana()).toBe('2026-09-14');
  });

  test('semanaDe_sinArgumento_terminaElDomingoDeEstaSemana', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 17, 10, 0));
    expect(semanaDe()[6]).toBe('2026-09-20');
  });
});

describe('semanaDe', () => {
  test('semanaDe_unaFechaCualquiera_devuelveSieteDiasDeLunesADomingo', () => {
    expect(semanaDe('2026-09-17')).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ]);
  });
});

describe('formato para mostrar', () => {
  test('diaCorto_cuandoEsDomingo_devuelveDom', () => {
    expect(diaCorto('2026-09-20')).toBe('Dom');
  });

  test('fechaLarga_unaFecha_laEscribeEnEspanol', () => {
    expect(fechaLarga('2026-09-06')).toBe('6 de septiembre de 2026');
  });

  test('fechaCorta_unaFecha_usaDosDigitosYMesAbreviado', () => {
    expect(fechaCorta('2026-09-06')).toBe('06 sep');
  });

  test('horaDe_unInstante_devuelveLaHoraLocalConDosDigitos', () => {
    expect(horaDe(new Date(2026, 9, 25, 9, 5).toISOString())).toBe('09:05');
  });

  test('nombreMes_conIndiceCero_devuelveEnero', () => {
    expect(nombreMes(0)).toBe('Enero');
  });
});
