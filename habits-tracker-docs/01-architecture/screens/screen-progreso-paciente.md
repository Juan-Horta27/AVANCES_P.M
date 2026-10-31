# Pantalla — Progreso del paciente

- **Ruta:** `ProgresoPaciente` con parámetros `{ usuarioId: number; nombre: string }` (grupo del rol `profesional`)
- **Feature:** [panel del profesional](../features/feature-panel-profesional.md)
- **Referencia de diseño:** `Project/HU-02.md`, Flujo 5 y M-09 ("reportes de progreso por rango de fechas")
- **Archivo:** `src/screens/ProgresoPacienteScreen.tsx`

---

## Propósito

Mostrar al profesional, para un paciente y un rango de fechas, cuántos días registró cada hábito,
cuántos cumplió la meta, el porcentaje de adherencia y la racha máxima. **Todos los cálculos los
hace el servidor** (`GET /reportes/progreso`); la pantalla solo los muestra.

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Encabezado | `ScreenHeader` | El nombre del paciente como título, "Progreso del paciente" como subtítulo y el botón de volver (etiqueta "Volver a la lista de pacientes") |
| Atajos de rango | `SegmentedTabs` | "7 días", "30 días" (por defecto) y "Este mes" |
| Ajuste fino | Dos filas con flechas | "Desde" y "Hasta", cada una con día anterior / día siguiente (`moverExtremo` de `utils/rango.ts`): no deja pasar de hoy ni que "Desde" supere a "Hasta" |
| Totales | `Card` | "Días evaluados", "Días cumplidos" y "Adherencia" del rango, esta última con su color |
| Por hábito | `Card` por hábito | Icono y nombre, `Badge` "Archivado" si aplica, meta activa, barra de color con el porcentaje, "N de M días cumplidos" y "Racha máxima" |
| Vacío | `EmptyState` | "Sin registros en este rango" |

> El color de la barra sale de `colorDeCumplimiento()` en `constants/theme.ts`: **≥ 80 %** verde,
> **≥ 50 %** naranja y menos, rojo. Son los mismos umbrales que usa el historial del paciente.

---

## Estados

| Estado | Disparador | Interfaz |
|--------|------------|----------|
| Cargando | Al abrir y al cambiar el rango | `ActivityIndicator` |
| Cargado | El reporte llega | Totales y tarjetas por hábito |
| Vacío | `habitos` llega vacío | `EmptyState` |
| Error | Falla la petición (incluida la falta de red) | Mensaje con **Reintentar** |
| Sin conexión | Igual que Error: sin caché | — |

---

## Acciones

| Acción | Resultado | Caso de uso / evento |
|--------|-----------|----------------------|
| Tocar "7 días" / "30 días" / "Este mes" | Cambia el rango y vuelve a pedir el reporte | M-09 |
| Flechas de "Desde" o "Hasta" | Mueve ese extremo un día y vuelve a pedir el reporte; el atajo queda sin marcar | M-09 |
| Volver | Regresa a `Pacientes` | — |

---

## Accesibilidad

- [x] Las flechas tienen etiquetas como "Desde: día siguiente" y "Hasta: día anterior".
- [x] Los atajos son pestañas (`role=tab`) con su texto visible.
- [x] El porcentaje se muestra también en número, no solo con el color de la barra.
- [ ] Texto escalable con el tamaño de fuente del sistema: sin verificar en dispositivo.
- [x] Contraste: colores del tema sobre fondo oscuro.
