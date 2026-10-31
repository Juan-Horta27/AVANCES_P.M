import { leerToken } from '../storage/seguro';
import { TIMEOUT_MS, URL_BASE, apiFetch, registrarManejadorSesionInvalida } from './api';

// Se simulan las dependencias directas: la red (fetch) y el almacén del token.
jest.mock('../storage/seguro', () => ({ leerToken: jest.fn() }));

const leerTokenSimulado = leerToken as jest.MockedFunction<typeof leerToken>;
const fetchSimulado = jest.fn();

function respuesta(status: number, cuerpo?: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      if (cuerpo === undefined) throw new SyntaxError('sin cuerpo');
      return cuerpo;
    },
  } as Response;
}

beforeEach(() => {
  globalThis.fetch = fetchSimulado;
  fetchSimulado.mockReset();
  leerTokenSimulado.mockResolvedValue('token-de-prueba');
  registrarManejadorSesionInvalida(null);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('apiFetch — éxito', () => {
  test('apiFetch_conRespuesta200_devuelveLosDatos', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, [{ id: 1 }]));

    const resultado = await apiFetch('/habitos');

    expect(resultado).toEqual({ ok: true, datos: [{ id: 1 }] });
    expect(fetchSimulado).toHaveBeenCalledWith(`${URL_BASE}/habitos`, expect.anything());
  });

  test('apiFetch_enRutaProtegida_adjuntaElTokenComoBearer', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, {}));

    await apiFetch('/habitos');

    const { headers } = fetchSimulado.mock.calls[0][1];
    expect(headers.Authorization).toBe('Bearer token-de-prueba');
  });

  test('apiFetch_enRutaPublica_noAdjuntaElToken', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, {}));

    await apiFetch('/auth/login', { metodo: 'POST', cuerpo: {}, publico: true });

    const { headers } = fetchSimulado.mock.calls[0][1];
    expect(headers.Authorization).toBeUndefined();
  });

  test('apiFetch_conRespuesta204_devuelveOkSinDatos', async () => {
    fetchSimulado.mockResolvedValue(respuesta(204));

    const resultado = await apiFetch('/habitos/1', { metodo: 'DELETE' });

    expect(resultado).toEqual({ ok: true, datos: undefined });
  });
});

describe('apiFetch — errores RFC 7807', () => {
  test('apiFetch_conErrorDeCampo_usaElMensajeDelCampoComoMensaje', async () => {
    fetchSimulado.mockResolvedValue(
      respuesta(400, {
        code: 'VALIDATION_FAILED',
        detail: 'Datos de registro incompletos o inválidos.',
        errors: { contrasena: ['La contraseña debe incluir al menos un número.'] },
      }),
    );

    const resultado = await apiFetch('/auth/register', { metodo: 'POST', publico: true });

    expect(resultado).toEqual({
      ok: false,
      mensaje: 'La contraseña debe incluir al menos un número.',
      code: 'VALIDATION_FAILED',
      status: 400,
    });
  });

  test('apiFetch_conConflictoSinErroresDeCampo_usaElDetail', async () => {
    fetchSimulado.mockResolvedValue(
      respuesta(409, { code: 'DUPLICATE_DAILY_LOG', detail: 'Ya existe un registro.' }),
    );

    const resultado = await apiFetch('/registros', { metodo: 'POST' });

    expect(resultado).toMatchObject({ ok: false, mensaje: 'Ya existe un registro.', status: 409 });
  });

  test('apiFetch_con401EnRutaProtegida_avisaQueLaSesionEsInvalida', async () => {
    const manejador = jest.fn();
    registrarManejadorSesionInvalida(manejador);
    fetchSimulado.mockResolvedValue(respuesta(401)); // un 401 puede llegar sin cuerpo

    const resultado = await apiFetch('/habitos');

    expect(manejador).toHaveBeenCalledTimes(1);
    expect(resultado).toMatchObject({ ok: false, status: 401 });
  });

  test('apiFetch_con401EnLogin_noCierraLaSesion', async () => {
    const manejador = jest.fn();
    registrarManejadorSesionInvalida(manejador);
    fetchSimulado.mockResolvedValue(respuesta(401, { detail: 'Credenciales incorrectas.' }));

    const resultado = await apiFetch('/auth/login', { metodo: 'POST', publico: true });

    expect(manejador).not.toHaveBeenCalled();
    expect(resultado).toMatchObject({ ok: false, mensaje: 'Credenciales incorrectas.' });
  });
});

describe('apiFetch — red, reintentos y timeout', () => {
  test('apiFetch_GETconErrorDeServidor_reintentaYSiLuegoFuncionaDevuelveLosDatos', async () => {
    jest.useFakeTimers();
    fetchSimulado
      .mockResolvedValueOnce(respuesta(503))
      .mockResolvedValueOnce(respuesta(200, ['ok']));

    const promesa = apiFetch('/categorias');
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(promesa).resolves.toEqual({ ok: true, datos: ['ok'] });
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
  });

  test('apiFetch_GETsinRedEnLosTresIntentos_devuelveMensajeDeConexion', async () => {
    jest.useFakeTimers();
    fetchSimulado.mockRejectedValue(new TypeError('Network request failed'));

    const promesa = apiFetch('/categorias');
    await jest.advanceTimersByTimeAsync(3_000);

    await expect(promesa).resolves.toEqual({
      ok: false,
      mensaje: 'No pudimos conectar. Revisa tu conexión e intenta de nuevo.',
    });
    expect(fetchSimulado).toHaveBeenCalledTimes(3);
  });

  test('apiFetch_POSTsinRed_noSeReintentaParaNoDuplicar', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Network request failed'));

    const resultado = await apiFetch('/habitos', { metodo: 'POST', cuerpo: {} });

    expect(fetchSimulado).toHaveBeenCalledTimes(1);
    expect(resultado.ok).toBe(false);
  });

  test('apiFetch_cuandoElServidorNoResponde_abortaAlCumplirseElTimeout', async () => {
    jest.useFakeTimers();
    // fetch que solo termina cuando se aborta su señal, como una red colgada.
    fetchSimulado.mockImplementation(
      (_url: string, opciones: { signal: AbortSignal }) =>
        new Promise((_resolver, rechazar) => {
          opciones.signal.addEventListener('abort', () => rechazar(new Error('abortado')));
        }),
    );

    const promesa = apiFetch('/habitos', { metodo: 'DELETE' });
    await jest.advanceTimersByTimeAsync(TIMEOUT_MS);

    await expect(promesa).resolves.toMatchObject({ ok: false });
  });
});
