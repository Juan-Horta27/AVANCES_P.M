# Componente — Badge

- **Ubicación:** `src/components/Badge.tsx`
- **Estado:** Estable

---

## Propósito

Etiqueta compacta o píldora para comunicar estados categóricos o booleanos (ej. "Activa" / "Inactiva", "Meta cumplida").

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `texto` | `string` | Sí | — | Texto corto en mayúsculas |
| `color` | `string` | No | `colors.muted` | Color del texto y del borde (la píldora no tiene fondo de color) |

---

## Tokens usados

- `radius.pill` (999) para forma de cápsula.
- `fontSize.xs` (11) con `fontWeight: '700'`.
