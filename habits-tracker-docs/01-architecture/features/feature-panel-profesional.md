# Feature — Panel del profesional de bienestar

- **Responsables:** API (`usuarios`, `reportes`, `RolesGuard`): Daniel Felipe Fernandez Rojas · App (pantallas y navegación por rol): Juan José Horta Vanegas
- **Estado:** Entregada (2026-10-28, [ADR-011](../decisions/records/ADR-011-roles-y-alcance-completo.md))
- **Historias relacionadas:** HU-02, Flujo 5 y **M-09** ("reportes de progreso por rango de fechas")

---

## Propósito

Que el profesional de bienestar del centro pueda ver la lista de pacientes y, para cada uno,
su adherencia a cada hábito en un rango de fechas: días registrados, días con la meta cumplida,
porcentaje y racha máxima. Es una vista **de solo lectura**: el profesional no crea ni cambia
datos del paciente.

---

## Pantallas

| Pantalla | Ruta | Propósito |
|----------|------|-----------|
| `PacientesScreen` | `Pacientes` (inicio del rol `profesional`) | Lista de pacientes ([screen-pacientes](../screens/screen-pacientes.md)) |
| `ProgresoPacienteScreen` | `ProgresoPaciente` `{ usuarioId, nombre }` | Reporte por rango de fechas ([screen-progreso-paciente](../screens/screen-progreso-paciente.md)) |

Se decidió una **pestaña/grupo de rutas en la misma app** y no una app aparte (ADR-011): el login
es el mismo y `AppNavigator` monta un grupo u otro según `usuario.rol`.

---

## Estado

- **Patrón:** React Context ([ADR-001](../decisions/records/ADR-001-state-management-pattern.md)). El contexto expone
  `listarPacientes` y `obtenerProgreso`; las pantallas guardan el resultado en su estado local
  (`useState`), porque es información que no se comparte con otras pantallas.
- **Para el profesional, el contexto no descarga hábitos, metas ni registros**, no usa caché y no
  tiene cola sin conexión.
- **Transiciones clave:** `cargando → lista | vacío | error`; en el progreso, cada cambio de rango
  vuelve a `cargando`.

---

## Reglas de negocio

| Regla | Dónde se aplica | Mensaje al usuario |
|-------|-----------------|--------------------|
| Solo el rol `profesional` lista pacientes y ve reportes | `RolesGuard` + `@Roles('profesional')` en la API; `AppNavigator` en la app | `403 FORBIDDEN_ROLE` |
| El profesional no usa las rutas del paciente | `@Roles('paciente')` en hábitos, metas y registros | `403 FORBIDDEN_ROLE` |
| Solo se reporta sobre usuarios con rol `paciente` | `ReportesService` | `404 PATIENT_NOT_FOUND` |
| La fecha inicial no puede ser posterior a la final | `ReportesService` (`422`) y `moverExtremo` en la app (no deja cruzarlas) | "La fecha inicial no puede ser posterior a la fecha final." |
| El rango no pasa de hoy | `utils/rango.ts` | El control no avanza |
| Adherencia = `round(diasCumplidos / diasEvaluados × 100)`; `0` sin registros | `ReportesService` | — |
| Racha máxima = tramo más largo de días consecutivos cumplidos dentro del rango | `calcularRacha` (el mismo algoritmo de la racha del paciente) | — |
| Los hábitos archivados solo salen si tienen registros en el rango | `ReportesService` | `Badge` "Archivado" |
| Los totales se calculan sobre la suma de días, no como promedio de porcentajes | `ReportesService` | — |

---

## Datos

- **Acciones / consultas:** `listarPacientes()`, `obtenerProgreso(usuarioId, fechaInicio, fechaFin)` (expuestas por `AppContext`, implementadas en `src/services/reportes.ts`)
- **Fuente:** API — `GET /usuarios?rol=paciente` (E-15) y `GET /reportes/progreso` (E-16); fichas en `03-api-and-data/endpoints/`
- **Persistencia local:** ninguna

---

## Estados de borde

- [x] Vacío — "Sin pacientes" / "Sin registros en este rango"
- [x] Cargando — `PantallaEstado` en la lista; `ActivityIndicator` en el progreso
- [x] Error — mensaje con "Reintentar" (y "Cerrar sesión" en la lista)
- [x] Sin conexión — igual que error: el panel no muestra datos viejos
- [x] Rol equivocado — no se puede llegar desde la interfaz; la API responde `403`
- [x] Paciente inexistente o que no es paciente — `404 PATIENT_NOT_FOUND`

---

## Decisiones

- [ADR-011](../decisions/records/ADR-011-roles-y-alcance-completo.md) — roles, panel en la misma app, cálculo en el servidor
- [ADR-003](../decisions/records/ADR-003-fechas-como-texto-iso.md) — fechas como texto, ambos extremos inclusivos

---

## Pruebas

| Nivel | Qué cubre | Dónde | Estado |
|-------|-----------|-------|--------|
| Unitaria | Porcentaje y racha máxima del rango, 0 % sin registros (no `NaN`), archivados solo con actividad, 422 | `habits-tracker-api/src/reportes/reportes.service.spec.ts` | ✅ |
| e2e de API | Lista solo pacientes y sin contraseña, `rol` inválido (400), 401 y 403; reporte por hábito, solo dentro del rango, 404 si no es paciente, 422 y 400 | `test/reportes.e2e-spec.ts`, `test/roles.e2e-spec.ts` | ✅ |
| Unitaria | Atajos de rango y `moverExtremo` (no cruzar, no pasar de hoy) | `habits-tracker-app/src/utils/rango.test.ts` | ✅ |
| Unitaria de estado | Sesión de profesional sin cargar ni guardar datos de paciente | `AppContext.test.tsx` (bloque "Sesión según el rol") | ✅ |
| Postman | Listar pacientes y progreso de 30 días | `postman/` (carpeta 5) | ✅ |
| E2E en navegador | Login del profesional → Pacientes → Progreso; 30 → 7 días; flecha "Desde"; salir | Recorrido del profesional, 2026-10-28 (7/7) | ✅ |
| Manual | [TC-008](../../04-quality/test-cases/TC-008-reporte-de-progreso.md) | | ✅ |

---

## Deuda conocida

- No hay buscador de pacientes: la lista es alfabética y completa (suficiente para un centro pequeño).
- No hay relación profesional ↔ paciente: todo profesional ve a todos los pacientes del centro.
- No hay exportación del reporte (C-01, fase posterior).
- Las cuentas `profesional` se crean fuera de la app (en desarrollo, con los datos semilla).
