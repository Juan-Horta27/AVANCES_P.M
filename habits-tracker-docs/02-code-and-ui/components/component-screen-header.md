# Componente — ScreenHeader

- **Ubicación:** `src/components/ScreenHeader.tsx`
- **Estado:** Estable

---

## Propósito

Barra superior estándar presente en todas las pantallas principales y modales para mantener coherencia visual de encabezado.

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `titulo` | `string` | Sí | — | Título de la pantalla (generalmente con emoji) |
| `subtitulo` | `string` | No | `undefined` | Subtítulo descriptivo o contador de elementos |
| `derecha` | `React.ReactNode` | No | `undefined` | Elemento interactivo a la derecha (ej. botón `+` o enlace de cierre) |
