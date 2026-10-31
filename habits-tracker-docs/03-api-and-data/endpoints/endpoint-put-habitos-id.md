# Integración de endpoint — Editar hábito

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-07 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [habitos](../../01-architecture/features/feature-habitos.md)
- **Método y ruta:** `PUT /api/v1/habitos/:id`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `editarHabito` del contexto; botón **Editar** de cada tarjeta en `HabitosScreen` (ventana precargada)

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `id` | path | `number` | Sí |  |
| `nombre` | body | `string` | No | 2 a 100 |
| `descripcion` | body | `string \| null` | No | Vacía → `null` |
| `unidadMedida` | body | `string` | No | 1 a 30 |
| `frecuencia`, `activo` | body |  | No | La API los admite (`activo: true` reactiva un archivado); la app no los envía |

**Cuerpo:**

```json
{ "nombre": "Beber agua", "descripcion": "Ocho vasos repartidos durante el día", "unidadMedida": "vasos" }
```

---

## Respuesta

**Éxito:**

```json
{ "id": 7, "nombre": "Beber agua", "descripcion": "Ocho vasos repartidos durante el día", "...": "..." }
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Objeto completo | `Habito` | Reemplaza el hábito con ese `id` en memoria |

> La categoría **no** se edita: la ventana la muestra fija ("no se puede cambiar"), porque cambiarla alteraría el sentido del historial.

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Primer error de campo en el formulario |
| 404 | `HABIT_NOT_FOUND` | Se muestra el `detail` |
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | No se reintenta: "No pudimos conectar…" |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** En línea (la mutación exige red)
- **Entidad cacheada:** `hst:v1:habitos`
- **Invalidación:** Tras el éxito se actualiza el estado en memoria y se reescribe la clave afectada; no se vuelve a pedir la lista completa.
