# 00 — Gobernanza

> Esta sección define los acuerdos que el equipo se compromete a seguir durante todo el
> proyecto. Todo integrante debe leer estos documentos antes de su primer commit.

---

## Documentos de esta sección

| Archivo | Propósito |
|---------|-----------|
| [agile-conventions.md](./agile-conventions.md) | Cadencia, ceremonias, estimación y roles del equipo |
| [git-conventions.md](./git-conventions.md) | Estrategia de ramas, formato de commits, PRs y releases |
| [definition-of-ready.md](./definition-of-ready.md) | Checklist para que una historia entre a un sprint |
| [definition-of-done.md](./definition-of-done.md) | Checklist que toda historia terminada debe cumplir |
| [security-rules.md](./security-rules.md) | Reglas de seguridad a nivel de código para la app móvil |
| [_template-sprint-retro.md](./_template-sprint-retro.md) | Plantilla para capturar una retrospectiva (no editar) |
| [retros/](./retros/) | Retrospectivas ya realizadas |

---

## Cómo aplica la gobernanza

Las reglas de gobernanza aplican a **todo el proyecto**: todas las secciones, todas las
features, todos los integrantes. Si una regla choca con una convención local, gana la
gobernanza salvo que un ADR nuevo (`01-architecture/decisions/`) la reemplace.

> Una regla de gobernanza solo se cambia por acuerdo del equipo. Documenta el cambio y el
> motivo, y anúncialo antes del siguiente sprint.

---

## Contexto del equipo

Este es un equipo **de dos personas** en un proyecto académico con cortes evaluativos. Eso
tiene dos consecuencias prácticas que atraviesan toda esta sección:

- **No hay QA ni Product Owner dedicados:** ambos roles rotan entre los integrantes, y quien
  no escribió el código es quien revisa el PR.
- **El sprint está atado al calendario de la asignatura**, no al revés. Las fechas de corte
  son inamovibles; lo que se ajusta es el alcance (ver MoSCoW en
  [`Project/HU-02.md`](../Project/HU-02.md)).

### Integrantes y cambios en el equipo

| Integrante | Usuario de GitHub | Estado |
|------------|-------------------|--------|
| Juan José Horta Vanegas | `Juan-Horta27` | Activo desde el inicio |
| Daniel Felipe Fernandez Rojas | `Daniel666-ui` / `Daniel66-ui` | Activo; **asume el rol de Javier Esteban Ortiz López** |
| Javier Esteban Ortiz López | `Esteban-64210` | Se retiró del proyecto |

> **Cómo leer la documentación tras el cambio:** las responsabilidades **vigentes** (roles,
> responsables de feature, acciones pendientes) ya figuran a nombre de Daniel. En los documentos
> **ya entregados** (ADR-001 a ADR-007, HU-01, HU-02, retrospectiva del Sprint 1, release v1.0.0)
> Esteban se conserva como autor, porque ese trabajo es suyo; no se reescribe la autoría.

---

## Preguntas que esta sección debe responder

- ¿Cómo planea, estima y cierra trabajo el equipo?
- ¿Qué significa "lista" y "terminada" para una historia?
- ¿Cómo se nombran ramas, commits y releases?
- ¿Cuáles son las reglas de seguridad no negociables?


## Revisado y listo para hacer PR

* Revisión de políticas de gobernanza realizada por Esteban Ortiz.