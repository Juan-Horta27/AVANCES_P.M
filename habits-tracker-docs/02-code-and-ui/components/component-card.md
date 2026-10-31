# Componente — Card

- **Ubicación:** `src/components/Card.tsx`
- **Estado:** Estable

---

## Propósito

Superficie contenedora base que agrupa información relacionada con fondo `surface` y borde sutil, soportando un acento lateral opcional para destacar elementos activos.

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `children` | `React.ReactNode` | Sí | — | Contenido interno de la tarjeta |
| `style` | `StyleProp<ViewStyle>` | No | — | Sobrescritura de disposición |
| `acento` | `string` | No | `undefined` | Color del borde izquierdo de 3px (ej. `colors.teal` para metas activas) |

---

## Tokens usados

- `colors.surface` (`#161B22`), `colors.border` (`#30363D`), `radius.md` (10), `spacing.lg` (16).
