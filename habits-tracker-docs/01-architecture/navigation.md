# Navegación

**Librería:** React Navigation 7 (`native-stack` + `bottom-tabs`).

---

## Modelo

Dos niveles, declarados en dos archivos y en ningún otro sitio:

- `src/navigation/AppNavigator.tsx` — **stack raíz**: autenticación y, según el **rol** (ADR-011),
  el grupo del paciente (pestañas + modal de registro) o el del profesional (Pacientes + Progreso).
- `src/navigation/TabNavigator.tsx` — **pestañas inferiores del paciente**, con la franja
  "Sin conexión" y el contador de pendientes (S-06).

```
                 ┌─ rol paciente ──► Tabs ─────────────────────────► NuevoRegistro (modal:
Login ──► sesión ┤                    ├── 🏠 Inicio      Dashboard            crear o editar)
  │              │                    ├── 📌 Habitos     crear · editar · eliminar
  ▼              │                    ├── 🎯 Metas       crear · editar · activar · eliminar
Registro         │                    ├── 📋 Registros   filtro · pendientes · editar · eliminar
(siempre         │                    └── 📊 Historial   por mes / por semana
 paciente)       │
                 └─ rol profesional ► Pacientes ──► ProgresoPaciente { usuarioId, nombre }
```

Los headers nativos están desactivados (`headerShown: false`) en ambos navegadores: cada
pantalla dibuja su propio encabezado con el componente `ScreenHeader`, para que el título y
las acciones sigan el mismo diseño en las dos plataformas.

---

## Rutas tipadas

Las rutas no se escriben como cadenas sueltas: están declaradas como tipos en
`src/types/index.ts`, y TypeScript rechaza una navegación a una ruta inexistente o con
parámetros equivocados.

```ts
export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  // Paciente
  Tabs: undefined;
  NuevoRegistro: { habitoId?: number; registroId?: number } | undefined;
  // Profesional
  Pacientes: undefined;
  ProgresoPaciente: { usuarioId: number; nombre: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Habitos: undefined;
  Metas: undefined;
  Registros: undefined;
  Historial: undefined;
};
```

---

## Registro de rutas

### Stack raíz

| Ruta | Pantalla | Parámetros | Disponible para | Presentación |
|------|----------|------------|-----------------|--------------|
| `Login` | `LoginScreen` | — | Sin sesión | Pantalla completa (ruta inicial) |
| `Registro` | `RegisterScreen` | — | Sin sesión | Pantalla completa |
| `Tabs` | `TabNavigator` | — | `paciente` | Pantalla completa |
| `NuevoRegistro` | `NuevoRegistroScreen` | `{ habitoId?: number; registroId?: number }` | `paciente` | **Modal**; con `registroId` edita |
| `Pacientes` | `PacientesScreen` | — | `profesional` | Pantalla completa (inicio del rol) |
| `ProgresoPaciente` | `ProgresoPacienteScreen` | `{ usuarioId: number; nombre: string }` | `profesional` | Pantalla completa |

### Pestañas

| Ruta | Pantalla | Título | Icono |
|------|----------|--------|-------|
| `Dashboard` | `DashboardScreen` | Inicio | 🏠 |
| `Habitos` | `HabitosScreen` | Habitos | 📌 |
| `Metas` | `MetasScreen` | Metas | 🎯 |
| `Registros` | `RegistrosScreen` | Registros | 📋 |
| `Historial` | `HistorialScreen` | Historial | 📊 |

> Esta tabla y los archivos de `src/navigation/` son la misma verdad contada dos veces.
> Si cambias uno, cambias el otro en el mismo PR.

---

## Reglas

- **Se pasan identificadores, no objetos de dominio.** `NuevoRegistro` recibe `habitoId` o
  `registroId`, no el objeto; la pantalla lo resuelve con `habitoPorId()` o buscando en
  `registros`. Así el dato nunca llega desactualizado. (`ProgresoPaciente` recibe además el
  `nombre`, solo para pintar el título mientras llega el reporte.)
- **Las transiciones de sesión no se navegan a mano.** Al entrar o salir cambia `estadoSesion`
  (y el rol), y `AppNavigator` monta otro grupo de rutas: el botón "atrás" no puede devolver a
  una sesión cerrada ni a las pantallas del otro rol.
- **El modal se cierra con `goBack()`**, nunca navegando a la pestaña de origen: así el usuario
  vuelve exactamente a donde estaba.
- **El comportamiento del botón atrás es el nativo** en Android; no se intercepta.
- **Ninguna pantalla se instancia a mano** dentro de otra. Si algo debe verse encima, es una
  ruta modal o un `<Modal>` de React Native dentro de la misma pantalla (como hacen
  `HabitosScreen` y `MetasScreen` para sus formularios de creación).

---

## Tema de navegación

`AppNavigator` extiende `DarkTheme` de React Navigation y le inyecta los tokens de
`constants/theme.ts`, para que el fondo de las transiciones y el color del contenedor coincidan
con el resto de la app y no aparezca un destello blanco al navegar:

```ts
background: colors.bg      card: colors.surface    border: colors.border
text: colors.text          primary: colors.teal
```

---

## Deuda conocida

| Tema | Estado | Plan |
|------|--------|------|
| **Guardia de autenticación** | ✅ Resuelto (2026-10-25) | `AppNavigator.tsx` monta el grupo `Login`/`Registro` o el grupo `Tabs`/`NuevoRegistro` según `estadoSesion`; ya no se navega a mano al entrar o salir. Mientras se lee el token o se cargan datos, muestra `PantallaEstado` |
| **Guardia de rol** | ✅ Resuelto (2026-10-28, ADR-011) | Con rol `profesional` se monta el grupo `Pacientes`/`ProgresoPaciente`; las rutas del paciente no existen para él (y la API responde `403` si se intentaran) |
| **Deep links** | ❌ No configurados | El esquema `habitos://` ya está declarado en `app.json`. El mapeo de URLs a esta misma tabla de rutas se hará con el `linking` de `NavigationContainer`, sin lógica de parseo por pantalla. |
| **Pantalla de perfil y de categorías** | ❌ No existen | Previstas como sexta pestaña o como ruta del stack. |
