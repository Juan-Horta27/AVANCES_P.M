# Feature — Autenticación y sesión

- **Responsable:** Juan José Horta Vanegas
- **Estado:** Entregada — login y registro contra el API (`POST /auth/login`, `POST /auth/register`), token en `expo-secure-store`, guardia de navegación (2026-10-25); **roles `paciente` y `profesional`** (2026-10-28, ADR-011)
- **Historias relacionadas:** HU-02 (M-01, M-02)

---

## Propósito

Dar entrada a la aplicación y asociar los hábitos, metas y registros a una persona concreta.
Incluye el alta de cuenta con los datos antropométricos iniciales (edad, peso, estatura) que el
profesional de bienestar usará como línea base.

---

## Pantallas

| Pantalla | Ruta | Propósito |
|----------|------|-----------|
| `LoginScreen` | `Login` (ruta inicial del stack) | Ingresar con correo y contraseña |
| `RegisterScreen` | `Registro` | Crear cuenta: nombres, apellidos, correo, contraseña y datos antropométricos |

El cierre de sesión no tiene pantalla propia: es la acción "Salir" del `DashboardScreen` (paciente)
y de `PacientesScreen` (profesional), con confirmación mediante `confirmar()`.

---

## Estado

- **Patrón:** React Context + `useState` ([ADR-001](../decisions/records/ADR-001-state-management-pattern.md))
- **Estado base:** `estadoSesion` (`iniciando` / `sin-sesion` / `con-sesion`) y `usuario: Usuario | null`, que trae el `rol`
- **Estado local:** campos del formulario y mensaje de error
- **Transiciones clave:** `sin sesión → validando → con sesión`, y `con sesión → sin sesión`

---

## Comportamiento actual

- `iniciarSesion()` llama a `POST /auth/login`; el servidor compara la contraseña con el hash
  bcrypt y devuelve un JWT con `{ sub, rol }`. Credenciales incorrectas → "Credenciales incorrectas."
  (el mismo mensaje exista o no el correo).
- `crearCuenta()` llama a `POST /auth/register` (correo único, contraseña de 8+ caracteres con
  mayúscula y número) y deja la sesión iniciada. **Toda cuenta nueva es `paciente`.**
- El token se guarda en `expo-secure-store`; al reabrir la app, `GET /usuarios/me` restaura la
  sesión sin pedir credenciales. En la web el token vive solo en memoria.
- La guardia de navegación está en `AppNavigator.tsx` y **depende del rol**: sin sesión solo existen
  `Login` y `Registro`; el paciente tiene las pestañas y `NuevoRegistro`; el profesional, `Pacientes`
  y `ProgresoPaciente`. La API repite la regla con `RolesGuard` (`403 FORBIDDEN_ROLE`).
- Un 401 en cualquier petición protegida cierra la sesión.
- Al salir se borran el token, la caché y la cola de pendientes; si había pendientes, se avisa antes.

| Regla | Dónde | Mensaje |
|-------|-------|---------|
| Correo y contraseña obligatorios | `LoginScreen` | "Completa todos los campos" |
| Nombres, correo y contraseña obligatorios | `RegisterScreen` | "Nombres, correo y contraseña son obligatorios" |
| Contraseña de 8+ caracteres con una mayúscula y un número | API (`POST /auth/register`) | El mensaje del campo que devuelve la API |
| Correo único (sin distinguir mayúsculas) | API (`409 DUPLICATE_EMAIL`) | "El correo electrónico ya se encuentra registrado en la plataforma." |
| Los datos antropométricos son opcionales | `RegisterScreen` y API (rangos) | — |
| Cada rol solo ve y usa lo suyo | `AppNavigator` y `RolesGuard` | `403`: "No tienes permiso para realizar esta acción con tu rol." |

Contrato del endpoint: [`../../03-api-and-data/endpoints/endpoint-post-auth-login.md`](../../03-api-and-data/endpoints/endpoint-post-auth-login.md).
Reglas de token y roles: [`../../03-api-and-data/authentication.md`](../../03-api-and-data/authentication.md).

---

## Estados de borde

- [x] Error de validación — mensaje en rojo dentro de la tarjeta
- [x] Teclado — `KeyboardAvoidingView` en iOS y `keyboardShouldPersistTaps="handled"`
- [x] Credenciales incorrectas — "Credenciales incorrectas." del servidor
- [x] Cargando — botón con indicador; al arrancar, `PantallaEstado` mientras se restaura la sesión
- [x] Sesión expirada — cualquier 401 cierra la sesión y vuelve a `Login`
- [x] Sin conexión — "No pudimos conectar. Revisa tu conexión e intenta de nuevo."

---

## Decisiones

- [ADR-001](../decisions/records/ADR-001-state-management-pattern.md) — patrón de estado
- [ADR-004](../decisions/records/ADR-004-persistencia-local.md) — dónde vive el token
- [ADR-005](../decisions/records/ADR-005-cliente-http.md) — dónde se adjunta el token
- [ADR-011](../decisions/records/ADR-011-roles-y-alcance-completo.md) — roles

---

## Pruebas

| Nivel | Qué cubre | Dónde | Estado |
|-------|-----------|-------|--------|
| Unitaria | Login y registro: hash bcrypt, mismo error para correo inexistente, token con `rol` | `habits-tracker-api/src/auth/auth.service.spec.ts` | ✅ |
| e2e de API | Registro, login, `/usuarios/me`, 401 sin token o con token alterado | `test/auth.e2e-spec.ts`, `test/seguridad.e2e-spec.ts` | ✅ |
| e2e de API | Cada rol recibe `403 FORBIDDEN_ROLE` en las rutas del otro | `test/roles.e2e-spec.ts` | ✅ |
| Unitaria de estado | Arranque sin token, con token, almacén que falla; `cerrarSesion`; sesión de profesional sin cargar datos de paciente | `habits-tracker-app/src/context/AppContext.test.tsx` | ✅ |
| Postman | Login de los dos roles, 401 y 403 | `habits-tracker-api/postman/` (carpetas 1 y 2) | ✅ |
| Manual | [TC-005](../../04-quality/test-cases/TC-005-permisos-por-rol.md) | | ✅ |

---

## Deuda conocida

- No hay recuperación de contraseña ni verificación de correo.
- No existe pantalla de perfil para editar los datos antropométricos después del alta.
- No se limita el número de intentos de login (`429`).
- Las cuentas `profesional` no se pueden crear desde la app (decisión de ADR-011): las crea el centro.
