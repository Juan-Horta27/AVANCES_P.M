# Componente — AvisoSinConexion

- **Ubicación:** `src/components/AvisoSinConexion.tsx`
- **Estado:** Estable (2026-10-25; contador de pendientes desde el 2026-10-28)

---

## Propósito

Franja que avisa que la app está **sin conexión**: se están viendo datos guardados y, si los hay,
cuántos registros esperan para subir (S-06). Ofrece reintentar la conexión. Es el estado
"sin conexión" que exige el DoD para toda pantalla que carga datos.

---

## Props / API

| Prop | Tipo | Obligatorio | Qué controla |
|------|------|-------------|--------------|
| `detalle` | `string` | Sí | Texto tras "📡 Sin conexión · ", p. ej. "datos de las 21:10 · ⏳ 1 registro pendiente" |
| `reintentando` | `boolean` | Sí | Muestra un indicador en lugar de "Reintentar" y deshabilita el botón |
| `onReintentar` | `() => void` | Sí | Acción del botón (en la app, `reintentarConexion` del contexto) |

El componente **no conoce el contexto**: `TabNavigator` arma el `detalle` con la hora de
`sincronizado` y el número de `pendientes`, y lo monta encima de las pestañas cuando `sinConexion` es `true`.

---

## Estados visuales

| Estado | Qué se ve |
|--------|-----------|
| Normal | Texto a la izquierda y "Reintentar" en naranja a la derecha |
| Reintentando | `ActivityIndicator` pequeño en lugar de "Reintentar"; botón deshabilitado |
| Con pendientes | El mismo texto, con "· ⏳ N registro(s) pendiente(s)" al final |

---

## Tokens usados

`colors.surface2` (fondo), `colors.orange` (borde superior, acción e indicador), `colors.text`,
`fontSize.sm`, `spacing.sm`/`md`/`lg`.

---

## Accesibilidad

- [x] `accessibilityRole="alert"` y `accessibilityLiveRegion="polite"`: el lector anuncia la franja al aparecer.
- [x] El botón tiene `accessibilityLabel="Reintentar conexión"` y `accessibilityState={{ disabled, busy }}`.
- [x] `hitSlop` amplía el área táctil del botón.
- [x] El color no es el único portador del mensaje: lo dice el texto.

---

## Ejemplo de uso

```tsx
{sinConexion ? (
  <AvisoSinConexion
    detalle={`${datos}${enCola}`}
    reintentando={reintentando}
    onReintentar={() => void reintentar()}
  />
) : null}
```
