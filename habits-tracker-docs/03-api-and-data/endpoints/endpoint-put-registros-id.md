# Integración de endpoint — Editar registro

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-12c en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [registro-diario](../../01-architecture/features/feature-registro-diario.md)
- **Método y ruta:** `PUT /api/v1/registros/:id`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `editarRegistro` del contexto; botón ✎ (**Editar registro**) en `RegistrosScreen`, que abre `NuevoRegistroScreen` en modo edición (hábito y fecha fijos)

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `id` | path | `number` | Sí |  |
| `valorRegistrado` | body | `number` | No* | ≥ 0 |
| `notas` | body | `string \| null` | No* | Máx 500; vacía → `null` |

**Cuerpo:**

```json
{ "valorRegistrado": 5, "notas": null }
```

---

## Respuesta

**Éxito:**

```json
{ "id": 42, "habitoId": 1, "fecha": "2026-10-27", "valorRegistrado": 5, "metaCumplida": false, "notas": null }
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| Objeto completo | `RegistroDiario` | Reemplaza el registro. `metaCumplida` llega **recalculada por el servidor** si cambió el valor |

> \* Al menos uno. La app muestra "Registro actualizado." o "Registro actualizado. ¡Meta cumplida!" y cierra la ventana.

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Se muestra el mensaje en el formulario |
| 404 | `DAILY_LOG_NOT_FOUND` | Se muestra el `detail` |
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | No se reintenta y **no** se encola: la cola S-06 es solo para crear |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** En línea (la mutación exige red)
- **Entidad cacheada:** `hst:v1:registros`
- **Invalidación:** Tras el éxito se actualiza el estado en memoria y se reescribe la clave afectada; no se vuelve a pedir la lista completa. Rachas y gráfica se recalculan solas porque se derivan de `registros`.
