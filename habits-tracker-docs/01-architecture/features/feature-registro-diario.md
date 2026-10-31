# Feature — Registro diario y rachas

- **Responsable:** Juan José Horta Vanegas
- **Estado:** Entregada, contra el API (2026-10-25). `metaCumplida` la decide el servidor. **Edición** y **registro sin conexión (S-06)** añadidos el 2026-10-28 (ADR-011)
- **Historias relacionadas:** HU-02 (M-06, M-07)

---

## Propósito

Permitir que la persona registre **cuánto cumplió** de un hábito en una fecha concreta, sepa
al instante si alcanzó su meta, y vea crecer su **racha** de días consecutivos. Es el corazón
del producto: sin registro diario no hay rachas, ni dashboard, ni historial, ni reportes.

---

## Pantallas

| Pantalla | Ruta | Propósito |
|----------|------|-----------|
| `NuevoRegistroScreen` | `NuevoRegistro` (modal del stack raíz) | Crear un registro (hábito, fecha, valor y notas) o **editar** valor y notas de uno existente |
| `RegistrosScreen` | `Registros` (pestaña) | Listar y filtrar registros y **pendientes de subir**; editar y eliminar |

Especificación detallada: [`../screens/screen-nuevo-registro.md`](../screens/screen-nuevo-registro.md).

---

## Estado

- **Patrón:** React Context + `useState` ([ADR-001](../decisions/records/ADR-001-state-management-pattern.md))
- **Estado base:** `registros: RegistroDiario[]` en `AppContext`
- **Estado derivado:** `registrosDeHoy`, `actividadSemanal`, `rachas` — calculados con `useMemo`, nunca almacenados
- **Estado local de pantalla:** hábito seleccionado, fecha en edición, valor, notas, mensaje de error y de éxito
- **Transiciones clave:** `formulario vacío → validando → guardado (ok) | error de negocio`

---

## Reglas de negocio

| Regla | Dónde se aplica | Mensaje al usuario |
|-------|-----------------|--------------------|
| Un único registro por hábito y fecha | API: `@@unique([habitoId, fecha])` → `409 DUPLICATE_DAILY_LOG` | "Ya existe un registro para este hábito en la fecha indicada." |
| `metaCumplida = valorRegistrado >= meta.valorObjetivo` | API al crear y al **editar el valor** (D-18) | "Registro guardado. ¡Meta cumplida!" / "Registro guardado. Sigue esforzándote." / "Registro actualizado." |
| Sin meta activa, `metaCumplida` es `false` | API | La pantalla avisa de que el hábito no tiene meta activa |
| Sin red, el registro nuevo queda pendiente y se reenvía con el mismo `clienteId` | `AppContext` (cola S-06) | "Sin conexión: el registro quedó pendiente y se subirá solo al recuperar la conexión." |
| El valor debe ser numérico y no negativo | `NuevoRegistroScreen` | "Ingresa un valor valido" |
| No se puede registrar en una fecha futura | `NuevoRegistroScreen` (el botón de avanzar día se bloquea en `hoyISO()`) y la API (`422`, zona `America/Bogota`) | El control simplemente no avanza |

> Estas reglas son **las mismas** que impondrá el backend. La de unicidad corresponde a
> `@@unique([habitoId, fecha])` en Prisma. Cuando el API exista, el cliente las mantiene para
> dar respuesta inmediata, y el servidor sigue siendo la autoridad.

---

## Cálculo de rachas

Implementado en `src/utils/racha.ts` como función pura: `calcularRacha(habitoId, registros)`.

- **`rachaActual`:** días consecutivos cumplidos que llegan hasta hoy **o hasta ayer**. La
  tolerancia de un día es deliberada: no castiga a quien todavía no ha registrado el día en curso.
- **`rachaMaxima`:** el tramo consecutivo más largo de toda la historia del hábito.
- Solo cuentan los registros con `metaCumplida === true`.
- Cuando un tramo se corta, la racha actual queda congelada: los tramos anteriores solo pueden
  mejorar la máxima, nunca la actual.

Casos borde que la prueba debe cubrir: sin registros, un único registro de hoy, un único
registro de hace 3 días, tramo cortado, tramo antiguo más largo que el actual, cambio de mes
y cambio de año dentro del tramo.

---

## Datos

- **Acciones:** `crearRegistro` (con cola sin conexión), `editarRegistro`, `eliminarRegistro`, `reintentarConexion`
- **Consultas de apoyo:** `habitoPorId`, `metaActivaDe`, `rachaDe`, `registrosDeHoy`, `pendientes`
- **Fuente:** API — `GET /registros` (todas las páginas), `POST /registros` con `clienteId`, `PUT /registros/:id`, `DELETE /registros/:id` (`src/services/registros.ts`)
- **Persistencia local:** caché `hst:v1:registros` ([entity-registros](../../03-api-and-data/entities/entity-registros.md)) y cola `hst:v1:pendientes` ([entity-pendientes](../../03-api-and-data/entities/entity-pendientes.md)); política en [offline-sync.md](../../03-api-and-data/offline-sync.md)

---

## Estados de borde

- [x] Vacío — `EmptyState` con acción para registrar
- [x] Error de negocio — duplicado (`409`), fecha futura (`422`), valor inválido, hábito no seleccionado
- [x] Éxito — mensaje y cierre automático del modal a los 900 ms (el temporizador se cancela al desmontar)
- [x] Cargando — botón "Guardar registro" con indicador
- [x] Sin conexión — **el registro queda pendiente** (⏳) y se sube solo; conflicto al subir: gana el servidor
- [ ] Permiso denegado — no aplica (la app no pide permisos nativos)

---

## Decisiones

- [ADR-001](../decisions/records/ADR-001-state-management-pattern.md) — patrón de estado
- [ADR-003](../decisions/records/ADR-003-fechas-como-texto-iso.md) — fechas como texto `YYYY-MM-DD`
- [ADR-004](../decisions/records/ADR-004-persistencia-local.md) — caché local (S-05)
- [ADR-008](../decisions/records/ADR-008-reconciliacion-contrato-api.md) — contrato reconciliado (baja lógica D-10, idempotencia D-17, `metaCumplida` en el servidor D-18)
- [ADR-011](../decisions/records/ADR-011-roles-y-alcance-completo.md) — roles, edición completa, panel del profesional y S-06

---

## Pruebas

| Nivel | Qué cubre | Dónde | Estado |
|-------|-----------|-------|--------|
| Unitaria | `calcularRacha()` con sus casos borde | `habits-tracker-app/src/utils/racha.test.ts` y `habits-tracker-api/src/registros/racha.spec.ts` | ✅ |
| Unitaria | `sumarDias`, `diferenciaDias`, `inicioDeSemana` en cambios de mes y año | `src/utils/date.test.ts` | ✅ |
| Unitaria | Cola: leer, guardar, descartar si es de otra cuenta o está corrupta | `src/storage/pendientes.test.ts` | ✅ |
| Unitaria de estado | Encolar sin red, no encolar errores de negocio, no duplicar, reenviar con el mismo `clienteId`, 409 → descartar y avisar, borrar al salir; `editarRegistro` usa la decisión del servidor sobre la meta | `src/context/AppContext.test.tsx` | ✅ |
| e2e de API | Duplicado 409, idempotencia por `clienteId`, fecha futura 422, `metaCumplida` del servidor; editar recalcula `metaCumplida` y la racha | `test/registros.e2e-spec.ts`, `test/edicion.e2e-spec.ts` | ✅ |
| E2E en navegador | Editar un registro (⭕ al bajar de la meta); sin red → pendiente → sube solo; conflicto 409; aviso al salir con pendientes | Recorrido del paciente, 2026-10-28 | ✅ |
| Manual | [TC-001](../../04-quality/test-cases/TC-001-registro-duplicado.md), [TC-002](../../04-quality/test-cases/TC-002-calculo-de-racha.md), [TC-006](../../04-quality/test-cases/TC-006-registro-sin-conexion.md), [TC-007](../../04-quality/test-cases/TC-007-editar-registro.md) | | ✅ |

---

## Deuda conocida

- Editar un registro no permite cambiar el hábito ni la fecha (hay que eliminarlo y crear otro).
- Editar y eliminar exigen red: la cola S-06 solo cubre la creación.
- Los mensajes de éxito y error están escritos dentro del código
  (ver [`../../02-code-and-ui/i18n.md`](../../02-code-and-ui/i18n.md)).
