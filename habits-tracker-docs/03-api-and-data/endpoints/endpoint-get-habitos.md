# Integración de endpoint — Listar hábitos

> **Estado: implementado (2026-10-28).** Ficha del contrato: [E-04 en api-contract.md](../api-contract.md#5-fichas-de-endpoint).
> Si esta ficha y el contrato no coinciden, gana el contrato.

- **Feature:** [habitos](../../01-architecture/features/feature-habitos.md)
- **Método y ruta:** `GET /api/v1/habitos?activos=false`
- **Requiere autenticación:** Sí — `Authorization: Bearer <JWT>` · **Rol:** Paciente
- **Consumido por:** `listarHabitos` (`services/habitos.ts`), llamado por `cargarDatos`

---

## Petición

| Campo | En | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| `activos` | query | `string` | No | La app envía `false` para recibir también los archivados: el historial necesita sus nombres |

---

## Respuesta

**Éxito:**

```json
[
  {
    "id": 1, "categoriaHabitoId": 1, "nombre": "Beber agua", "descripcion": "Ocho vasos al día",
    "unidadMedida": "vasos", "frecuencia": "diaria", "activo": true,
    "rachaActual": 3, "rachaMaxima": 4,
    "metaActiva": { "id": 1, "habitoId": 1, "valorObjetivo": 8, "descripcion": "8 vasos al día", "activa": true }
  }
]
```

**Mapeo DTO → dominio:**

| Campo del DTO | Campo del dominio | Transformación |
|---|---|---|
| `id`, `categoriaHabitoId`, `nombre`, `descripcion`, `unidadMedida`, `frecuencia`, `activo` | `Habito` | `aHabito()` copia solo estos 7 campos. `activo: false` = archivado (D-10); la pantalla Hábitos solo muestra los activos |
| `rachaActual`, `rachaMaxima` | No se guardan | La app recalcula la racha con `utils/racha.ts`, el mismo algoritmo, para responder al instante tras registrar |
| `metaActiva` | No se guarda | Las metas llegan aparte con `GET /metas` |

---

## Errores

| Estado | Significado | Comportamiento de la app |
|---|---|---|
| 401 | Token ausente, inválido o vencido | El manejador global de `apiFetch` cierra la sesión y la app vuelve a `Login` |
| 403 | `FORBIDDEN_ROLE`: el rol no tiene permiso | No debería ocurrir: la app solo monta las pantallas del rol. Se muestra el `detail` |
| Sin respuesta / 5xx | Sin red, servidor caído o tiempo agotado (10 s) | Se reintenta solo; luego se usa la caché |

Todos los errores llegan con la forma RFC 7807 ([api-contract.md §2](../api-contract.md#2-la-forma-del-error)); la app muestra el primer error de campo o, si no hay, el `detail`.

---

## Caché y offline

- **Estrategia:** Lectura con caché (solo en Android e iOS)
- **Entidad cacheada:** `hst:v1:habitos`
- **Invalidación:** Se vuelve a pedir al iniciar sesión, al arrancar con sesión guardada y al pulsar "Reintentar conexión". Si falla, se muestran los datos de la caché con la franja "Sin conexión".
