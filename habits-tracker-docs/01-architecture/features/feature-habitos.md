# Feature — Gestión de hábitos

- **Responsable:** Daniel Felipe Fernandez Rojas (antes: Javier Esteban Ortiz López)
- **Estado:** Entregada, contra el API (2026-10-25); **edición** añadida el 2026-10-28 (ADR-011). Eliminar un hábito con registros lo **archiva** (ADR-008, D-10)
- **Historias relacionadas:** HU-02 (M-03, M-04)

---

## Propósito

Permitir que la persona defina qué hábitos quiere seguir, clasificados en una categoría del
catálogo del centro (Hidratación, Ejercicio, Alimentación, Sueño, Meditación), y con una
unidad de medida propia (vasos, minutos, horas). Es la entidad raíz sobre la que cuelgan metas
y registros.

---

## Pantallas

| Pantalla | Ruta | Propósito |
|----------|------|-----------|
| `HabitosScreen` | `Habitos` (pestaña) | Listar hábitos activos; crear y **editar** en una ventana; eliminar con confirmación ([screen-habitos](../screens/screen-habitos.md)) |

Cada tarjeta de la lista muestra: nombre, icono y nombre de categoría, unidad de medida, meta
activa si la tiene, racha actual y número total de registros.

---

## Estado

- **Patrón:** React Context + `useState` ([ADR-001](../decisions/records/ADR-001-state-management-pattern.md))
- **Estado base:** `habitos: Habito[]`, `categorias: CategoriaHabito[]` (solo lectura)
- **Estado local:** visibilidad del modal, formulario (`nombre`, `descripcion`, `unidadMedida`),
  categoría seleccionada y mensaje de error
- **Transiciones clave:** `lista → modal abierto → validando → creado | error`

---

## Reglas de negocio

| Regla | Dónde se aplica | Mensaje al usuario |
|-------|-----------------|--------------------|
| Nombre, unidad de medida y categoría son obligatorios | `HabitosScreen` | "Completa nombre, unidad y categoria" |
| **Un hábito con registros no se borra: se archiva** (`activo: false`) para conservar el historial (D-10) | Servicio de hábitos de la API (`DELETE /habitos/:id`) | "El hábito tenía registros: se archivó y su historial se conserva." |
| Sin registros, se borra físicamente junto con sus metas | Servicio de hábitos de la API | "Hábito eliminado." |
| La categoría no se cambia al editar | Contrato E-07 (la API rechaza el campo) y la ventana la muestra fija | "Categoría: … (no se puede cambiar)" |
| Todo hábito nuevo nace con `frecuencia: 'diaria'` y `activo: true` | API (valores por defecto) | — |
| Las categorías son un catálogo maestro: el usuario no las crea | `AppContext` las expone solo lectura | — |

> La regla de eliminación replica la restricción de clave foránea del backend. Es una decisión
> de producto, no una limitación técnica: borrar un hábito con historial destruiría registros
> de salud de la persona.

---

## Datos

- **Acciones:** `crearHabito`, `editarHabito`, `eliminarHabito`
- **Consultas de apoyo:** `habitoPorId`, `categoriaPorId`, `metaActivaDe`, `rachaDe`, `habitosActivos`
- **Fuente:** API — `GET /habitos?activos=false`, `POST /habitos`, `PUT /habitos/:id`, `DELETE /habitos/:id`, `GET /categorias` (`src/services/habitos.ts`; fichas en `03-api-and-data/endpoints/`)
- **Persistencia local:** caché `hst:v1:habitos` y `hst:v1:categorias` ([entity-habitos](../../03-api-and-data/entities/entity-habitos.md), solo Android e iOS)

---

## Estados de borde

- [x] Vacío — `EmptyState` con acción "+ Crear habito"
- [x] Error de validación — mensaje dentro de la ventana
- [x] Eliminar con registros — el servidor lo archiva y la app lo explica ("se archivó y su historial se conserva")
- [x] Confirmación destructiva — `confirmar()` antes de eliminar
- [x] Cargando — `PantallaEstado` "Cargando tus datos…" de `AppNavigator` y botón Guardar con indicador
- [x] Sin conexión — lista desde la caché y franja "Sin conexión"; las mutaciones muestran "No pudimos conectar…"

---

## Decisiones

- [ADR-001](../decisions/records/ADR-001-state-management-pattern.md) — patrón de estado
- [ADR-007](../decisions/records/ADR-007-estructura-por-rol-tecnico.md) — por qué esta feature no vive en su propia carpeta
- [ADR-008](../decisions/records/ADR-008-reconciliacion-contrato-api.md) — contrato reconciliado (baja lógica D-10, idempotencia D-17, `metaCumplida` en el servidor D-18)
- [ADR-011](../decisions/records/ADR-011-roles-y-alcance-completo.md) — roles, edición completa, panel del profesional y S-06

---

## Pruebas

| Nivel | Qué cubre | Dónde | Estado |
|-------|-----------|-------|--------|
| e2e de API | Crear, ver, listar solo lo propio, editar solo lo enviado, categoría no editable, borrar sin registros, **archivar con registros**, reactivar, 403/404 | `habits-tracker-api/test/habitos.e2e-spec.ts` | ✅ |
| Unitaria de estado | `editarHabito` con error del servidor devuelve su mensaje y no cambia nada | `habits-tracker-app/src/context/AppContext.test.tsx` (bloque "Edición (C-04)") | ✅ |
| Postman | Crear, ver, editar, listar y eliminar | `habits-tracker-api/postman/` (carpetas 3 y 6) | ✅ |
| E2E en navegador | Editar hábito (categoría fija), crear y eliminar uno sin registros | Recorrido del paciente, 2026-10-28 | ✅ |
| Manual | [TC-003](../../04-quality/test-cases/TC-003-eliminar-habito-con-registros.md) | | ✅ |

---

## Deuda conocida

- La interfaz no ofrece **reactivar** un hábito archivado (la API sí lo permite con `PUT` y `activo: true`).
- La `frecuencia` está fijada a `'diaria'`; el modelo admite `'semanal'` pero ninguna pantalla
  la ofrece ni la lógica de rachas la contempla.
- No hay pantalla de administración de categorías (sería del perfil administrador del centro,
  según HU-02).
