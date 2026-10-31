import { aNumero } from './numeros';

describe('aNumero', () => {
  test('aNumero_conComaDecimal_laInterpretaComoPunto', () => {
    expect(aNumero('8,5')).toBe(8.5);
  });

  test('aNumero_conPuntoDecimalYEspacios_devuelveElNumero', () => {
    expect(aNumero(' 8.5 ')).toBe(8.5);
  });

  test('aNumero_conTextoVacio_devuelveNull', () => {
    expect(aNumero('   ')).toBeNull();
  });

  test('aNumero_conTextoNoNumerico_devuelveNull', () => {
    expect(aNumero('ocho')).toBeNull();
  });

  test('aNumero_conNegativo_loDevuelveParaQueLaPantallaLoRechace', () => {
    expect(aNumero('-3')).toBe(-3);
  });
});
