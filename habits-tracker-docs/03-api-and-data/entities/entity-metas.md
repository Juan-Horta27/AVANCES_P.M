# Entidad local — metas

> **Estado: implementada (2026-10-25; edición y borrado desde el 2026-10-28)** en
> `src/storage/cache.ts`, clave `hst:v1:metas`.

- **Almacén:** `AsyncStorage` (clave-valor, JSON serializado), solo en Android e iOS
- **Clave:** `hst:v1:metas`
- **Versión de esquema en que se introduce:** v1
- **Tipo de dominio equivalente:** `Meta` en `src/types/index.ts`
- **Tabla del servidor:** `meta` ([data-model.md §2.4](../data-model.md))

---

## Forma almacenada

```json
[
  { "id": 1, "habitoId": 1, "valorObjetivo": 8, "descripcion": "8 vasos al día", "activa": true }
]
```

---

## Campos

| Campo | Tipo | Nulo | Notas |
|-------|------|------|-------|
| `id` | `number` | No | Id del servidor |
| `habitoId` | `number` | No | No se cambia al editar |
| `valorObjetivo` | `number` | No | > 0; editable (`PATCH /metas/:id`) |
| `descripcion` | `string` | Sí | Editable; vacía → `null` |
| `activa` | `boolean` | No | Interruptor en `MetasScreen` |

---

## Unicidad e índices

| Restricción | Dónde se aplica |
|-------------|-----------------|
| Una sola meta activa por hábito | En el servicio de la API (`409 ACTIVE_GOAL_EXISTS`, TC-004). La app muestra el `detail` |

`metaActivaDe(habitoId)` recorre el arreglo.

---

## Relaciones

| Entidad relacionada | Clave | Cardinalidad |
|---------------------|-------|--------------|
| `habitos` | `habitoId` | N:1 |
| `registros` | Ninguna: el registro guarda el veredicto (`metaCumplida`), no la meta | — |

---

## Sincronización

- **¿Se sincroniza?** Lectura con caché; crear, editar, activar/desactivar y eliminar exigen red.
- **Política de conflictos:** gana el servidor.
- Eliminar o editar una meta **no cambia** el historial: `metaCumplida` quedó congelado en cada registro (D-02).

---

## Notas de migración

Introducida en v1. Reconstruible desde `GET /metas`: descartarla es una migración válida.
