# Integración de endpoint — Listar categorías

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-03 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [habitos](../../01-architecture/features/feature-habitos.md)
- **Método y ruta:** `GET /api/v1/categorias`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Ambos roles
- **Consumido por:** `listarCategorias` (`services/habitos.ts`), llamado por `cargarDatos` del contexto

---

## Petición

Sin parámetros.

---

## Respuesta

**Éxito:**

```json
[
  { "id": 1, "nombre": "Hidratación", "descripcion": "...", "icono": "💧" }
]
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| `id`, `nombre`, `descripcion`, `icono` | `CategoriaHabito` | Directo. `icono` es un emoji en texto (D-11) |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | GET: se reintenta solo (0 s, 1 s, 2 s, D-16); luego se usa la caché |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** Lectura con caché (solo en Android e iOS)
- **Entidad cacheada:** `hst:v1:categorias`
- **Invalidación:** Se vuelve a pedir al iniciar sesión, al arrancar con sesión guardada y al pulsar "Reintentar conexión". Si falla, se muestran los datos de la caché con la franja "Sin conexión".
