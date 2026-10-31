# Integración de endpoint — Iniciar sesión

> **Estado: implementado (2026-10-25).** `iniciarSesion()` llama a este endpoint. Pendiente: la
> respuesta `429` por exceso de intentos no está implementada en el backend.
> **2026-10-28 (ADR-011):** la respuesta incluye `usuario.rol`, y el token lleva el mismo rol.

- **Feature:** [autenticación y sesión](../../01-architecture/features/feature-autenticacion.md)
- **Método y ruta:** `POST /auth/login`
- **Requiere autenticación:** No — **es un endpoint público**, `apiFetch` no adjunta token
- **Consumido por:** `iniciarSesion` en `AppContext`, a través de `services/auth.ts`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|-------|----|------|-------------|-------|
| `correo` | body | `string` | Sí | Se envía recortado y en minúsculas |
| `contrasena` | body | `string` | Sí | **Se envía tal cual; el hash lo hace el servidor** |

```json
{
  "correo": "juan@correo.com",
  "contrasena": "unaContrasenaSegura"
}
```

> El cliente **no hashea** la contraseña. El hash con bcrypt es responsabilidad del servidor;
> hashear en el cliente convertiría el hash en la credencial efectiva y no aportaría seguridad.
> Lo que sí es obligatorio es que este endpoint viaje sobre **TLS**.

---

## Respuesta

**Éxito (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombres": "Carlos",
    "apellidos": "Gómez",
    "correo": "paciente@habitos.test",
    "edad": null,
    "peso": null,
    "estatura": null,
    "rol": "paciente"
  }
}
```

**Mapeo DTO → dominio:**

| Campo del DTO | Destino | Transformación |
|---------------|---------|----------------|
| `token` | `expo-secure-store`, bajo `hst.token` (SecureStore solo admite letras, números, `.`, `-` y `_` en la clave) | **No entra en el estado de React ni en `AsyncStorage`** |
| `usuario` | `AppState.usuario` (tipo `Usuario`) | Directo |
| `usuario.rol` | `Usuario.rol` | Decide qué grupo de rutas monta `AppNavigator` (paciente: pestañas; profesional: Pacientes) |
| `usuario.edad`, `peso`, `estatura` | Solo en memoria | **No se persisten en `AsyncStorage`**: son datos de salud y el almacén no está cifrado |

> La respuesta **no incluye `contrasena`** en ninguna forma, ni siquiera el hash. `Usuario` en
> `src/types/index.ts` no declara ese campo, y así debe seguir.

---

## Errores

| Estado | Significado | Comportamiento de la app |
|--------|-------------|--------------------------|
| 400 | Falta un campo o el correo está mal formado | Mensaje de validación en el formulario |
| **401** | **Credenciales incorrectas** | "Credenciales incorrectas" — mensaje **genérico a propósito**: no revelar si el correo existe |
| 429 | Demasiados intentos | "Demasiados intentos. Intenta de nuevo en unos minutos" |
| 5xx o timeout | Transitorio | "No pudimos conectar. Revisa tu conexion e intenta de nuevo", con acción de reintentar |

> **No se distingue "correo no registrado" de "contraseña incorrecta".** Hacerlo permitiría
> enumerar qué correos tienen cuenta en el centro de bienestar, lo que en un producto de salud es
> una filtración de información personal.

---

## Después de un login exitoso

1. Guardar el token en `expo-secure-store`.
2. Poner `usuario` en el estado global.
3. Cargar los datos iniciales: categorías, hábitos, metas y registros.
4. Escribir el caché de dominio en `AsyncStorage`.
5. El árbol de navegación monta el grupo autenticado (ver [`../authentication.md`](../authentication.md)).

---

## Caché y offline

- **Estrategia:** solo en línea. No se puede validar una credencial sin servidor.
- **Sin conexión:** si ya hay un token válido persistido, la app arranca directamente con la
  sesión y no llama a este endpoint. Sin token y sin conexión, la app no puede entrar y debe
  decirlo con claridad.
- **TTL:** el token expira según la configuración del servidor. Al expirar, el siguiente 401
  cierra la sesión — **no hay renovación** (ver [`../api-networking.md`](../api-networking.md)).
