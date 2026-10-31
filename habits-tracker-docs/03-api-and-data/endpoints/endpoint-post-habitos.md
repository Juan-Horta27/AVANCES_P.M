# Integración de endpoint — Crear hábito

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-05 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [habitos](../../01-architecture/features/feature-habitos.md)
- **Método y ruta:** `POST /api/v1/habitos`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `crearHabito` del contexto → `services/habitos.ts`; formulario de `HabitosScreen`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `categoriaHabitoId` | body | `number` | Sí | Una de las 5 categorías |
| `nombre` | body | `string` | Sí | 2 a 100 caracteres |
| `descripcion` | body | `string` | No | Máx 300 |
| `unidadMedida` | body | `string` | Sí | 1 a 30 caracteres, ej. "vasos", "minutos" |
| `frecuencia` | body | `string` | No | `diaria` (por defecto) o `semanal`; la app no lo envía |
| `metaInicial` | body | `object` | No | La API lo admite; la app **no** lo envía: la meta se crea después en la pestaña Metas |

**Cuerpo:**

```json
{ "categoriaHabitoId": 5, "nombre": "Leer", "unidadMedida": "páginas" }
```

---

## Respuesta

**Éxito:**

```json
{ "id": 7, "categoriaHabitoId": 5, "nombre": "Leer", "descripcion": null, "unidadMedida": "páginas", "frecuencia": "diaria", "activo": true, "rachaActual": 0, "rachaMaxima": 0, "metaActiva": null }
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Los 7 campos del hábito | `Habito` | `aHabito()`; se añade a `habitos` |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Se muestra el primer error de campo en el formulario |
| 404 | `CATEGORY_NOT_FOUND` | Se muestra el `detail` |
| 422 | `BUSINESS_RULE_VIOLATION` (valor objetivo ≤ 0) | Se muestra el `detail` |
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | No se reintenta (D-16): "No pudimos conectar…"; el formulario queda abierto |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** En línea (la mutación exige red)
- **Entidad cacheada:** `hst:v1:habitos`
- **Invalidación:** Tras el éxito se actualiza el estado en memoria y se reescribe la clave afectada; no se vuelve a pedir la lista completa.
