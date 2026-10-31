# API / Red

> **Estado actual:** Documento alineado con el contrato canónico [`api-contract.md`](./api-contract.md). Define el cliente HTTP de `habits-tracker-app` (`src/services/api.ts`, implementado desde el 2026-10-25) que consume la API de `habits-tracker-api` (ADR-010). Decidido en [ADR-005](../01-architecture/decisions/records/ADR-005-cliente-http.md).

---

## Cliente

- **Un único punto de salida:** `apiFetch` en `src/services/api.ts`. Ninguna pantalla, ningún componente y ninguna acción llama a `fetch` directamente.
- Construido sobre el `fetch` nativo de React Native. Sin Axios ni dependencias externas.
- Responsabilidades de `apiFetch`, y solo estas:
  1. Anteponer la URL base del entorno.
  2. Adjuntar cabecera `Authorization: Bearer <token>` si hay sesión activa en SecureStore.
  3. Adjuntar cabeceras `Accept: application/json` y `Content-Type: application/json; charset=utf-8`.
  4. Aplicar el timeout con `AbortController` (10 segundos).
  5. Deserializar el formato canónico RFC 7807 (`application/problem+json`) y traducir a `{ ok, datos?, mensaje?, code?, errors? }`.

```
Pantalla → acción de AppContext → services/<recurso>.ts → apiFetch → backend
```

## URL base por entorno

- Proviene de `process.env.EXPO_PUBLIC_API_URL`. **Nunca escrita en el código**.

| Entorno | Valor |
|---------|-------|
| Desarrollo, dispositivo físico Expo | `http://<IP-de-la-maquina>:3000/api/v1` (ej. `http://192.168.1.15:3000/api/v1`) |
| Desarrollo, emulador de Android Studio | `http://10.0.2.2:3000/api/v1` |
| Desarrollo, simulador de iOS / Web | `http://localhost:3000/api/v1` |
| Staging / Producción | `https://api.healthyhabits.com/api/v1` — **TLS obligatorio** |

---

## Peticiones, timeouts e idempotencia

- **Timeout obligatorio:** 10 segundos para toda petición mediante señal `AbortSignal.timeout(10000)`.
- **Reintentos automáticos:** **solo en `GET`** (ADR-008, D-16; ver [`api-contract.md §6`](./api-contract.md#6-idempotencia-y-reintentos)).
  - 3 intentos: inmediato, a 1 s y a 2 s. Las mutaciones que fallan se muestran con la acción "Reintentar".
- **Creaciones (`POST`):**
  - `POST /registros` lleva siempre `clienteId` (UUID v4) en el cuerpo, sin cabecera `Idempotency-Key` (D-17). Solo se reenviará automáticamente desde la cola offline, cuando exista (S-06).
  - Mutaciones no idempotentes (`POST /habitos`, `POST /metas`) **nunca se reintentan solas**; se notifica al usuario con acción explícita.

---

## Manejo de errores RFC 7807

Toda respuesta con código `4xx` se procesa extrayendo los campos tipificados de [`api-contract.md §2`](./api-contract.md#2-la-forma-del-error):

| Campo recibido | Uso en la aplicación móvil |
| :--- | :--- |
| `detail` | Texto en español que se muestra directamente al usuario en banners, toasts o modales de error |
| `code` | Código alfanumérico estable (`INVALID_CREDENTIALS`, `DUPLICATE_DAILY_LOG`, `TOKEN_EXPIRED`) para lógica condicional |
| `errors` | Mapa de validación de campos para resaltar inputs específicos en formularios móviles |

---

## Registro y seguridad

- **Prohibido:** Registrar tokens JWT completos, contraseñas o datos de salud sensibles (`peso`, `estatura`) en consola.
- En compilaciones de producción (*release builds*), los logs de red quedan completamente silenciados.
