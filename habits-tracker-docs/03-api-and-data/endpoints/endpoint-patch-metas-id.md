# Integración de endpoint — Editar, activar o desactivar meta

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-10b en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [metas](../../01-architecture/features/feature-metas.md)
- **Método y ruta:** `PATCH /api/v1/metas/:id`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `editarMeta` (botón **Editar**, ventana con valor y descripción) y `alternarMeta` (interruptor activa / inactiva) del contexto, en `MetasScreen`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `id` | path | `number` | Sí |  |
| `activa` | body | `boolean` | No* |  |
| `valorObjetivo` | body | `number` | No* | > 0 |
| `descripcion` | body | `string \| null` | No* | Vacía → `null` |

**Cuerpo:**

```json
{ "valorObjetivo": 25, "descripcion": "25 páginas al día" }
```

---

## Respuesta

**Éxito:**

```json
{ "id": 9, "habitoId": 1, "valorObjetivo": 25, "descripcion": "25 páginas al día", "activa": true }
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Objeto completo | `Meta` | Reemplaza la meta con ese `id` |

> \* Al menos uno de los tres campos; sin ninguno, `400`. Cambiar el valor objetivo no recalcula los registros anteriores (D-02).

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Se muestra el mensaje |
| 409 | `ACTIVE_GOAL_EXISTS` (al reactivar) | Se muestra el `detail` |
| 422 | `BUSINESS_RULE_VIOLATION` | Se muestra el `detail` |
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
