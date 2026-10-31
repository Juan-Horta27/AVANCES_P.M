# Componente — EmptyState

- **Ubicación:** `src/components/EmptyState.tsx`
- **Estado:** Estable

---

## Propósito

Vista visual para comunicar ausencia de datos o listas vacías, acompañada de un icono grande, título, mensaje opcional y botón de acción principal para crear el primer registro.

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `icono` | `string` | Sí | — | Emoji representativo en tamaño grande (40px) |
| `titulo` | `string` | Sí | — | Título explicativo |
| `mensaje` | `string` | No | `undefined` | Texto de apoyo o sugerencia de acción |
| `accion` | `{ titulo: string; onPress: () => void }` | No | `undefined` | Botón secundario opcional |
