# Componente — Input

- **Ubicación:** `src/components/Input.tsx`
- **Estado:** Estable

---

## Propósito

Campo de texto estándar para formularios, con etiqueta visible, teclado numérico o de correo, modo contraseña y multilínea. Los errores de validación no van en el campo: la pantalla los muestra encima del formulario.

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `etiqueta` | `string` | Sí | — | Etiqueta superior del campo; también es su `accessibilityLabel` |
| `valor` | `string` | Sí | — | Valor actual del texto |
| `onChange` | `(texto: string) => void` | Sí | — | Manejador de cambio de texto |
| `placeholder` | `string` | No | `undefined` | Texto de guía |
| `esContrasena` | `boolean` | No | `false` | Activa `secureTextEntry` |
| `tipoTeclado` | `KeyboardTypeOptions` | No | `'default'` | Tipo de teclado móvil |
| `multilinea` | `boolean` | No | `false` | Permite saltos de línea |
| `style` | `ViewStyle` | No | — | Ajustes de disposición del contenedor |
