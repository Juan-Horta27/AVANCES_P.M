# ADR-009 — El backend vive en `backend/`, dentro del repositorio de código

- **ID:** ADR-009
- **Fecha:** 2026-10-25
- **Estado:** Reemplazado por [ADR-010](./ADR-010-separacion-en-cuatro-repositorios.md) (2026-10-28): la guía del corte 3 exige repositorios separados
- **Autores:** Juan José Horta Vanegas, Daniel Felipe Fernandez Rojas — redactado con asistencia de Claude Code

---

## Contexto

La retrospectiva del Sprint 1 dejó pendiente decidir dónde vive el código, porque la primera
versión de la app se subió dentro de `05-release/` del repositorio de documentación. Desde
entonces la app tiene su propio repositorio (`healthy-habits-tracker`), pero el backend NestJS
no tiene ubicación decidida y está a punto de empezar a escribirse.

**Restricciones conocidas:**
- Equipo de dos personas: cada repositorio adicional es otro conjunto de ramas, PR y CI que mantener.
- Cliente y servidor comparten el modelo de dominio y deben cambiar juntos cuando cambia el contrato.

---

## Decisión

**Decidimos:** crear el backend en la carpeta **`backend/`** del repositorio
`healthy-habits-tracker`, como un proyecto Node independiente (su propio `package.json`). La
app Expo permanece en la raíz del repositorio.

**Justificación:**
Un cambio de contrato toca a la vez el servidor y el cliente; en un solo repositorio cabe en un
solo PR, revisable de una vez. El desempate fue el costo de mantenimiento para dos personas: un
repositorio, una política de ramas y un historial.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **`backend/` en el repo de código (elegida)** | Un PR por cambio de contrato; un solo historial | El repo mezcla dos proyectos Node | — (elegida) |
| Repositorio aparte para el backend | Separación total; CI independiente | Dos PR coordinados por cada cambio de contrato | Más mantenimiento sin beneficio para un equipo de dos |
| Mover la app a `mobile/` y el backend a `backend/` | Simetría | Rompe rutas, el README y el flujo de Expo ya verificado | Cambio sin necesidad |
| Dentro del repositorio de documentación | — | Repite el error registrado en la retrospectiva del Sprint 1 | Descartado |

---

## Consecuencias

**Positivas:**
- Se cierra la acción pendiente de la retrospectiva del Sprint 1.
- Cliente y servidor se versionan juntos.

**Negativas / Compromisos:**
- Hay que evitar que TypeScript y Jest de la app recojan archivos de `backend/` (y viceversa):
  se excluye `backend/` en el `tsconfig.json` y en la configuración de Jest de la app.
- La copia del código en `05-release/healthy-habits-tracker/` del repositorio de documentación
  queda **obsoleta** y debe eliminarse en un PR aparte para que nadie la edite por error.

**Impacto en el sistema:**
- Documentos a actualizar: [`../../project-structure.md`](../../project-structure.md), `05-release/README.md`.

---

## Referencias

- Relacionado con: [ADR-007](./ADR-007-estructura-por-rol-tecnico.md), [ADR-008](./ADR-008-reconciliacion-contrato-api.md),
  [`../../../00-governance/retros/sprint-01.md`](../../../00-governance/retros/sprint-01.md).
