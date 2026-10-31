# Componente — StatCard

- **Ubicación:** `src/components/StatCard.tsx`
- **Estado:** Estable

---

## Propósito

Tarjeta métrica compacta para destacar un indicador cuantitativo clave con un icono superior, número grande y etiqueta descriptiva.

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `etiqueta` | `string` | Sí | — | Nombre del indicador |
| `valor` | `string \| number` | Sí | — | Valor numérico o texto principal |
| `icono` | `string` | Sí | — | Emoji representativo |
| `color` | `string` | Sí | — | Color de acento de la tarjeta |
| `detalle` | `string` | No | `undefined` | Texto de contexto adicional (p. ej. "de 9 registros") |
