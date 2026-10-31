# Integración de endpoint — Progreso de un paciente

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-16 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [panel-profesional](../../01-architecture/features/feature-panel-profesional.md)
- **Método y ruta:** `GET /api/v1/reportes/progreso?usuarioId=&fechaInicio=&fechaFin=`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Profesional
- **Consumido por:** `obtenerProgreso` (`services/reportes.ts`, expuesto por el contexto); pantalla `ProgresoPacienteScreen`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `usuarioId` | query | `number` | Sí | El paciente elegido en la lista |
| `fechaInicio` | query | `string` | Sí | `YYYY-MM-DD`, inclusiva |
| `fechaFin` | query | `string` | Sí | `YYYY-MM-DD`, inclusiva |

---

## Respuesta

**Éxito:**

```json
{
  "paciente": { "id": 1, "nombres": "Carlos", "...": "..." },
  "fechaInicio": "2026-09-29", "fechaFin": "2026-10-28",
  "habitos": [ { "habitoId": 1, "nombre": "Beber agua", "diasEvaluados": 12, "diasCumplidos": 10, "porcentajeAdherencia": 83, "rachaMaxima": 4, "...": "..." } ],
  "totales": { "diasEvaluados": 27, "diasCumplidos": 21, "porcentajeAdherencia": 78 }
}
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Objeto completo | `ReporteProgreso` | La pantalla **solo muestra** los números: no recalcula nada |
| `porcentajeAdherencia` | Color de la barra | `colorDeCumplimiento()`: ≥ 80 verde, ≥ 50 naranja, menor rojo |

> El rango sale de `utils/rango.ts`: atajos "7 días", "30 días" (por defecto) y "Este mes", y flechas para mover "Desde" y "Hasta" sin pasar de hoy ni cruzarse.

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 422 | Fecha inicial posterior a la final | No puede pasar desde la interfaz (`moverExtremo` lo impide); se mostraría el `detail` |
| 404 | `PATIENT_NOT_FOUND` | Se muestra el `detail` con "Reintentar" |
| 400 | `VALIDATION_FAILED` | Se muestra el `detail` |
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | Mensaje "No pudimos conectar…" con "Reintentar" |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** Solo en línea, sin caché
- **Entidad cacheada:** Ninguna: el panel del profesional siempre muestra datos del servidor
- **Invalidación:** Se pide al abrir la pantalla, al deslizar para refrescar y al cambiar el rango
