# Integración de endpoint — Listar pacientes

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-15 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [panel-profesional](../../01-architecture/features/feature-panel-profesional.md)
- **Método y ruta:** `GET /api/v1/usuarios?rol=paciente`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Profesional
- **Consumido por:** `listarPacientes` (`services/reportes.ts`, expuesto por el contexto); pantalla `PacientesScreen`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `rol` | query | `string` | No | Solo admite `paciente` |

---

## Respuesta

**Éxito:**

```json
[
  { "id": 1, "nombres": "Carlos", "apellidos": "Gómez", "correo": "paciente@habitos.test", "edad": null, "peso": null, "estatura": null, "rol": "paciente" }
]
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Objeto completo | `Usuario` | Tarjeta con nombre, correo, edad, peso y estatura ("—" si son nulos) |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 403 | `FORBIDDEN_ROLE` | Solo si lo llamara un paciente; la app nunca le muestra esta pantalla |
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | Pantalla de error con "Reintentar" y "Cerrar sesión" |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** Solo en línea, sin caché
- **Entidad cacheada:** Ninguna: el panel del profesional siempre muestra datos del servidor
- **Invalidación:** Se pide al abrir la pantalla, al deslizar para refrescar y al cambiar el rango
