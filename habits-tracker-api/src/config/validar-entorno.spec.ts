import { validarEntorno } from './validar-entorno';

const BASE = {
  DATABASE_URL: 'postgresql://usuario:clave@localhost:5432/base',
  JWT_SECRET: 'un-secreto-de-pruebas-con-mas-de-32-caracteres',
};

describe('validarEntorno', () => {
  test('validarEntorno_conLoMinimo_aplicaLosValoresPorOmision', () => {
    expect(validarEntorno(BASE)).toMatchObject({
      JWT_EXPIRES_IN: '24h',
      PORT: 3000,
      ZONA_HORARIA: 'America/Bogota',
    });
  });

  test('validarEntorno_conVariablesVacias_lasTrataComoNoDefinidas', () => {
    // docker compose pasa "" cuando la variable no existe en el .env.
    const entorno = validarEntorno({
      ...BASE,
      ZONA_HORARIA: '',
      JWT_EXPIRES_IN: '',
      PORT: '',
    });

    expect(entorno).toMatchObject({
      ZONA_HORARIA: 'America/Bogota',
      JWT_EXPIRES_IN: '24h',
      PORT: 3000,
    });
  });

  test('validarEntorno_sinJwtSecret_fallaAlArrancar', () => {
    expect(() => validarEntorno({ DATABASE_URL: BASE.DATABASE_URL })).toThrow(
      'JWT_SECRET',
    );
  });

  test('validarEntorno_conSecretoCorto_fallaAlArrancar', () => {
    expect(() => validarEntorno({ ...BASE, JWT_SECRET: 'corto' })).toThrow(
      'al menos 32',
    );
  });

  test('validarEntorno_conZonaHorariaInexistente_fallaAlArrancar', () => {
    expect(() =>
      validarEntorno({ ...BASE, ZONA_HORARIA: 'Marte/Olympus' }),
    ).toThrow('ZONA_HORARIA');
  });
});
