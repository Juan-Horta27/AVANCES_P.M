# Integración de endpoint — Eliminar o archivar hábito

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-08 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [habitos](../../01-architecture/features/feature-habitos.md)
- **Método y ruta:** `DELETE /api/v1/habitos/:id`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `eliminarHabito` del contexto; botón **Eliminar** en `HabitosScreen`, con confirmación

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `id` | path | `number` | Sí |  |

---

## Respuesta

**Éxito:**

(204 No Content, sin cuerpo)

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| — | — | El servidor decide (D-10): sin registros lo borra; con registros lo archiva (`activo: false`). La app vuelve a pedir `GET /habitos` para saber cuál pasó y muestra "Hábito eliminado." o "El hábito tenía registros: se archivó y su historial se conserva." |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 404 | `HABIT_NOT_FOUND` | Se muestra el `detail` |
| 403 | `FORBIDDEN_RESOURCE` | Se muestra el `detail` |
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | No se reintenta |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** En línea (la mutación exige red)
- **Entidad cacheada:** `hst:v1:habitos`, `hst:v1:metas`
- **Invalidación:** Tras el éxito se actualiza el estado en memoria y se reescribe la clave afectada; no se vuelve a pedir la lista completa.
