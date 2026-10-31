# Componente — AppButton

- **Ubicación:** `src/components/AppButton.tsx`
- **Estado:** Estable

---

## Propósito

Es **el único botón de la app**. Cualquier acción pulsable con apariencia de botón usa este
componente; no se crean `Pressable` con estilo propio en las pantallas.

**Cuándo NO usarlo:** para enlaces de texto (como "Regístrate aquí" en el login), para iconos
pulsables sin fondo (la "×" del modal, las flechas de fecha) o para filas de lista pulsables.
Esos casos usan `Pressable` o `Text` con `onPress` directamente.

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `titulo` | `string` | Sí | — | El texto del botón |
| `onPress` | `() => void` | Sí | — | Qué ocurre al pulsarlo |
| `variante` | `'primario' \| 'secundario' \| 'peligro'` | No | `'primario'` | La intención de la acción |
| `deshabilitado` | `boolean` | No | `false` | Bloquea la pulsación y baja la opacidad |
| `cargando` | `boolean` | No | `false` | Muestra un `ActivityIndicator` en lugar del título y bloquea la pulsación (formularios mientras responde la API) |
| `style` | `ViewStyle` | No | — | Ajustes de disposición del contenedor (márgenes, `flex`) |

> `style` se aplica **al final** del arreglo de estilos, así que puede sobrescribir cualquier
> cosa. Se usa solo para disposición, nunca para cambiar el color o el radio: si hace falta
> otro aspecto, es una variante nueva.

---

## Variantes

| Variante | Fondo | Borde | Texto | Cuándo se usa |
|----------|-------|-------|-------|---------------|
| `primario` | `colors.teal` | `colors.teal` | `colors.bg` | La acción principal de la pantalla: Iniciar sesión, Guardar, Crear |
| `secundario` | `colors.surface2` | `colors.border` | `colors.text` | Acción alternativa: Cancelar, la acción de un `EmptyState` |
| `peligro` | transparente | `colors.red` | `colors.red` | Acción destructiva: Eliminar, Cerrar sesión |

**Regla de composición:** en una fila de dos botones, el primario va a la derecha y el
secundario a la izquierda, siguiendo la convención de las plataformas móviles.

---

## Estados visuales

| Estado | Apariencia |
|--------|------------|
| Normal | Según la variante |
| Presionado | `opacity: 0.75` — solo si no está deshabilitado |
| Deshabilitado | `opacity: 0.4` y `onPress` bloqueado por `disabled` |
| Cargando | `cargando={true}`: `ActivityIndicator` en lugar del título, pulsación bloqueada y `accessibilityState={{ disabled: true, busy: true }}` (desde 2026-10-25) |

---

## Tokens usados

- **Color:** `colors.teal`, `colors.surface2`, `colors.border`, `colors.text`, `colors.bg`, `colors.red`
- **Espaciado:** `spacing.md + 1` vertical, `spacing.lg` horizontal
- **Radio:** `radius.md`
- **Tipografía:** `fontSize.md`, peso `700`

---

## Accesibilidad

- **Rol:** declara `accessibilityRole="button"`; el lector anuncia el `titulo`.
- **Objetivo táctil:** `fontSize.md` (15) + `spacing.md + 1` (13) de relleno arriba y abajo,
  más los bordes, dan aproximadamente **48 dp** de altura. Cumple el mínimo de ambas plataformas.
- **Pendiente:** cuando `deshabilitado` es `true`, el componente pasa `disabled` a `Pressable`
  pero **no expone `accessibilityState={{ disabled: true }}`**. Un lector de pantalla no anuncia
  que el botón está inactivo.

---

## Ejemplo de uso

```tsx
<AppButton titulo="Guardar registro" onPress={guardar} />

<AppButton
  titulo="Cancelar"
  onPress={() => navigation.goBack()}
  variante="secundario"
  style={styles.mitad}
/>

<AppButton
  titulo="Cerrar sesion"
  onPress={confirmarCierre}
  variante="peligro"
/>
```
