# 03 — API y Datos

> **¿Qué es esto?** Las reglas de cómo la app habla con el backend y cómo guarda y sincroniza
> el estado localmente.

## Por qué existe esta sección

La red y la persistencia son donde viven la mayoría de los errores y de los problemas de
seguridad de una app móvil: manejo de tokens, reintentos, comportamiento sin conexión y
migraciones de esquema. Se deciden las reglas una vez y se aplican en la capa de datos de cada
feature.

---

## ⚠️ Estado actual

**Implementado (2026-10-28).** La app habla con la API del repositorio `habits-tracker-api`
a través de `src/services/` (`apiFetch`), guarda el token en `expo-secure-store`, una caché del
dominio en `AsyncStorage` y la **cola de registros sin conexión** (S-06,
[offline-sync.md](./offline-sync.md)). Los roles `paciente` y `profesional`, la edición completa y el
reporte de progreso están en el contrato ([ADR-011](../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md)).
Sigue aplazada solo la sincronización incremental (ADR-008, D-21).

---

## Documentos de esta sección

| Archivo | Propósito |
|---------|-----------|
| [data-model.md](./data-model.md) | **Modelo de datos canónico**: entidades, invariantes con marcas, esquema físico de PostgreSQL, restricciones, bajas lógicas y evidencia |
| [api-contract.md](./api-contract.md) | **Contrato de API**: convenciones comunes, formato RFC 7807, catálogo de estados y fichas exhaustivas de endpoints |
| [api-networking.md](./api-networking.md) | Cliente HTTP, URL base por entorno, timeouts, reintentos, mapeo de errores |
| [authentication.md](./authentication.md) | Dónde vive el token, cómo se adjunta, ciclo de vida de la sesión |
| [persistence.md](./persistence.md) | Dos almacenes, claves, migraciones |
| [offline-sync.md](./offline-sync.md) | Estrategia por feature y política de conflictos |
| [_template-endpoint-integration.md](./_template-endpoint-integration.md) | Plantilla para documentar el consumo de un endpoint (no editar) |
| [_template-entity.md](./_template-entity.md) | Plantilla para definir una entidad local (no editar) |
| [endpoints/](./endpoints/) | Endpoints documentados |
| [entities/](./entities/) | Entidades locales documentadas |

---

## Decisiones que gobiernan esta sección

| Decisión | ADR |
|----------|-----|
| `fetch` nativo envuelto en un único `apiFetch` | [ADR-005](../01-architecture/decisions/records/ADR-005-cliente-http.md) |
| AsyncStorage para datos, expo-secure-store para el token | [ADR-004](../01-architecture/decisions/records/ADR-004-persistencia-local.md) |
| Fechas como texto `YYYY-MM-DD` de extremo a extremo | [ADR-003](../01-architecture/decisions/records/ADR-003-fechas-como-texto-iso.md) |

---

## Endpoints documentados

| Endpoint | Documento |
|----------|-----------|
| `POST /auth/login` | [endpoint-post-auth-login.md](./endpoints/endpoint-post-auth-login.md) |
| `POST /registro` | [endpoint-post-registro.md](./endpoints/endpoint-post-registro.md) |

## Entidades locales documentadas

| Entidad | Documento |
|---------|-----------|
| `registros` | [entity-registros.md](./entities/entity-registros.md) |

---

## El orden de la migración

Conectar el backend no se hace de golpe. El orden acordado:

1. `services/api.ts` con `apiFetch` y la URL base por entorno.
2. `src/storage/` con los dos almacenes.
3. Autenticación real: `POST /auth/login` y `POST /auth/register`, con el token persistido.
4. Lecturas: reemplazar `mockData` por `GET` en el orden categorías → hábitos → metas → registros.
5. Escrituras: `POST` y `DELETE`. ~~Manteniendo la validación optimista en el cliente.~~ Revisado por
   [ADR-012](../01-architecture/decisions/records/ADR-012-sin-respuesta-optimista.md): el cliente espera la respuesta del servidor.
6. Cola offline del registro diario.
7. **Borrar `src/constants/mockData.ts`.**

> El paso 7 es la prueba de que la arquitectura funcionó: si borrarlo rompe alguna pantalla, la
> capa de datos se había filtrado a la presentación.

---

## Preguntas que esta sección debe responder

- ¿Cómo hace y reintenta peticiones la app?
- ¿Dónde se guarda el token y cómo termina una sesión?
- ¿Qué se guarda localmente y cómo se migra el esquema?
- ¿Qué pasa cuando el dispositivo no tiene conexión?
