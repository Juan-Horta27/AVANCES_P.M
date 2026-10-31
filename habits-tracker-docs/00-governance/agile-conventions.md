# Convenciones Ágiles

## Cadencia

El sprint dura **2 semanas** y se alinea con los cortes evaluativos de la asignatura.

| Ceremonia | Frecuencia | Duración | Resultado |
|-----------|------------|----------|-----------|
| Planificación de sprint | Al inicio de cada sprint | 1 h | Backlog del sprint comprometido |
| Sincronización | 2 veces por semana (el equipo es de 2 personas) | ≤ 15 min | Bloqueos visibles |
| Refinamiento del backlog | Semanal | 45 min | Historias estimadas y en estado *Ready* |
| Revisión de sprint | Fin de sprint | 45 min | Demo **en dispositivo real** vía Expo Go |
| Retrospectiva | Fin de sprint | 30 min | Acciones con responsable |

> La demo de la revisión se hace corriendo la app en un teléfono físico con Expo Go, nunca
> con capturas de pantalla. Si no corre en el teléfono, la historia no se demuestra.

---

## Estimación

- Puntos de historia en escala Fibonacci: `1, 2, 3, 5, 8, 13`.
- Una historia mayor a `8` se divide antes de entrar al sprint.
- Se estima esfuerzo relativo, no horas.

**Referencias de calibración de este proyecto:**

| Puntos | Ejemplo real |
|--------|--------------|
| 1 | Añadir una variante al componente `Badge` |
| 2 | Pantalla de listado con estado vacío (`RegistrosScreen`) |
| 3 | Pantalla con formulario modal y validación (`MetasScreen`) |
| 5 | `NuevoRegistroScreen` completa: selector de hábito, navegación de fechas y cálculo de meta cumplida |
| 8 | Algoritmo de rachas (`utils/racha.ts`) con sus casos borde y pruebas |
| 13 | Migrar todo el `AppContext` de datos en memoria a llamadas reales al backend — **se divide** |

---

## Higiene del backlog

- Toda historia tiene valor de usuario claro y criterios de aceptación (ver
  [definition-of-ready.md](./definition-of-ready.md)).
- Las historias que tocan UI enlazan su referencia de diseño (wireframe de
  [`Project/HU-02.md`](../Project/HU-02.md) sección 5, o una pantalla ya existente).
- Las historias que llaman al backend enlazan o simulan el contrato del API en
  [`03-api-and-data/endpoints/`](../03-api-and-data/endpoints/).
- Las historias de descubrimiento y decisión (como HU-01 y HU-02) producen un documento en
  este repositorio, no código.

---

## Roles

Con dos integrantes, los roles son sombreros que se rotan, no personas distintas.

| Rol | Responsable | Es dueño de |
|-----|-------------|-------------|
| Product Owner (rotativo) | Juan José Horta / Daniel Felipe Fernandez | Prioridades y aceptación de criterios |
| Tech lead (rotativo) | Quien no implementó la historia | Arquitectura, ADRs, hacer cumplir el DoD |
| Desarrolladores | Ambos | Implementación, pruebas, documentación |
| QA (rotativo) | El revisor del PR | Plan de pruebas y pruebas exploratorias en dispositivo |
| Tutor | Ing. Jesús Ariel González Bonilla | Validación académica de cada corte |

> Regla dura del equipo: **nadie aprueba su propio PR**. Con dos personas, eso significa que
> siempre hay exactamente un revisor y es la otra persona.

---

## Trazabilidad historia → código → prueba

Cada historia deja rastro en tres lugares:

```
HU-XX (Project/)  →  commit feat(scope): ...  →  TC-NNN (04-quality/test-cases/)
```

Si alguno de los tres falta, la historia no cumple el DoD.
