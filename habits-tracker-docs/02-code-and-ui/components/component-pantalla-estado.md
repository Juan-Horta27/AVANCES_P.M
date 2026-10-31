# Componente — PantallaEstado

- **Ubicación:** `src/components/PantallaEstado.tsx`
- **Estado:** Estable (2026-10-25)

---

## Propósito

Pantalla completa para los estados **cargando** y **error** de una carga de datos. Un error
siempre ofrece una salida (botón principal y, opcionalmente, uno secundario), como pide
[coding-standards.md](../coding-standards.md).

La usan `AppNavigator` ("Cargando tus datos…" y el error de la primera carga) y `PacientesScreen`
("Cargando pacientes…" y su error).

---

## Props / API

| Prop | Tipo | Obligatorio | Qué controla |
|------|------|-------------|--------------|
| `cargando` | `boolean` | Sí | `true`: indicador de carga. `false`: icono ⚠️ de error |
| `mensaje` | `string` | Sí | Texto centrado bajo el indicador o el icono |
| `accionPrincipal` | `{ titulo; onPress }` | No | Botón primario, p. ej. "Reintentar" |
| `accionSecundaria` | `{ titulo; onPress }` | No | Botón secundario, p. ej. "Cerrar sesión" |

---

## Estados visuales

| Estado | Qué se ve |
|--------|-----------|
| Cargando | `ActivityIndicator` grande en `colors.teal` y el mensaje |
| Error | ⚠️, el mensaje y los botones que se pasen |

---

## Tokens usados

`colors.bg`, `colors.teal`, `colors.text`, `fontSize.md`/`xxl`, `spacing.lg`/`xl`. Los botones son `AppButton`.

---

## Accesibilidad

- [x] `accessibilityLiveRegion="polite"` en el contenido: el cambio de "cargando" a "error" se anuncia.
- [x] Los botones son `AppButton` (rol de botón y texto visible).
- [x] Respeta el área segura (`SafeAreaView`).

---

## Ejemplo de uso

```tsx
if (error) {
  return (
    <PantallaEstado
      cargando={false}
      mensaje={error}
      accionPrincipal={{ titulo: 'Reintentar', onPress: () => void cargar() }}
      accionSecundaria={{ titulo: 'Cerrar sesión', onPress: () => void cerrarSesion() }}
    />
  );
}
```
