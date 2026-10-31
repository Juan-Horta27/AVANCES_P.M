# Pantalla — Registros

- **Ruta:** `Registros` (pestaña del `TabParamList`, rol `paciente`)
- **Feature:** [registro diario](../features/feature-registro-diario.md)
- **Referencia de diseño:** `Project/HU-02.md` sección 5.3; M-06 y S-06
- **Archivo:** `src/screens/RegistrosScreen.tsx`

---

## Propósito

Ver todos los registros diarios, del más reciente al más antiguo, filtrarlos por hábito,
**editarlos** o eliminarlos, y ver los que están **pendientes de subir** por falta de conexión.

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Encabezado | `ScreenHeader` | "📋 Registros"; subtítulo "N registros" o "N registros · M pendientes de subir"; botón `+` (etiqueta "Nuevo registro") |
| Filtro | `ChipSelector` | "Filtrar por habito": Todos y cada hábito |
| Pendientes | `Card` con borde punteado naranja | Arriba de la lista: ⏳, hábito, "<fecha> · Pendiente de subir", valor y unidad (S-06) |
| Lista | `FlatList` de `Card` | ✅ si cumplió la meta, ⭕ si no; hábito, fecha, notas, valor y unidad; botones ✎ y ✕ |
| Vacío | `EmptyState` | "Sin registros · Registra el avance de tus habitos para ver tu progreso aqui." con acción para registrar |

---

## Estados

| Estado | Disparador | Interfaz |
|--------|------------|----------|
| Cargado | Hay registros | La lista ordenada por fecha descendente |
| Con pendientes | Se registró sin red | Tarjetas punteadas arriba y el conteo en el subtítulo |
| Vacío | Sin registros ni pendientes en el filtro | `EmptyState` |
| Sin conexión | Sin red | La lista desde la caché (Android/iOS) y la franja "Sin conexión" de las pestañas |

---

## Acciones

| Acción | Resultado | Caso de uso / evento |
|--------|-----------|----------------------|
| Elegir un hábito en el filtro | Muestra solo sus registros y pendientes | M-07 |
| `+` | Abre `NuevoRegistro` | M-06 |
| ✎ (etiqueta "Editar registro") | Abre `NuevoRegistro` con `{ registroId }` en modo edición | C-04 / ADR-011 |
| ✕ (etiqueta "Eliminar registro") | Confirmación "¿Eliminar este registro diario?"; `DELETE /registros/:id`; la racha se recalcula | M-06 |

---

## Accesibilidad

- [x] ✎ y ✕ son botones con etiqueta ("Editar registro", "Eliminar registro"), porque el icono solo no se anuncia.
- [x] El cumplimiento se lee por el emoji y el texto, no solo por color.
- [x] Los pendientes se distinguen por texto ("Pendiente de subir"), no solo por el borde.
- [ ] Texto escalable con el tamaño de fuente del sistema: sin verificar en dispositivo.
