# Pantalla — Hábitos

- **Ruta:** `Habitos` (pestaña del `TabParamList`, rol `paciente`)
- **Feature:** [gestión de hábitos](../features/feature-habitos.md)
- **Referencia de diseño:** `Project/HU-02.md` sección 5.5; M-04 (CRUD de hábitos)
- **Archivo:** `src/screens/HabitosScreen.tsx`

---

## Propósito

Ver los hábitos activos con su racha, récord, meta y número de registros, y **crear, editar y
eliminar** hábitos desde una ventana (modal).

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Encabezado | `ScreenHeader` | "📌 Habitos", total de hábitos y botón `+` (etiqueta "Crear hábito") |
| Lista | `FlatList` de `Card` | Solo hábitos **activos**. Icono y nombre de la categoría, `Badge` "Activo", descripción y la fila Unidad · Meta · Racha · Récord · Registros |
| Acciones de la tarjeta | 2 × `AppButton` | **Editar** (secundario) y **Eliminar** (peligro) |
| Vacío | `EmptyState` | "Sin habitos · Crea tu primer habito para empezar a hacer seguimiento." |
| Ventana | `Modal` | Título "Nuevo hábito" o "Editar hábito"; campos Nombre *, Categoria * (`ChipSelector`), Unidad de medida *, Descripcion; botones Cancelar y Guardar |

> Al **editar**, la categoría no aparece como selector: se muestra fija, "Categoría: … (no se puede
> cambiar)", porque el contrato no la permite modificar (E-07).

---

## Estados

| Estado | Disparador | Interfaz |
|--------|------------|----------|
| Cargado | Hay hábitos activos | La lista |
| Vacío | No hay hábitos activos | `EmptyState` |
| Guardando | Pulsar Guardar | El botón queda deshabilitado mientras responde la API |
| Error de formulario | Faltan nombre, unidad o categoría, o la API rechaza | "⚠️ Completa nombre, unidad y categoría" o el mensaje del servidor, dentro de la ventana |
| Sin conexión | Sin red | La lista se ve desde la caché (Android/iOS); guardar o eliminar muestra "No pudimos conectar…" |

---

## Acciones

| Acción | Resultado | Caso de uso / evento |
|--------|-----------|----------------------|
| `+` → completar → Guardar | `crearHabito` → `POST /habitos`; el hábito aparece en la lista | M-04 crear |
| **Editar** → cambiar → Guardar | `editarHabito` → `PUT /habitos/:id` con nombre, descripción y unidad | M-04 editar (ADR-011) |
| **Eliminar** | Confirmación `¿Eliminar "<nombre>"?`; el **servidor** lo borra si no tiene registros, o lo **archiva** si tiene (D-10). Aviso "Hábito eliminado." o "El hábito tenía registros: se archivó y su historial se conserva." | M-04 eliminar, TC-003 |

---

## Accesibilidad

- [x] El botón `+` tiene la etiqueta "Crear hábito"; los campos se anuncian con su etiqueta.
- [x] Botones de la tarjeta con texto visible ("Editar", "Eliminar").
- [x] Las categorías del selector son opciones con rol `radio`.
- [ ] Texto escalable con el tamaño de fuente del sistema: sin verificar en dispositivo.
- [x] Colores del tema; el botón destructivo usa el rojo del tema.
