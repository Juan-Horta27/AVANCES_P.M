# Integración de endpoint — Eliminar meta

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-10c en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [metas](../../01-architecture/features/feature-metas.md)
- **Método y ruta:** `DELETE /api/v1/metas/:id`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `eliminarMeta` del contexto; botón **Eliminar** de `MetasScreen`, con confirmación "Eliminar meta"

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
| — | — | Se quita la meta de `metas`. Los registros conservan su `metaCumplida` |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 404 | `GOAL_NOT_FOUND` | Se muestra el `detail` |
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | No se reintenta |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** En línea (la mutación exige red)
- **Entidad cacheada:** `hst:v1:metas`
- **Invalidación:** Tras el éxito se actualiza el estado en memoria y se reescribe la clave afectada; no se vuelve a pedir la lista completa.
