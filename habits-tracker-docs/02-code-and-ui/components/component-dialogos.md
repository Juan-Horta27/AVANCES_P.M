# Componente — dialogos (`confirmar` y `avisar`)

- **Ubicación:** `src/components/dialogos.ts`
- **Estado:** Estable (2026-10-25)

---

## Propósito

Diálogos de **confirmación** (acciones destructivas) y de **aviso**, iguales en Android, iOS y web.
`Alert.alert` con botones no funciona en `react-native-web` (en el navegador no hace nada), así que
en la web se usan `window.confirm` y `window.alert`. Las pantallas llaman a estas funciones y
**nunca** a `Alert` directamente.

No es un componente visual: son dos funciones.

---

## API

| Función | Firma | Qué hace |
|---------|-------|----------|
| `confirmar` | `(titulo, mensaje, textoAccion) => Promise<boolean>` | Botones "Cancelar" y `textoAccion` (estilo destructivo). Resuelve `true` solo si la persona acepta; cerrar el diálogo cuenta como cancelar |
| `avisar` | `(titulo, mensaje) => void` | Aviso con un solo botón |

---

## Dónde se usa

| Pantalla | Uso |
|----------|-----|
| `HabitosScreen` | Confirmar "Eliminar hábito"; avisar el resultado (eliminado o archivado) |
| `MetasScreen` | Confirmar "Eliminar meta"; avisar "Acción no permitida" (409) |
| `RegistrosScreen` | Confirmar "Eliminar registro" |
| `DashboardScreen`, `PacientesScreen` | Confirmar "Cerrar sesión" (con aviso de pendientes en el paciente) |
| `TabNavigator` | Avisar "Registros pendientes" cuando un pendiente no se pudo subir (S-06) |

---

## Estados visuales

Los del diálogo nativo de cada plataforma.

---

## Accesibilidad

- [x] Los diálogos nativos (y los del navegador) son accesibles por el sistema: foco y lectura los gestiona la plataforma.
- [x] El texto de la acción destructiva nombra lo que pasa ("Eliminar", "Salir"), no un genérico "Aceptar".

---

## Ejemplo de uso

```ts
if (!(await confirmar('Eliminar hábito', `¿Eliminar "${nombre}"?`, 'Eliminar'))) return;
const resultado = await eliminarHabito(id);
avisar(resultado.ok ? 'Listo' : 'No se pudo eliminar', resultado.mensaje ?? '');
```
