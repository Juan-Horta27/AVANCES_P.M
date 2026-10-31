# Componente — SegmentedTabs

- **Ubicación:** `src/components/SegmentedTabs.tsx`
- **Estado:** Estable

---

## Propósito

Control segmentado de pestañas horizontales para alternar entre dos o más vistas o modalidades en una misma pantalla (ej. Historial "Por mes" y "Por semana").

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `opciones` | `Array<{ valor: T; etiqueta: string }>` | Sí | — | Lista de opciones segmentadas |
| `seleccion` | `T` | Sí | — | Opción actualmente activa |
| `onSeleccionar` | `(valor: T) => void` | Sí | — | Callback de cambio de pestaña |
