import { moverExtremo, rangoPredefinido } from './rango';

const HOY = '2026-11-03';

describe('rangoPredefinido', () => {
  test('rangoPredefinido_semana_sonLosUltimosSieteDiasIncluyendoHoy', () => {
    expect(rangoPredefinido('semana', HOY)).toEqual({ inicio: '2026-10-28', fin: HOY });
  });

  test('rangoPredefinido_treintaDias_cruzaElCambioDeMes', () => {
    expect(rangoPredefinido('treintaDias', HOY)).toEqual({ inicio: '2026-10-05', fin: HOY });
  });

  test('rangoPredefinido_mes_empiezaElDiaUnoDelMesActual', () => {
    expect(rangoPredefinido('mes', HOY)).toEqual({ inicio: '2026-11-01', fin: HOY });
  });
});

describe('moverExtremo', () => {
  const rango = { inicio: '2026-11-01', fin: '2026-11-02' };

  test('moverExtremo_inicioHaciaAtras_ampliaElRango', () => {
    expect(moverExtremo(rango, 'inicio', -1, HOY)).toEqual({ inicio: '2026-10-31', fin: '2026-11-02' });
  });

  test('moverExtremo_finHastaHoy_sePermite', () => {
    expect(moverExtremo(rango, 'fin', 1, HOY)).toEqual({ inicio: '2026-11-01', fin: HOY });
  });

  test('moverExtremo_finMasAllaDeHoy_noCambiaElRango', () => {
    const hastaHoy = { inicio: '2026-11-01', fin: HOY };
    expect(moverExtremo(hastaHoy, 'fin', 1, HOY)).toBe(hastaHoy);
  });

  test('moverExtremo_inicioDespuesDelFin_noCambiaElRango', () => {
    const unDia = { inicio: '2026-11-02', fin: '2026-11-02' };
    expect(moverExtremo(unDia, 'inicio', 1, HOY)).toBe(unDia);
  });
});
