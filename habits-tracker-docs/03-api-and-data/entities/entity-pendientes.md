# Entidad local — pendientes (cola sin conexión)

> **Estado: implementada (2026-10-28)** en `src/storage/pendientes.ts`, clave `hst:v1:pendientes`
> (HU-02 S-06, [ADR-011](../../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md)).
> Cómo se llena y se vacía: [offline-sync.md](../offline-sync.md).

- **Almacén:** `AsyncStorage` (clave-valor, JSON serializado). **Activa también en la web** (`localStorage`).
- **Clave:** `hst:v1:pendientes`
- **Versión de esquema en que se introduce:** v1
- **Tipo equivalente:** `RegistroPendiente` (= `DatosNuevoRegistro` + `clienteId`) en `src/storage/pendientes.ts`

---

## Forma almacenada

Un objeto con el dueño de la cola y la lista, en el orden en que se registraron:

```json
{
  "usuarioId": 1,
  "registros": [
    {
      "habitoId": 2,
      "fecha": "2026-10-28",
      "valorRegistrado": 40,
      "notas": "Por el parque",
      "clienteId": "9f1c0a7e-3b2d-4c5e-8a10-2f7b6d4e1c33"
    }
  ]
}
```

---

## Campos

| Campo | Tipo | Nulo | Notas |
|-------|------|------|-------|
| `usuarioId` | `number` | No | Dueño de la cola. Si al leer no coincide con la sesión, la cola se descarta |
| `registros[].habitoId` | `number` | No | Hábito del paciente |
| `registros[].fecha` | `string` | No | `YYYY-MM-DD` (ADR-003) |
| `registros[].valorRegistrado` | `number` | No | ≥ 0 |
| `registros[].notas` | `string` | Sí | Se omite si está vacía |
| `registros[].clienteId` | `string` | No | UUID v4 (`expo-crypto`), generado **antes** del primer intento y reutilizado en cada reenvío |

> No hay `id` ni `metaCumplida`: los asigna el servidor al aceptar el registro.

---

## Unicidad e índices

| Restricción | Dónde se aplica |
|-------------|-----------------|
| Un pendiente por `(habitoId, fecha)` | `encolar` en `AppContext`: rechaza el segundo con un mensaje |
| `clienteId` único | Lo garantiza el UUID; en el servidor, `registro_diario_cliente_id_key` |

Sin índices: la cola tiene pocos elementos y se recorre entera.

---

## Relaciones

| Entidad relacionada | Clave | Cardinalidad |
|---------------------|-------|--------------|
| `habitos` | `habitoId` | N:1 |
| `registros` | Ninguna hasta subirse; luego el servidor devuelve el `RegistroDiario` y entra en `hst:v1:registros` | — |

---

## Sincronización

- **¿Se sincroniza?** Sí: es su única razón de existir. Se reenvía en orden con `POST /registros`.
- **Política de conflictos:** **gana el servidor**. Ante `409 DUPLICATE_DAILY_LOG` u otro error con
  código, el pendiente se descarta y se avisa a la persona.
- **Idempotencia:** el mismo `clienteId` en cada reenvío; el servidor devuelve `200` si ya lo tenía.

---

## Notas de migración

- **No es descartable**, a diferencia de la caché: contiene datos que el servidor todavía no tiene.
  `descartarVersionesAnteriores()` solo borra claves de otra versión (`hst:v0:…`), nunca `hst:v1:pendientes`.
- Si la cola está corrupta (JSON ilegible), no hay nada recuperable y se borra.
- Al cerrar sesión se borra con `borrarPendientes()`, después de advertir a la persona si había pendientes.
