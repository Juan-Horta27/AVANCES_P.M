# Integración de endpoint — Crear cuenta

> **Estado: implementado (2026-10-25; rol `paciente` desde el 2026-10-28).** Ficha del contrato:
> [E-02 en api-contract.md](../api-contract.md#5-fichas-de-endpoint). Si esta ficha y el contrato no
> coinciden, gana el contrato.

- **Feature:** [autenticación y sesión](../../01-architecture/features/feature-autenticacion.md)
- **Método y ruta:** `POST /api/v1/auth/register`
- **Requiere autenticación:** No — **endpoint público**; `apiFetch` no adjunta token y un 401 aquí no cierra ninguna sesión
- **Consumido por:** `crearCuenta` del contexto → `services/auth.ts`; pantalla `RegisterScreen`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `nombres` | body | `string` | Sí | 2 a 100 caracteres, se recortan espacios |
| `apellidos` | body | `string` | No | 2 a 100 caracteres si se envía (D-13) |
| `correo` | body | `string` | Sí | Email válido, máx 150; se guarda en minúsculas |
| `contrasena` | body | `string` | Sí | 8 a 72 caracteres, con al menos una mayúscula y un número |
| `edad` | body | `integer` | No | 12 a 120 |
| `peso` | body | `number` | No | 20 a 350 kg, máximo 2 decimales |
| `estatura` | body | `number` | No | 0,80 a 2,50 m, máximo 2 decimales |

```json
{ "nombres": "Ana", "correo": "ana@correo.com", "contrasena": "Segura123", "edad": 30 }
```

> **No se acepta `rol`:** cualquier campo no declarado responde `400` (`"Este campo no está
> permitido."`). Toda cuenta creada aquí es `paciente` (ADR-011).

---

## Respuesta

**Éxito (`201 Created`):**

```json
{
  "token": "<JWT con { sub, rol }>",
  "usuario": { "id": 7, "nombres": "Ana", "apellidos": null, "correo": "ana@correo.com",
               "edad": 30, "peso": null, "estatura": null, "rol": "paciente" }
}
```

**Mapeo DTO → dominio:**

| Campo del DTO | Destino | Transformación |
|---|---|---|
| `token` | `expo-secure-store` (`hst.token`); en la web, solo memoria | No entra en el estado de React ni en `AsyncStorage` |
| `usuario` | `AppState.usuario` | Directo; `rol` decide las rutas de `AppNavigator` |
| `usuario.edad`, `peso`, `estatura` | Solo en memoria | La caché guarda el perfil sin ellos (`aPerfilBasico`) |

> La sesión empieza de inmediato (ADR-008, D-14): no se vuelve a la pantalla de login.

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 400 | `VALIDATION_FAILED`: campo faltante, formato o rango inválido, contraseña débil o campo no permitido; `detail` *"Datos de registro incompletos o inválidos."* | Muestra el **primer error de campo** (p. ej. "La contraseña debe incluir al menos una mayúscula.") sobre el formulario |
| 409 | `DUPLICATE_EMAIL` (sin distinguir mayúsculas) | Muestra *"El correo electrónico ya se encuentra registrado en la plataforma."* |
| Sin respuesta / 5xx | Sin red o servidor caído | "No pudimos conectar. Revisa tu conexión e intenta de nuevo."; no se reintenta (es una escritura) |

---

## Caché y offline

- **Estrategia:** solo en línea: crear una cuenta exige red.
- **Entidad cacheada:** tras el éxito, el perfil básico en [`hst:v1:usuario`](../entities/entity-usuario.md) (Android e iOS).
- **Invalidación:** se reemplaza en cada arranque con `GET /usuarios/me`.
