# Entidad local — habitos

> **Estado: implementada (2026-10-25)** en `src/storage/cache.ts`, clave `hst:v1:habitos`.

- **Almacén:** `AsyncStorage` (clave-valor, JSON serializado), solo en Android e iOS
- **Clave:** `hst:v1:habitos`
- **Versión de esquema en que se introduce:** v1
- **Tipo de dominio equivalente:** `Habito` en `src/types/index.ts`
- **Tabla del servidor:** `habito` ([data-model.md §2.3](../data-model.md))

---

## Forma almacenada

Todos los hábitos del paciente, **incluidos los archivados** (se piden con `GET /habitos?activos=false`):

```json
[
  { "id": 1, "categoriaHabitoId": 1, "nombre": "Beber agua", "descripcion": "Ocho vasos al día",
    "unidadMedida": "vasos", "frecuencia": "diaria", "activo": true }
]
```

---

## Campos

| Campo | Tipo | Nulo | Notas |
|-------|------|------|-------|
| `id` | `number` | No | Id del servidor |
| `categoriaHabitoId` | `number` | No | No se edita desde la app |
| `nombre` | `string` | No | 2 a 100 caracteres |
| `descripcion` | `string` | Sí | Vacía → `null` |
| `unidadMedida` | `string` | No | Se muestra junto al valor ("8 vasos") |
| `frecuencia` | `'diaria' \| 'semanal'` | No | La app crea siempre `diaria` |
| `activo` | `boolean` | No | `false` = archivado: no aparece en Hábitos ni en los selectores, pero el historial conserva su nombre (D-10) |

> La racha **no se guarda**: `rachaDe(habitoId)` la calcula con `utils/racha.ts` a partir de los
> registros (D-19). La API también la manda, pero `aHabito()` la ignora para no tener dos verdades.

---

## Unicidad e índices

Sin índices; `habitoPorId` y `habitosActivos` recorren el arreglo (decenas de elementos).

---

## Relaciones

| Entidad relacionada | Clave | Cardinalidad |
|---------------------|-------|--------------|
| `categorias` | `categoriaHabitoId` | N:1 |
| `metas` | `Meta.habitoId` | 1:N (una sola activa) |
| `registros` | `RegistroDiario.habitoId` | 1:N |

---

## Sincronización

- **¿Se sincroniza?** Lectura con caché; las mutaciones (crear, editar, eliminar/archivar) exigen red.
- **Política de conflictos:** gana el servidor; tras eliminar, la app vuelve a pedir la lista para
  saber si el hábito se borró o se archivó.

---

## Notas de migración

Introducida en v1. Reconstruible desde `GET /habitos`: descartarla es una migración válida.
