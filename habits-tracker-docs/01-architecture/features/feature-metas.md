# Feature — Metas por hábito

- **Responsable:** Daniel Felipe Fernandez Rojas (antes: Javier Esteban Ortiz López)
- **Estado:** Entregada, contra el API (2026-10-25); **editar y eliminar** añadidos el 2026-10-28 (ADR-011)
- **Historias relacionadas:** HU-02 (M-05)

---

## Propósito

Permitir fijar un objetivo cuantitativo por hábito ("8 vasos de agua al día", "30 minutos de
caminata"). La meta es lo que convierte un número registrado en un juicio: **cumplida o no
cumplida**. Sin meta activa, un registro es un dato suelto y no alimenta la racha.

---

## Pantallas

| Pantalla | Ruta | Propósito |
|----------|------|-----------|
| `MetasScreen` | `Metas` (pestaña) | Listar metas; crear, **editar**, activar/desactivar y **eliminar** ([screen-metas](../screens/screen-metas.md)) |

La cabecera muestra cuántas metas están activas sobre el total. Cada tarjeta muestra el hábito
al que pertenece, la descripción, el valor objetivo con su unidad y un `Badge` de estado.

---

## Estado

- **Patrón:** React Context + `useState` ([ADR-001](../decisions/records/ADR-001-state-management-pattern.md))
- **Estado base:** `metas: Meta[]`
- **Estado local:** visibilidad del modal, hábito seleccionado, valor objetivo, descripción y error
- **Transiciones clave:** `lista → modal → validando → creada | error de negocio`, y
  `activa ⇄ inactiva` mediante `alternarMeta`

---

## Reglas de negocio

| Regla | Dónde se aplica | Mensaje al usuario |
|-------|-----------------|--------------------|
| **Un hábito solo puede tener una meta activa a la vez** | Servicio de metas de la API (`POST /metas`, `409`) | "Este hábito ya tiene una meta activa. Desactívala antes de crear otra." |
| Al **reactivar** una meta, se valida que no haya otra activa del mismo hábito | Servicio de metas de la API (`PATCH /metas/:id`, `409`) | "Ya hay otra meta activa para este hábito. Desactívala primero." |
| Hábito, descripción y valor objetivo son obligatorios | `MetasScreen` | "Completa todos los campos" |
| El valor objetivo debe ser un número mayor que cero | `MetasScreen` y la API (`422`) | "El valor objetivo debe ser un número mayor a 0" |
| Toda meta nueva nace activa | API | — |
| Desactivar, **editar** o **eliminar** una meta no cambia los registros ya evaluados | Por diseño (D-02): `metaCumplida` está congelado en cada registro | "Los registros ya evaluados conservan su resultado." |

> La invariante de "una sola meta activa" es la más sutil del dominio y está validada en **dos
> caminos distintos**: al crear y al reactivar. Olvidar el segundo es el error clásico, y por eso
> tiene su propio caso de prueba.

**Por qué el histórico de metas se conserva:** el modelo permite varias metas por hábito
(`Habito 1:N Meta`) precisamente para guardar la evolución del objetivo. Si alguien sube su
meta de 6 a 8 vasos, los registros antiguos siguen habiéndose evaluado contra la meta que
estaba activa entonces. `metaCumplida` se congela en el registro, no se recalcula.

---

## Datos

- **Acciones:** `crearMeta`, `editarMeta`, `alternarMeta`, `eliminarMeta`
- **Consultas de apoyo:** `metaActivaDe`, `habitoPorId`
- **Fuente:** API — `GET /metas`, `POST /metas`, `PATCH /metas/:id`, `DELETE /metas/:id` (`src/services/metas.ts`)
- **Persistencia local:** caché `hst:v1:metas` ([entity-metas](../../03-api-and-data/entities/entity-metas.md), solo Android e iOS)

---

## Estados de borde

- [x] Vacío — `EmptyState` con acción "+ Crear meta"
- [x] Error de validación — mensaje dentro de la ventana
- [x] Error de negocio — aviso "Acción no permitida" con el `detail` del `409 ACTIVE_GOAL_EXISTS`
- [x] Confirmación destructiva — "¿Eliminar esta meta? Los registros ya evaluados conservan su resultado."
- [x] Cargando — botón Guardar con indicador
- [x] Sin conexión — lista desde la caché; las acciones muestran "No pudimos conectar…"

---

## Decisiones

- [ADR-001](../decisions/records/ADR-001-state-management-pattern.md) — patrón de estado
- [ADR-008](../decisions/records/ADR-008-reconciliacion-contrato-api.md) — contrato reconciliado (baja lógica D-10, idempotencia D-17, `metaCumplida` en el servidor D-18)
- [ADR-011](../decisions/records/ADR-011-roles-y-alcance-completo.md) — roles, edición completa, panel del profesional y S-06

---

## Pruebas

| Nivel | Qué cubre | Dónde | Estado |
|-------|-----------|-------|--------|
| e2e de API | Meta activa única al crear y al **reactivar**, desactivar siempre, 422 con valor 0, 404 ajena | `habits-tracker-api/test/metas.e2e-spec.ts` | ✅ |
| e2e de API | Editar valor y descripción, no reescribir registros ya evaluados, descripción vacía, 400 sin campos, eliminar 204 y conservar registros | `habits-tracker-api/test/edicion.e2e-spec.ts` | ✅ |
| Unitaria de estado | `eliminarMeta` quita la meta de la lista | `AppContext.test.tsx` (bloque "Edición (C-04)") | ✅ |
| E2E en navegador | Crear, editar (valor y descripción) y eliminar con confirmación | Recorrido del paciente, 2026-10-28 | ✅ |
| Manual | [TC-004](../../04-quality/test-cases/TC-004-meta-activa-unica.md) | | ✅ |

---

## Deuda conocida

- La unidad de medida que se muestra junto al valor objetivo se lee del hábito; si el hábito
  cambiara de unidad, las metas históricas quedarían mal etiquetadas.
- La regla "una sola meta activa" la garantiza solo el servicio de la API, no un índice de la
  base (data-model.md §13).
