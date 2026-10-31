# ADR-006 — Herramientas de prueba: Jest + React Native Testing Library

- **ID:** ADR-006
- **Fecha:** 2026-09-17
- **Estado:** Aceptado — Jest con `jest-expo` en la app; Jest + Supertest en `backend/` (2026-10-25), hoy en el repositorio `habits-tracker-api` (ADR-010); más la colección Postman ejecutada con Newman (2026-10-28)
- **Autores:** Juan José Horta Vanegas, Javier Esteban Ortiz López

---

## Contexto

La versión 1.0.0 se entregó **sin una sola prueba automatizada**. Es el punto de deuda más
grave que registró la retrospectiva del Sprint 1, porque la lógica más delicada del producto
—el cálculo de rachas en `utils/racha.ts`— hoy solo está validada a ojo.

Las rachas tienen casos borde que no se detectan mirando la pantalla: un tramo que se corta,
un registro de hoy que aún no existe (y que no debe romper la racha), un tramo antiguo más
largo que el actual, un cambio de mes o de año en medio de la secuencia. Cada uno de ellos es
una línea de código que puede fallar en silencio y producir un número plausible pero incorrecto.

**Restricciones conocidas:**
- Las pruebas tienen que correr en el CI de GitHub Actions, sin emulador.
- `utils/date.ts` y `utils/racha.ts` no importan React: se pueden probar sin renderizar nada.
- Las reglas de negocio viven en `AppContext.tsx`, que sí es un componente y necesita
  renderizarse para probarse.
- Equipo de dos personas: la configuración tiene que ser la del ecosistema, no una a medida.

---

## Decisión

**Decidimos:** adoptar **Jest** con el preset `jest-expo` como ejecutor, y **React Native
Testing Library** (`@testing-library/react-native`) para lo que necesita render.

Reparto por tipo:

| Tipo | Herramienta | Qué cubre | Objetivo |
|------|-------------|-----------|----------|
| Unitaria pura | Jest | `utils/date.ts`, `utils/racha.ts` | Cobertura mayor o igual al 90 % |
| Unitaria de estado | Jest + RNTL (`renderHook`) | Invariantes de `AppContext` | Cobertura mayor o igual al 80 % |
| Componente | Jest + RNTL | Componentes de `src/components/` con lógica visible | Los que tengan lógica |
| Flujo completo | Manual, guiado por `04-quality/test-cases/` | Recorridos críticos en dispositivo | Cada release |

**No adoptamos E2E automatizado (Detox / Maestro) en este corte.** La razón es explícita: un
runner E2E exige emulador en CI y un mantenimiento que, con dos personas y el resto del DoD
sin cerrar, saldría del presupuesto de las features. Los recorridos críticos se cubren con
casos de prueba manuales documentados, que se ejecutan antes de cada release.

**Justificación:**
`jest-expo` es el preset oficial del SDK: resuelve la transformación de los módulos de React
Native sin que el equipo configure Babel a mano, que es justo el tipo de trabajo de
infraestructura que [ADR-002](./ADR-002-react-native-expo.md) buscaba evitar. RNTL empuja a
probar lo que el usuario ve y hace, en vez del estado interno del componente, que es la
propiedad que hace que una prueba sobreviva a un refactor.

El desempate fue el reparto de esfuerzo: la mayor parte del riesgo del producto está en
funciones puras que no necesitan render. El 80 % del valor se consigue con Jest solo, y RNTL
cubre el resto.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **Jest (`jest-expo`) + RNTL (elegida)** | Preset oficial del SDK; estándar del ecosistema; corre en CI sin emulador | No cubre la integración real con la plataforma nativa | — (elegida) |
| Vitest | Más rápido; mejor experiencia de desarrollo | Soporte de React Native inmaduro; habría que configurar transformaciones a mano | Riesgo de infraestructura desproporcionado |
| Detox (E2E) | Prueba la app real en un dispositivo | Necesita emulador en CI; lento y frágil de mantener | Fuera de presupuesto en este corte; se reevaluará |
| Maestro (E2E) | Más simple que Detox, flujos en YAML | Sigue necesitando emulador; una herramienta más que mantener | Mismo motivo |
| Solo pruebas manuales (estado actual) | Cero configuración | No detecta regresiones; el cálculo de rachas no es verificable a ojo | Es el problema que este ADR resuelve |

---

## Consecuencias

**Positivas:**
- El algoritmo de rachas queda cubierto con sus casos borde, incluidos los que no se ven en pantalla.
- Las invariantes del contexto (unicidad por fecha, meta activa única, no borrar hábito con
  registros) se prueban una vez y protegen la migración al backend.
- Las pruebas corren en cada PR sin emulador.

**Negativas / Compromisos:**
- Tres dependencias de desarrollo nuevas (`jest`, `jest-expo`, `@testing-library/react-native`).
- Los recorridos completos siguen dependiendo de ejecución manual, con el riesgo de que se
  omitan bajo presión de entrega. Mitigación: la checklist de release los enumera uno por uno.
- Las pruebas que dependen de la fecha de hoy necesitan reloj fijo con `jest.useFakeTimers()`,
  o serán intermitentes al cambiar de día.

**Impacto en el sistema:**
- Añade `jest.config.js` y el script `npm test`; archivos `*.test.ts` junto al código.
- Documentos a actualizar: [`../../../04-quality/testing-strategy.md`](../../../04-quality/testing-strategy.md),
  [`../../../00-governance/definition-of-done.md`](../../../00-governance/definition-of-done.md),
  [`../../../05-release/ci-cd.md`](../../../05-release/ci-cd.md).

---

## Referencias

- Relacionado con: [`../../../04-quality/testing-strategy.md`](../../../04-quality/testing-strategy.md),
  [`../../../00-governance/retros/sprint-01.md`](../../../00-governance/retros/sprint-01.md)
