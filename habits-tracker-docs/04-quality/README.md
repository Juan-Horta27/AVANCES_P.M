# 04 — Calidad

> **¿Qué es esto?** Cómo se prueba la app, cuán rápida y liviana debe ser, y cómo se mantiene
> segura en ejecución.

## Por qué existe esta sección

La calidad se define y se mide, no se espera. Esta sección convierte el "en mi teléfono
funciona" en compuertas explícitas y verificables: pruebas, presupuestos de rendimiento y una
checklist de seguridad.

---

## ⚠️ Estado actual

| Área | Estado |
|------|--------|
| Pruebas automatizadas | ✅ (2026-10-28) App: **97** pruebas en 8 archivos (Jest + RNTL). API: **35** unitarias y **113** e2e contra PostgreSQL (Jest + Supertest). Colección Postman: **18** peticiones, **24** aserciones, 0 fallos. Ver [ADR-006](../01-architecture/decisions/records/ADR-006-estrategia-de-pruebas.md) |
| Recorridos por la interfaz | ✅ (2026-10-28) Recorrido automatizado en Chrome de la app web: profesional 8/8, paciente 17/17 comprobaciones, con capturas reales |
| Linter | ⚠️ Backend: ESLint + Prettier. App: solo `tsc --noEmit` (ESLint pendiente) |
| Presupuestos de rendimiento | ⚠️ Definidos; solo el tamaño del bundle está medido (2 MB) |
| Checklist de seguridad | ⚠️ Definida; con 5 hallazgos abiertos |

Esta sección documenta tanto **lo acordado** como **lo que falta**, con la misma franqueza. La
tabla de deuda del [DoD](../00-governance/definition-of-done.md) es el marcador que hay que vaciar.

---

## Documentos de esta sección

| Archivo | Propósito |
|---------|-----------|
| [testing-strategy.md](./testing-strategy.md) | Pirámide de pruebas, qué probar primero, nombres, cobertura |
| [performance-budgets.md](./performance-budgets.md) | Presupuestos y riesgos de rendimiento concretos de esta app |
| [mobile-security.md](./mobile-security.md) | Checklist de ejecución y hallazgos abiertos |
| [_template-test-case.md](./_template-test-case.md) | Plantilla para un caso manual (no editar) |
| [test-cases/](./test-cases/) | Casos de prueba manuales documentados |

---

## Casos de prueba manuales

| Caso | Qué verifica | Invariante que protege |
|------|--------------|------------------------|
| [TC-001](./test-cases/TC-001-registro-duplicado.md) | Rechazo de registro duplicado | Un registro por hábito y fecha |
| [TC-002](./test-cases/TC-002-calculo-de-racha.md) | La racha crece, se corta y conserva la máxima | Cálculo de rachas |
| [TC-003](./test-cases/TC-003-eliminar-habito-con-registros.md) | No se elimina un hábito con historial | Integridad referencial |
| [TC-004](./test-cases/TC-004-meta-activa-unica.md) | Una sola meta activa por hábito | Meta activa única |
| [TC-005](./test-cases/TC-005-permisos-por-rol.md) | Cada rol solo ve y usa lo suyo; 403 al rol equivocado | Permisos por rol (ADR-011) |
| [TC-006](./test-cases/TC-006-registro-sin-conexion.md) | Registrar sin red: queda pendiente, se sube solo, conflicto → gana el servidor | Cola sin conexión (S-06) |
| [TC-007](./test-cases/TC-007-editar-registro.md) | Editar registro, hábito y meta; el servidor recalcula `metaCumplida` | Edición completa |
| [TC-008](./test-cases/TC-008-reporte-de-progreso.md) | Reporte del profesional por rango de fechas | Adherencia y racha máxima (M-09) |

> TC-001 a TC-004 cubren **las cuatro invariantes del dominio**; TC-005 a TC-008, lo que añadió
> [ADR-011](../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md) para el alcance completo de C3.

---

## Correlaciones con otras secciones

| Esta sección depende de... | Por qué |
|----------------------------|---------|
| `00-governance/definition-of-done.md` | Las pruebas son parte de "terminado" |
| `01-architecture/` | Las capas definen qué se prueba con unitarias y qué con pruebas de UI |
| `03-api-and-data/` | Red y persistencia necesitarán pruebas de integración |
| `05-release/` | Las compuertas de calidad condicionan cada release |

---

## Preguntas que esta sección debe responder

- ¿Qué se prueba, a qué nivel y cuánto?
- ¿Cuáles son los presupuestos de rendimiento y cómo se detecta una regresión?
- ¿Qué comprobaciones de seguridad se ejecutan antes de una release?
