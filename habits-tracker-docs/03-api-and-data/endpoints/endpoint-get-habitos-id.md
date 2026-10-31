# Integración de endpoint — Ver un hábito

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-06 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [habitos](../../01-architecture/features/feature-habitos.md)
- **Método y ruta:** `GET /api/v1/habitos/:id`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** **Ninguno en v1.0.0.** La app ya tiene todos los hábitos tras `GET /habitos`; el endpoint existe por completitud del CRUD y lo usa la colección Postman

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `id` | path | `number` | Sí | Entero ≥ 1 |

---

## Respuesta

**Éxito:**

```json
{ "id": 7, "nombre": "Beber agua", "...": "..." }
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Objeto completo | `Habito` | Directo |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 404 | `HABIT_NOT_FOUND` | No aplica en la app |
| 403 | `FORBIDDEN_RESOURCE` | No aplica en la app |
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** No aplica
- **Entidad cacheada:** —
- **Invalidación:** —
