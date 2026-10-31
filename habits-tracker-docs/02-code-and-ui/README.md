# 02 — Código y UI

> **¿Qué es esto?** Los estándares de código y las reglas de interfaz: cómo se escribe el
> código y cómo se construye, estiliza, hace accesible y localiza la interfaz.

## Por qué existe esta sección

La consistencia a nivel de código e interfaz es lo que hace que una app se sienta como **un
solo producto hecho por un solo equipo**, y no como ocho pantallas cosidas. Estas reglas se
hacen cumplir en la revisión de código y, cuando el linter esté configurado, también en CI.

---

## Documentos de esta sección

| Archivo | Propósito |
|---------|-----------|
| [coding-standards.md](./coding-standards.md) | Nombres, TypeScript, inmutabilidad, manejo de errores, asincronía |
| [design-system.md](./design-system.md) | Tokens de `theme.ts`, catálogo de componentes, reglas de estilo |
| [accessibility.md](./accessibility.md) | Reglas de accesibilidad y estado real componente a componente |
| [i18n.md](./i18n.md) | Centralización de textos y localización |
| [_template-component.md](./_template-component.md) | Plantilla para documentar un componente (no editar) |
| [components/](./components/) | Componentes compartidos documentados |

---

## Lo esencial en una tabla

| Regla | Consecuencia práctica |
|-------|----------------------|
| `strict: true`, sin `any`, sin `!` | `npx tsc --noEmit` es parte del DoD |
| El dominio se nombra en español | `RegistroDiario`, `metaActivaDe`, `rachaMaxima` |
| Los identificadores y literales del código no llevan tilde | `contrasena`, `Habitos` — se corrige al centralizar textos |
| Todo valor visual sale de `constants/theme.ts` | Ningún `#161B22` ni `padding: 16` suelto |
| Los componentes no conocen el contexto | Reciben todo por props |
| Los estilos van en `StyleSheet.create` al final del archivo | Excepto valores calculados en render |
| Las acciones que fallan devuelven `{ ok, mensaje? }` | La pantalla decide cómo comunicarlo |

---

## Componentes documentados

| Componente | Documento |
|------------|-----------|
| `AppButton` | [component-app-button.md](./components/component-app-button.md) |
| `Badge` | [component-badge.md](./components/component-badge.md) |
| `Card` | [component-card.md](./components/component-card.md) |
| `ChipSelector` | [component-chip-selector.md](./components/component-chip-selector.md) |
| `EmptyState` | [component-empty-state.md](./components/component-empty-state.md) |
| `Input` | [component-input.md](./components/component-input.md) |
| `ScreenHeader` | [component-screen-header.md](./components/component-screen-header.md) |
| `SegmentedTabs` | [component-segmented-tabs.md](./components/component-segmented-tabs.md) |
| `StatCard` | [component-stat-card.md](./components/component-stat-card.md) |
| `WeekChart` | [component-week-chart.md](./components/component-week-chart.md) |
| `AvisoSinConexion` | [component-aviso-sin-conexion.md](./components/component-aviso-sin-conexion.md) |
| `PantallaEstado` | [component-pantalla-estado.md](./components/component-pantalla-estado.md) |
| `confirmar` / `avisar` | [component-dialogos.md](./components/component-dialogos.md) |

---

## Correlaciones con otras secciones

| Esta sección alimenta a... | Por qué |
|----------------------------|---------|
| `01-architecture/` | Los estándares aplican dentro de los límites de capa definidos allí |
| `04-quality/` | Linter y reglas de accesibilidad se verifican en CI y antes de cada release |
| `00-governance/definition-of-done.md` | Varios puntos del DoD salen directamente de aquí |

---

## Preguntas que esta sección debe responder

- ¿Cómo se nombra, estructura y maneja errores el código?
- ¿De dónde salen los colores, los espaciados y la tipografía?
- ¿Cómo se garantiza que la app sea accesible?
- ¿Cómo se gestionan los textos que ve el usuario?
