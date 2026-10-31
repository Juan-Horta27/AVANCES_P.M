# Integración de endpoint — Crear meta

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-10 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [metas](../../01-architecture/features/feature-metas.md)
- **Método y ruta:** `POST /api/v1/metas`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `crearMeta` del contexto; botón **Crear meta** de `MetasScreen`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `habitoId` | body | `number` | Sí | Hábito propio y activo |
| `valorObjetivo` | body | `number` | Sí | > 0 |
| `descripcion` | body | `string` | No | Máx 300 |

**Cuerpo:**

```json
{ "habitoId": 1, "valorObjetivo": 20, "descripcion": "20 páginas al día" }
```

---

## Respuesta

**Éxito:**

```json
{ "id": 9, "habitoId": 1, "valorObjetivo": 20, "descripcion": "20 páginas al día", "activa": true }
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Objeto completo | `Meta` | Se añade a `metas` |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 409 | `ACTIVE_GOAL_EXISTS` | Se muestra el `detail`: hay que desactivar la otra primero (TC-004) |
| 422 | `BUSINESS_RULE_VIOLATION` | Se muestra el `detail` |
| 404 | `HABIT_NOT_FOUND` | Se muestra el `detail` |
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | No se reintenta |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** En línea (la mutación exige red)
- **Entidad cacheada:** `hst:v1:metas`
- **Invalidación:** Tras el éxito se actualiza el estado en memoria y se reescribe la clave afectada; no se vuelve a pedir la lista completa.
