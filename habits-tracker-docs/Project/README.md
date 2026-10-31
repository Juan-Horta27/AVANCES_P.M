# Project — Historias de Usuario

> **¿Qué es esto?** La carpeta donde viven las historias de usuario, decisiones de producto y
> el alcance funcional y no funcional del **Sistema de Seguimiento de Hábitos Saludables**.
>
> **Equipo actual:** Juan José Horta Vanegas · Daniel Felipe Fernandez Rojas. HU-01 y HU-02 se
> conservan con su autoría original (incluido Javier Esteban Ortiz López, que se retiró del proyecto);
> ver [`../00-governance/README.md`](../00-governance/README.md#integrantes-y-cambios-en-el-equipo).

---

## Documentos de Historias de Usuario

| ID | Título | Estado | Documento |
|----|--------|--------|-----------|
| **HU-01** | Selección y Decisión del Stack Tecnológico | ✅ Aprobado / Consolidado | [HU-01.md](./HU-01.md) |
| **HU-02** | Discovery del Proyecto y Especificación del MVP | ✅ Aprobado / Consolidado | [HU-02.md](./HU-02.md) |

---

## Matriz de trazabilidad: requisitos de HU-02 frente al código

La columna **v1.0.0** es la primera entrega (2026-09-17, datos en memoria). La columna **Corte 3** es el
estado del 2026-10-28 en los repositorios `habits-tracker-app` (app), `habits-tracker-api` (API) e
`habits-tracker-infra` (infra), verificado con pruebas automáticas y recorridos por la interfaz.

| Requisito | Descripción | v1.0.0 | Corte 3 | Dónde está |
|-----------|-------------|--------|---------|------------|
| **M-01** | Autenticación y control de acceso (JWT, bcrypt, roles) | ⚠️ En memoria | ✅ | API `auth/` (JWT con rol, `RolesGuard`); app `LoginScreen`, `AppNavigator` |
| **M-02** | Perfil con datos antropométricos | ⚠️ En memoria | ✅ Se capturan en el alta (no hay pantalla para editarlos) | `RegisterScreen`; `POST /auth/register` |
| **M-03** | Catálogo de 5 categorías | ✅ | ✅ | Migración `catalogo_categorias`; `GET /categorias` |
| **M-04** | CRUD de hábitos | ⚠️ Sin editar | ✅ Crear, ver, **editar**, eliminar o archivar | `HabitosScreen`; E-04 a E-08 |
| **M-05** | Metas con una sola activa por hábito | ✅ | ✅ Crear, **editar**, activar/desactivar, **eliminar** | `MetasScreen`; E-09, E-10, E-10b, E-10c |
| **M-06** | Registro diario único por hábito y fecha | ✅ | ✅ Crear, **editar**, eliminar; unicidad e idempotencia en la base | `NuevoRegistroScreen`; E-11, E-12b, E-12c |
| **M-07** | Racha actual y máxima | ✅ | ✅ Mismo algoritmo en app y API | `utils/racha.ts`; `registros/racha.ts` |
| **M-08** | Dashboard con métricas y gráfica semanal | ✅ | ✅ | `DashboardScreen`, `WeekChart` |
| **M-09** | Reportes del profesional por rango de fechas | ❌ | ✅ | `PacientesScreen`, `ProgresoPacienteScreen`; E-15, E-16 (ADR-011) |
| **M-10** | Backend en Docker | ❌ | ✅ | `habits-tracker-infra/docker-compose.yml` |
| **M-11** | App multiplataforma (React Native + Expo) | ✅ | ✅ Probada en web; Android con Expo Go | `habits-tracker-app` |
| **M-12** | Pestaña de registros con filtro y eliminación | ✅ | ✅ Más edición y pendientes de subir | `RegistrosScreen` |
| **S-01** | Resumen semanal con adherencia | ✅ | ✅ | `WeekChart` |
| **S-02** | Historial mensual y semanal | ✅ | ✅ | `HistorialScreen` |
| **S-03** | Errores HTTP normalizados con filtro global | ❌ | ✅ RFC 7807 | API `common/errores/` |
| **S-04** | Validación con DTO que rechaza campos no permitidos | ❌ | ✅ | API `crear-validation-pipe.ts` |
| **S-05** | Persistencia local (ver datos sin red) | ❌ | ✅ En Android e iOS | app `storage/cache.ts` (ADR-004) |
| **S-06** | Registro diario sin conexión | ❌ | ✅ Cola que se sube sola | app `storage/pendientes.ts` ([offline-sync.md](../03-api-and-data/offline-sync.md)) |
| **C-04** | Edición de hábitos, metas y registros | ❌ | ✅ | ADR-011 |
| C-01, C-02, C-03, C-05 | PDF, recordatorios, gráficas interactivas, widget | ❌ | ❌ Fuera del alcance | HU-02 §4.3 |

> Las funcionalidades de la ficha (F-01 a F-11) que resumen esta matriz están en el
> [README](../README.md) del repositorio, y los casos de prueba que la respaldan, en
> [`04-quality/test-cases/`](../04-quality/test-cases/).
