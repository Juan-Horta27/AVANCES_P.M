# Integración de endpoint — Listar metas

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-09 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [metas](../../01-architecture/features/feature-metas.md)
- **Método y ruta:** `GET /api/v1/metas`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `listarMetas` (`services/metas.ts`), llamado por `cargarDatos`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `habitoId` | query | `number` | No | La app no lo usa: pide todas |
| `activas` | query | `1 \| 0` | No | La app no lo usa |

---

## Respuesta

**Éxito:**

```json
[
  { "id": 3, "habitoId": 1, "valorObjetivo": 8, "descripcion": "8 vasos al día", "activa": true }
]
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Objeto completo | `Meta` | Directo. `metaActivaDe(habitoId)` busca la activa |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | Se reintenta solo; luego se usa la caché |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** Lectura con caché (solo en Android e iOS)
- **Entidad cacheada:** `hst:v1:metas`
- **Invalidación:** Se vuelve a pedir al iniciar sesión, al arrancar con sesión guardada y al pulsar "Reintentar conexión". Si falla, se muestran los datos de la caché con la franja "Sin conexión".
