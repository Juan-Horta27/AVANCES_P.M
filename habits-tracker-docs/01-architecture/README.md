# 01 — Arquitectura

> **¿Qué es esto?** Cómo está organizada la app: estructura de carpetas, capas, gestión de
> estado, navegación y el registro de decisiones arquitectónicas.

## Por qué existe esta sección

La arquitectura es el conjunto de restricciones que mantiene el código consistente a medida
que crece y que la gente rota. Se decide una vez, se escribe, y se hace cumplir en la revisión.

---

## Documentos de esta sección

| Archivo | Propósito |
|---------|-----------|
| [project-structure.md](./project-structure.md) | Estructura real de carpetas y reglas de módulo |
| [layers-and-state.md](./layers-and-state.md) | Capas presentación/dominio/datos + patrón de estado |
| [navigation.md](./navigation.md) | Modelo de rutas y reglas de navegación |
| [_template-feature.md](./_template-feature.md) | Plantilla para documentar una feature (no editar) |
| [_template-screen.md](./_template-screen.md) | Plantilla para especificar una pantalla (no editar) |
| [features/](./features/) | Features documentadas |
| [screens/](./screens/) | Pantallas especificadas |
| [decisions/](./decisions/) | Architecture Decision Records (ADRs) |

---

## Resumen de la arquitectura

| Aspecto | Decisión | Detalle |
|---------|----------|---------|
| Plataforma | React Native 0.86 + Expo SDK 57 | Una base de código para Android, iOS y web |
| Lenguaje | TypeScript 6 en modo `strict` | Sin `any` implícitos |
| Organización | Por rol técnico, no por feature | Ver [project-structure.md](./project-structure.md) |
| Estado global | React Context + `useState` | Un solo proveedor, estado inmutable |
| Navegación | React Navigation 7: stack + tabs | Rutas tipadas en `src/types/` |
| Datos | API NestJS (repositorio `habits-tracker-api`) vía `src/services/`; caché local y cola sin conexión en `src/storage/` | ADR-005, ADR-004, ADR-010, ADR-011 |

---

## Features documentadas

| Feature | Estado | Documento |
|---------|--------|-----------|
| Autenticación y sesión | Entregada (JWT contra el API) | [feature-autenticacion.md](./features/feature-autenticacion.md) |
| Gestión de hábitos | Entregada | [feature-habitos.md](./features/feature-habitos.md) |
| Metas por hábito | Entregada | [feature-metas.md](./features/feature-metas.md) |
| Registro diario y rachas | Entregada | [feature-registro-diario.md](./features/feature-registro-diario.md) |
| Historial y reportes | Entregada | [feature-historial.md](./features/feature-historial.md) |
| Panel del profesional (M-09) | Entregada (2026-10-28) | [feature-panel-profesional.md](./features/feature-panel-profesional.md) |

## Pantallas especificadas

| Pantalla | Documento |
|----------|-----------|
| Login (Inicio de sesión) | [screen-login.md](./screens/screen-login.md) |
| Registro (Crear cuenta) | [screen-registro.md](./screens/screen-registro.md) |
| Dashboard (Inicio) | [screen-dashboard.md](./screens/screen-dashboard.md) |
| Hábitos | [screen-habitos.md](./screens/screen-habitos.md) |
| Metas | [screen-metas.md](./screens/screen-metas.md) |
| Registros | [screen-registros.md](./screens/screen-registros.md) |
| Historial | [screen-historial.md](./screens/screen-historial.md) |
| Nuevo / editar registro (modal) | [screen-nuevo-registro.md](./screens/screen-nuevo-registro.md) |
| Pacientes (profesional) | [screen-pacientes.md](./screens/screen-pacientes.md) |
| Progreso del paciente (profesional) | [screen-progreso-paciente.md](./screens/screen-progreso-paciente.md) |

---

## Cómo trabajar aquí

1. Lee `project-structure.md` y `layers-and-state.md` antes de tocar código.
2. Para cada decisión significativa (librería de estado, base de datos local, inyección de
   dependencias) registra un ADR en `decisions/`.
3. Para cada feature que construyas, copia `_template-feature.md` a `features/` y llénalo.
4. Para cada pantalla nueva, copia `_template-screen.md` a `screens/`.

---

## Correlaciones con otras secciones

| Esta sección alimenta a... | Por qué |
|----------------------------|---------|
| `02-code-and-ui/` | Los límites entre capas determinan dónde vive la UI y dónde la lógica |
| `03-api-and-data/` | La capa de datos implementa las reglas de red y persistencia |
| `04-quality/` | Las capas definen qué se prueba con unitarias y qué con pruebas de UI |

---

## Preguntas que esta sección debe responder

- ¿Dónde va el código de una feature nueva?
- ¿Qué capa puede depender de cuál?
- ¿Qué patrón de estado usa la app, y uno solo?
- ¿Cómo navegan las pantallas y dónde quedó registrada esa decisión?


## Revisado y listo para hacer PR