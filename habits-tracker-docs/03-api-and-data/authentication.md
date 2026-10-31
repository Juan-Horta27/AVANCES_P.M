# Autenticación

> **Estado: implementada (2026-10-25).** JWT emitido por `POST /auth/login` y `POST /auth/register`,
> guardado en `expo-secure-store` (`src/storage/seguro.ts`), adjuntado solo en `apiFetch`, sesión
> restaurada al arrancar con `GET /usuarios/me` y guardia de navegación en `AppNavigator.tsx`.
> **Roles (2026-10-28, ADR-011):** el token lleva el rol (`paciente` o `profesional`); la API lo
> exige con `RolesGuard` y la app monta solo las pantallas de ese rol (sección "Roles").
> Pendiente: limitar intentos de login (respuesta 429 del endpoint) y certificate pinning.

---

## Modelo elegido

**JWT sin estado, sin refresh token.**

- El backend NestJS emite un JWT firmado con HMAC-SHA256 al validar las credenciales contra el
  hash bcrypt almacenado.
- El token tiene una expiración configurable en el `.env` del servidor.
- **No hay refresh token**, decisión alineada con el alcance del MVP: cuando el token expira, el
  usuario vuelve a iniciar sesión.

---

## Roles

Implementados el 2026-10-28 ([ADR-011](../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md)).

| Rol | Qué puede hacer | Rutas de la API |
| :--- | :--- | :--- |
| `paciente` | Gestionar sus propios hábitos, metas y registros; ver su dashboard e historial | `/habitos`, `/metas`, `/registros` |
| `profesional` | Ver la lista de pacientes y el progreso de cada uno por rango de fechas (solo lectura) | `GET /usuarios?rol=paciente`, `GET /reportes/progreso` |
| Ambos | Ver su perfil y el catálogo | `GET /usuarios/me`, `GET /categorias` |

**Cómo se aplica en la API (`habits-tracker-api`):**

1. Al iniciar sesión o registrarse, el token se firma con `{ sub: id, rol }`.
2. `JwtAuthGuard` (global) valida la firma y deja en la petición `{ id, rol }`.
3. `RolesGuard` (global, después del anterior) lee el decorador `@Roles(...)` del controlador; si el
   rol del token no está permitido responde `403 FORBIDDEN_ROLE`, *"No tienes permiso para realizar
   esta acción con tu rol."* Las rutas sin `@Roles` (perfil y categorías) quedan para ambos.
4. El `usuarioId` de las operaciones del paciente sigue saliendo del token (D-03): un paciente no
   puede ver los datos de otro aunque cambie un id en la URL.

**Cómo se aplica en la app (`habits-tracker-app`):** `AppNavigator.tsx` monta un grupo de rutas
distinto según `usuario.rol` (ver "Guardia de navegación"). Para el profesional, el contexto no
descarga ni guarda en caché hábitos ni registros, y no hay cola sin conexión.

**Quién recibe cada rol:** quien se registra desde la app es siempre `paciente`. Las cuentas
`profesional` las crea el centro; para desarrollo y la sustentación hay una de prueba en los datos
semilla (README de `habits-tracker-api`).

---

## Almacenamiento del token

- El JWT se guarda **exclusivamente** en `expo-secure-store` (Keychain en iOS, Keystore en
  Android), envuelto por un módulo en `src/storage/`.
- **Nunca en `AsyncStorage`**, que no está cifrado y es legible en un dispositivo con root o
  jailbreak.
- **Nunca en el estado de React** más allá de lo necesario para adjuntarlo, y nunca en un log.

Regla de gobernanza correspondiente:
[`../00-governance/security-rules.md`](../00-governance/security-rules.md).
Decisión: [ADR-004](../01-architecture/decisions/records/ADR-004-persistencia-local.md).

---

## Cómo se adjunta

- En **un solo lugar**: `apiFetch` en `src/services/api.ts`
  ([ADR-005](../01-architecture/decisions/records/ADR-005-cliente-http.md)).
- Ninguna pantalla, ningún componente y ninguna acción del contexto manipula la cabecera
  `Authorization`.
- Los endpoints públicos (`POST /auth/login`, `POST /auth/register`) se marcan como tales para
  que `apiFetch` no adjunte nada.

---

## Ciclo de vida de la sesión

```
Arranque
   │
   ├─ ¿Hay token en almacenamiento seguro?
   │     ├─ Sí → GET /usuarios/me → hidratar usuario → Tabs
   │     └─ No → Login
   │
Login exitoso → guardar token → cargar datos → Tabs
   │
401 en cualquier petición → limpiar todo → Login
   │
Cerrar sesión → limpiar todo → Login
```

### Al arrancar

Mientras se lee el almacenamiento seguro, la app muestra "Abriendo tu sesión…" (`estadoSesion =
'iniciando'`). Si el almacenamiento falla, va a `Login` en lugar de quedarse cargando.

### Ante un 401

**No se intenta renovar el token.** La app:
1. Borra el token del almacenamiento seguro.
2. Borra el caché de dominio de `AsyncStorage`.
3. Limpia el estado en memoria (`usuario`, `habitos`, `metas`, `registros`).
4. Cancela las peticiones en vuelo.
5. Navega a `Login` con `replace`.

### Al cerrar sesión

Los mismos pasos: `cerrarSesion()` borra el token, la caché y el estado en memoria, y el stack
raíz vuelve solo al login. Las peticiones en vuelo no se cancelan explícitamente: sus respuestas
se descartan porque ya no hay sesión.

---

## Guardia de navegación

Implementada en `AppNavigator.tsx` (2026-10-25; por rol desde el 2026-10-28): sin sesión, la ruta
`Tabs` no existe; abrir directamente `/Tabs/Habitos` en la web muestra `Login` (verificado el 2026-10-26).
Con sesión de profesional, tampoco existen `Tabs` ni `NuevoRegistro` (verificado en el navegador el 2026-10-28).

El stack raíz decide en **un solo lugar** qué grupo de rutas
monta, leyendo la sesión y el rol del contexto (forma simplificada):

```tsx
{estadoSesion === 'con-sesion' && usuario?.rol === 'profesional' ? (
  <>
    <Stack.Screen name="Pacientes" component={PacientesScreen} />
    <Stack.Screen name="ProgresoPaciente" component={ProgresoPacienteScreen} />
  </>
) : estadoSesion === 'con-sesion' ? (
  <>
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen name="NuevoRegistro" component={NuevoRegistroScreen} options={{ presentation: 'modal' }} />
  </>
) : (
  <>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Registro" component={RegisterScreen} />
  </>
)}
```

Con esa estructura, el `replace` manual tras iniciar o cerrar sesión deja de hacer falta: el
árbol de navegación reacciona solo al estado.

---

## Reglas

- Nunca se registran tokens ni credenciales en ningún log.
- La app **no contiene secretos de larga vida**: solo custodia el token del usuario.
- La contraseña nunca se almacena en el dispositivo, ni siquiera temporalmente.
- El desbloqueo biométrico, si algún día se añade, es una **puerta** al token guardado, no un
  sustituto de la autenticación.
- El campo `contrasena` del modelo `Usuario` del backend **no viaja al cliente** en ninguna
  respuesta. `src/types/index.ts` no lo declara, y así debe seguir.

---

## Contrato del endpoint

Ver [endpoints/endpoint-post-auth-login.md](./endpoints/endpoint-post-auth-login.md).
