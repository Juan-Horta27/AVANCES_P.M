# Integración de endpoint — Listar registros

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-12 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [historial](../../01-architecture/features/feature-historial.md)
- **Método y ruta:** `GET /api/v1/registros?page=N&size=100`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `listarRegistros` (`services/registros.ts`), llamado por `cargarDatos`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `page` | query | `number` | No | La app recorre 1, 2, 3… hasta `totalPages` |
| `size` | query | `number` | No | La app usa 100, el máximo |
| `habitoId`, `from`, `to` | query |  | No | La app no los usa: filtra en memoria |

---

## Respuesta

**Éxito:**

```json
{ "items": [ { "id": 42, "habitoId": 1, "fecha": "2026-10-27", "valorRegistrado": 9, "metaCumplida": true, "notas": null } ],
  "page": 1, "size": 100, "total": 27, "totalPages": 1 }
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| `items` de todas las páginas | `RegistroDiario[]` | Se concatenan; rachas, gráfica e historial se calculan sobre el historial completo |
| `fecha` | `RegistroDiario.fecha` | Texto `YYYY-MM-DD` (ADR-003) |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | Se reintenta cada página; si falla, se usa la caché |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** Lectura con caché (solo en Android e iOS)
- **Entidad cacheada:** `hst:v1:registros`
- **Invalidación:** Se vuelve a pedir al iniciar sesión, al arrancar con sesión guardada y al pulsar "Reintentar conexión". Si falla, se muestran los datos de la caché con la franja "Sin conexión".
