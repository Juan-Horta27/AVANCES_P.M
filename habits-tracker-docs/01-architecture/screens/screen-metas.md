# Pantalla — Metas

- **Ruta:** `Metas` (pestaña del `TabParamList`, rol `paciente`)
- **Feature:** [metas](../features/feature-metas.md)
- **Referencia de diseño:** `Project/HU-02.md` sección 5.6; M-05 ("crear, editar y eliminar metas")
- **Archivo:** `src/screens/MetasScreen.tsx`

---

## Propósito

Definir la meta diaria de cada hábito (valor objetivo y descripción), activarla o desactivarla,
editarla y eliminarla. Un hábito solo puede tener **una meta activa** (TC-004).

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Encabezado | `ScreenHeader` | "🎯 Metas", total y botón `+` (etiqueta "Crear meta") |
| Lista | `FlatList` de `Card` | Todas las metas. Nombre del hábito ("Habito eliminado" si ya no existe), descripción, `Badge` "Activa"/"Inactiva" y el objetivo grande: "8 vasos al dia" |
| Acciones de la tarjeta | 3 × `AppButton` | **Desactivar meta** / **Activar meta**, **Editar** y **Eliminar** |
| Vacío | `EmptyState` | "Sin metas · Define una meta por habito para medir tu cumplimiento diario." |
| Ventana | `Modal` | "Nueva meta" o "Editar meta"; Habito * (solo hábitos activos; fijo al editar), Valor objetivo *, Descripcion *; Cancelar y Guardar |

---

## Estados

| Estado | Disparador | Interfaz |
|--------|------------|----------|
| Cargado | Hay metas | La lista |
| Vacío | No hay metas | `EmptyState` |
| Error de formulario | Campos vacíos o valor ≤ 0 | "Completa todos los campos" o "El valor objetivo debe ser un número mayor a 0" |
| Regla de negocio | Activar o crear con otra meta activa | Aviso "Acción no permitida" con el `detail` del servidor (`409 ACTIVE_GOAL_EXISTS`) |
| Sin conexión | Sin red | Lista desde la caché; las acciones muestran "No pudimos conectar…" |

---

## Acciones

| Acción | Resultado | Caso de uso / evento |
|--------|-----------|----------------------|
| `+` → completar → Guardar | `crearMeta` → `POST /metas` | M-05 crear |
| **Editar** → Guardar | `editarMeta` → `PATCH /metas/:id` con valor y descripción | M-05 editar (ADR-011) |
| **Desactivar / Activar meta** | `alternarMeta` → `PATCH /metas/:id` con `activa` | M-05, TC-004 |
| **Eliminar** | Confirmación "Eliminar meta · ¿Eliminar esta meta? Los registros ya evaluados conservan su resultado."; `DELETE /metas/:id` | M-05 eliminar (ADR-011) |

> Editar o eliminar una meta no cambia los registros anteriores: su `metaCumplida` quedó
> congelado al registrar (D-02).

---

## Accesibilidad

- [x] Botón `+` con la etiqueta "Crear meta"; botones de tarjeta con texto visible.
- [x] El estado de la meta se lee como texto ("Activa"/"Inactiva"), no solo por color.
- [ ] Texto escalable con el tamaño de fuente del sistema: sin verificar en dispositivo.
- [x] Colores del tema.
