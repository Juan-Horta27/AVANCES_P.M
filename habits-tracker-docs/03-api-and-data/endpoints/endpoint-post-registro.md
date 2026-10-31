# Integración de endpoint — Crear registro diario

> **Estado: implementado (2026-10-25; cola sin conexión desde el 2026-10-28).** `crearRegistro` del
> contexto llama a este endpoint; sin red, el registro entra en la cola S-06 ([offline-sync.md](../offline-sync.md)).

- **Feature:** [registro diario y rachas](../../01-architecture/features/feature-registro-diario.md)
- **Método y ruta:** `POST /api/v1/registros` (en plural, ADR-008 D-08; antes figuraba como `POST /registro`)
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente (ADR-011)
- **Consumido por:** `crearRegistro` en `AppContext`, a través de `services/registros.ts`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|-------|----|------|-------------|-------|
| `habitoId` | body | `number` | Sí | Debe pertenecer al usuario del token |
| `fecha` | body | `string` | Sí | **Texto `YYYY-MM-DD`**, nunca ISO con hora ni timestamp |
| `valorRegistrado` | body | `number` | Sí | Mayor o igual a 0 |
| `notas` | body | `string` | No | Se omite si está vacío tras recortar espacios |
| `clienteId` | body | `string` | Sí | UUID generado por el cliente, para idempotencia offline |

```json
{
  "habitoId": 1,
  "fecha": "2026-09-17",
  "valorRegistrado": 9,
  "notas": "Buen ritmo durante la manana",
  "clienteId": "9f1c0a7e-3b2d-4c5e-8a10-2f7b6d4e1c33"
}
```

> `usuarioId` **no viaja en el cuerpo**: el backend lo deduce del token. Enviarlo permitiría a
> un cliente escribir en la cuenta de otra persona.

---

## Respuesta

**Éxito (201):**

```json
{
  "id": 42,
  "habitoId": 1,
  "fecha": "2026-09-17",
  "valorRegistrado": 9,
  "metaCumplida": true,
  "notas": "Buen ritmo durante la manana"
}
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---------------|-------------------|----------------|
| `id` | `RegistroDiario.id` | Directo |
| `habitoId` | `RegistroDiario.habitoId` | Directo |
| `fecha` | `RegistroDiario.fecha` | Directo. **Si llegara con hora, recortar a los 10 primeros caracteres** |
| `valorRegistrado` | `RegistroDiario.valorRegistrado` | Directo |
| `metaCumplida` | `RegistroDiario.metaCumplida` | Directo. **Lo calcula el servidor**, el cliente no lo recalcula |
| `notas` | `RegistroDiario.notas` | `null` si estaba vacía |

> **`metaCumplida` la decide el servidor** (ADR-008, D-18). El cliente no lo calcula: muestra
> "Registro guardado. ¡Meta cumplida!" o "Registro guardado. Sigue esforzándote." según lo que
> devuelve el servidor, que es quien conoce la meta activa real en ese momento.

---

## Errores

| Estado | Significado | Comportamiento de la app |
|--------|-------------|--------------------------|
| 400 | Validación fallida (valor negativo, fecha mal formada) | `{ ok: false, mensaje }` — se muestra en el formulario |
| 401 | Token ausente, inválido o expirado | Cerrar sesión y navegar a `Login` |
| 403 | El hábito no pertenece al usuario del token | Mensaje genérico; no revelar que el hábito existe |
| 404 | El hábito no existe | "El habito ya no esta disponible"; refrescar la lista |
| **409** | **Ya existe un registro de ese hábito para esa fecha** (`DUPLICATE_DAILY_LOG`) | `{ ok: false, mensaje }` con el `detail` del servidor: "Ya existe un registro para este hábito en la fecha indicada." |
| 5xx, timeout o sin red | Transitorio | **No se reintenta en el momento.** El registro entra en la cola `hst:v1:pendientes` con su `clienteId` y se reenvía al volver la red (S-06) |

> El 409 no es un fallo del sistema: es la invariante `@@unique([habitoId, fecha])` haciendo su
> trabajo. La app muestra el `detail` del servidor y no encola el registro.

---

## Idempotencia

`clienteId` es lo que hace seguro reenviar una mutación encolada. Si el backend recibe un
`clienteId` que ya procesó, **devuelve 200 con el registro existente** en lugar de 409: fue el
mismo intento, no un duplicado real.

Esa distinción importa: un 409 significa "ya registraste este hábito hoy" y el usuario debe
verlo; un reenvío de la cola no debe molestar a nadie.

---

## Caché y offline

- **Estrategia:** offline-first (ver [`../offline-sync.md`](../offline-sync.md)).
- **Entidad cacheada:** [`registros`](../entities/entity-registros.md).
- **Invalidación:** tras un 201, se añade el registro al caché y se recalculan los derivados
  (`rachas`, `actividadSemanal`, `registrosDeHoy`). No hace falta pedir la lista completa.
- **Sin conexión:** el registro se guarda en `hst:v1:pendientes` con su `clienteId`, se muestra
  con ⏳ y "Pendiente de subir", y se reenvía solo (implementado el 2026-10-28).
