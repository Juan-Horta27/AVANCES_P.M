# Integración de endpoint — Perfil del usuario de la sesión

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-14 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [autenticacion](../../01-architecture/features/feature-autenticacion.md)
- **Método y ruta:** `GET /api/v1/usuarios/me`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Ambos roles
- **Consumido por:** `obtenerPerfil` (`services/auth.ts`), al arrancar la app con un token guardado

---

## Petición

Sin parámetros.

---

## Respuesta

**Éxito:**

```json
{ "id": 1, "nombres": "Carlos", "apellidos": "Gómez", "correo": "paciente@habitos.test", "edad": null, "peso": null, "estatura": null, "rol": "paciente" }
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Objeto completo | `Usuario` | Restaura la sesión. `rol` decide qué rutas monta `AppNavigator` |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 401 | Token vencido o cuenta inexistente | Se borra el token y se muestra `Login` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | Paciente: se entra con los datos de la caché y la franja "Sin conexión". Sin caché: pantalla de error con "Reintentar" |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** Lectura con caché del perfil (solo Android e iOS)
- **Entidad cacheada:** `hst:v1:usuario` (sin edad, peso ni estatura)
- **Invalidación:** Se reemplaza en cada arranque con red
