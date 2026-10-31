# Entidad local — categorias

> **Estado: implementada (2026-10-25)** en `src/storage/cache.ts`, clave `hst:v1:categorias`.

- **Almacén:** `AsyncStorage` (clave-valor, JSON serializado), solo en Android e iOS
- **Clave:** `hst:v1:categorias`
- **Versión de esquema en que se introduce:** v1
- **Tipo de dominio equivalente:** `CategoriaHabito` en `src/types/index.ts`
- **Tabla del servidor:** `categoria_habito` ([data-model.md §2.2](../data-model.md)); catálogo fijo cargado por la migración `catalogo_categorias`

---

## Forma almacenada

```json
[
  { "id": 1, "nombre": "Hidratación", "descripcion": "...", "icono": "💧" },
  { "id": 5, "nombre": "Meditación", "descripcion": "...", "icono": "🧘" }
]
```

---

## Campos

| Campo | Tipo | Nulo | Notas |
|-------|------|------|-------|
| `id` | `number` | No | Id del catálogo |
| `nombre` | `string` | No | Único en el servidor |
| `descripcion` | `string` | Sí | |
| `icono` | `string` | Sí | Emoji en texto; la app no usa librería de iconos (D-11) |

---

## Unicidad e índices

Son 5 elementos: sin índices. `categoriaPorId(id)` recorre el arreglo.

---

## Relaciones

| Entidad relacionada | Clave | Cardinalidad |
|---------------------|-------|--------------|
| `habitos` | `categoriaHabitoId` | 1:N |

---

## Sincronización

- **¿Se sincroniza?** Solo lectura (`GET /categorias`). La app nunca la modifica.
- **Política de conflictos:** no aplica.

---

## Notas de migración

Introducida en v1. Reconstruible: descartarla es una migración válida.
