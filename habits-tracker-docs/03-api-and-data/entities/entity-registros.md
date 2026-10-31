# Entidad local — registros

> **Estado: implementada** (2026-10-25) en `src/storage/cache.ts`, clave `hst:v1:registros`. Lo
> registrado sin conexión **no** entra aquí: espera en una clave aparte,
> [`hst:v1:pendientes`](./entity-pendientes.md) (S-06, 2026-10-28), hasta que el servidor lo acepta.

- **Almacén:** `AsyncStorage` (clave-valor, JSON serializado)
- **Clave:** `hst:v1:registros`
- **Versión de esquema en que se introduce:** v1
- **Tipo de dominio equivalente:** `RegistroDiario` en `src/types/index.ts`

---

## Forma almacenada

El valor de la clave es un **arreglo JSON de objetos `RegistroDiario`**, serializado tal cual.
No hay modelo persistido aparte porque el dominio ya es JSON plano
([ver persistence.md](../persistence.md)).

```json
[
  {
    "id": 42,
    "habitoId": 1,
    "fecha": "2026-09-17",
    "valorRegistrado": 9,
    "metaCumplida": true,
    "notas": "Buen ritmo durante la manana"
  }
]
```

---

## Campos

| Campo | Tipo | Nulo | Notas |
|-------|------|------|-------|
| `id` | `number` | No | Identificador del servidor. Aquí solo hay registros que el servidor ya aceptó |
| `habitoId` | `number` | No | Referencia a un `Habito` del caché `hst:v1:habitos` |
| `fecha` | `string` | No | **Texto `YYYY-MM-DD`**. Nunca `Date`, nunca timestamp ([ADR-003](../../01-architecture/decisions/records/ADR-003-fechas-como-texto-iso.md)) |
| `valorRegistrado` | `number` | No | Mayor o igual a 0, en la unidad de medida del hábito |
| `metaCumplida` | `boolean` | No | Lo calcula el servidor al crear el registro y queda congelado; solo se recalcula si se **edita el valor** (`PUT /registros/:id`, ADR-011) |
| `notas` | `string` | Sí | `null` cuando está vacía |

> **Por qué `metaCumplida` se congela:** se evalúa contra la meta que estaba activa **ese día**.
> Si la persona sube su meta de 6 a 8 vasos, los registros antiguos deben seguir contando como
> cumplidos frente a la meta de entonces. Recalcularlos reescribiría su historia.

---

## Unicidad e índices

`AsyncStorage` no tiene índices: las consultas se hacen recorriendo el arreglo en memoria. Esto
es aceptable al volumen previsto (del orden de 3.600 registros para un año de uso intensivo) y
es parte de lo que justifica no usar SQLite.

**Restricción lógica, aplicada en el código, no por el almacén:**

| Restricción | Dónde se aplica |
|-------------|-----------------|
| `(habitoId, fecha)` es único | `@@unique([habitoId, fecha])` en la API (`409 DUPLICATE_DAILY_LOG`); la app muestra el `detail`. En la cola, `encolar` evita dos pendientes del mismo día |

**Consultas más frecuentes** (para saber qué se degradaría primero si el volumen creciera):

| Consulta | Dónde | Coste |
|----------|-------|-------|
| Registros de hoy | `registrosDeHoy` | Un recorrido |
| Registros de un hábito | `RegistrosScreen` con filtro | Un recorrido |
| Registros cumplidos de un hábito, ordenados | `calcularRacha` | Un recorrido + ordenación |
| Registros de un mes | `HistorialScreen` | Un recorrido |
| Agrupación por semana | `HistorialScreen` | Un recorrido con `Map` |

---

## Relaciones

| Entidad relacionada | Clave | Cardinalidad |
|---------------------|-------|--------------|
| `habitos` | `habitoId` | N:1 |
| `metas` | Indirecta, a través de `habitoId` | El registro **no guarda** `metaId`: guarda el resultado en `metaCumplida` |

> El registro no referencia la meta contra la que se evaluó. Es una simplificación consciente
> del MVP: basta con conservar el veredicto. Si más adelante hiciera falta auditar contra qué
> meta exacta se juzgó cada registro, habría que añadir `metaId` y migrar a `hst:v2:`.

---

## Sincronización

- **¿Se sincroniza?** Lectura con caché. Crear funciona sin red a través de la cola
  [`pendientes`](./entity-pendientes.md); editar y eliminar exigen red.
- **Política de conflictos:** **el servidor gana** ante un duplicado `(habitoId, fecha)`. El
  registro local se descarta y se informa al usuario.
- **Idempotencia:** garantizada por `clienteId` (ver
  [`../endpoints/endpoint-post-registro.md`](../endpoints/endpoint-post-registro.md)).

---

## Notas de migración

- Introducida en v1. No hay versión anterior de la que migrar.
- Como el caché es reconstruible desde `GET /registros`, **descartar es una migración válida**
  para cambios de forma menores: se borra `hst:v1:registros` y se vuelve a pedir todo.
- **Excepción importante:** la cola `hst:v1:pendientes` **no es descartable**, porque contiene
  datos que el servidor todavía no tiene. Cualquier migración debe preservarla o subirla antes
  de migrar.
