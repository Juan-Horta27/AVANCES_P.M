# ADR-005 — Cliente HTTP: `fetch` nativo envuelto en un único `apiFetch`

- **ID:** ADR-005
- **Fecha:** 2026-09-17
- **Estado:** Aceptado — implementado en `src/services/` (2026-10-25)
- **Autores:** Juan José Horta Vanegas, Javier Esteban Ortiz López

---

## Contexto

La siguiente iteración conecta la app al backend NestJS. Hay que decidir cómo se hacen las
peticiones HTTP antes de escribir la primera, porque el patrón que se elija se repetirá en
cada recurso (auth, categorías, hábitos, metas, registros, reportes).

Los requisitos transversales son los mismos para todas las peticiones:
- Adjuntar el JWT en `Authorization: Bearer <token>`.
- Anteponer la URL base del entorno (dev, staging, prod).
- Aplicar un timeout: en móvil, una petición sin timeout deja la interfaz colgada indefinidamente.
- Traducir la envoltura de respuesta del backend (`ResponseInterceptor` de NestJS) al modelo
  de dominio, y los errores HTTP a errores de dominio.

**Restricciones conocidas:**
- El backend devuelve todas las respuestas con una forma homogénea, impuesta por su
  `ResponseInterceptor` y su `HttpExceptionFilter` (ver [`../../../Project/HU-01.md`](../../../Project/HU-01.md)).
- Regla de gobernanza: el token se adjunta en **un único punto**, no pantalla por pantalla.
- En Android, `localhost` apunta al propio emulador: la URL base debe ser configurable por
  entorno, nunca escrita en el código.

---

## Decisión

**Decidimos:** usar el `fetch` que ya incluye React Native, envuelto en **una única función
`apiFetch`** en `src/services/api.ts`, más un módulo por recurso que la usa.

```
src/services/
├── api.ts          apiFetch: URL base + token + timeout + mapeo de errores
├── auth.ts         iniciarSesion, crearCuenta
├── habitos.ts      listar, crear, eliminar
├── metas.ts        listar, crear, alternar
└── registros.ts    listar, crear, eliminar
```

- **Ninguna pantalla llama a `fetch` ni a `apiFetch` directamente.** Las pantallas siguen
  llamando acciones de `AppContext`; lo que cambia es el cuerpo de esas acciones.
- La URL base viene de `process.env.EXPO_PUBLIC_API_URL`. No es un secreto, y por eso puede
  llevar el prefijo público (ver [`../../../00-governance/security-rules.md`](../../../00-governance/security-rules.md)).
- `apiFetch` traduce el estado HTTP a un resultado de dominio, manteniendo el contrato
  `{ ok, mensaje? }` que las pantallas ya consumen hoy.

**Justificación:**
`fetch` está disponible sin instalar nada y cubre todo lo que necesitamos. Lo que realmente
aporta valor no es la librería sino **el envoltorio**: un solo lugar donde vive el token, el
timeout y el mapeo de errores. Ese envoltorio hay que escribirlo igual con Axios.

El desempate fue que el contrato `{ ok, mensaje? }` de las acciones del contexto **ya existe**
y ya lo consumen las 8 pantallas. Si `apiFetch` devuelve esa misma forma, conectar el backend
no cambia una sola línea de interfaz.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **`fetch` + `apiFetch` propio (elegida)** | Cero dependencias; control total del mapeo de errores; bundle más pequeño | Hay que implementar a mano timeout (`AbortController`), reintentos e interceptores | — (elegida) |
| Axios | Interceptores listos, timeout incorporado, API cómoda | Dependencia de ~13 kB para funcionalidad que en nuestro caso son ~40 líneas; su manejo de errores igual hay que traducirlo al dominio | El envoltorio hace falta de todos modos; la librería no lo evita |
| React Query sobre `fetch` | Caché, reintentos, invalidación y estados de carga gratis | Cambiaría el patrón de estado ya acordado en [ADR-001](./ADR-001-state-management-pattern.md) a mitad de camino | Se reevaluará **después** de conectar el API, no durante |
| SDK generado desde OpenAPI | Tipos siempre sincronizados con el backend | El backend aún no publica su especificación OpenAPI | Prematuro; se reconsiderará cuando exista |

---

## Consecuencias

**Positivas:**
- Un único punto donde se adjunta el token: cumple la regla de gobernanza por construcción.
- Un único punto donde se decide qué es un error para el usuario.
- Las pantallas no cambian al conectar el backend.
- Sin dependencias nuevas.

**Negativas / Compromisos:**
- El timeout, los reintentos con backoff y la renovación del token hay que escribirlos e
  **importa probarlos**: son lógica propia, no código de librería auditado.
- Si más adelante hacen falta interceptores más ricos (subida con progreso, cancelación
  encadenada), habrá que reconsiderar Axios.

**Impacto en el sistema:**
- Nueva carpeta `src/services/`; se reescribe el cuerpo de las acciones de `AppContext.tsx`;
  se elimina `src/constants/mockData.ts`.
- Documentos a actualizar: [`../../../03-api-and-data/api-networking.md`](../../../03-api-and-data/api-networking.md),
  [`../../../03-api-and-data/authentication.md`](../../../03-api-and-data/authentication.md).

---

## Referencias

- Relacionado con: [ADR-001](./ADR-001-state-management-pattern.md), [ADR-004](./ADR-004-persistencia-local.md)
