# Caso de prueba — TC-003

- **ID:** TC-003
- **Historia relacionada:** HU-02 (M-04)
- **Feature / pantalla:** [Gestión de hábitos](../../01-architecture/features/feature-habitos.md) · `HabitosScreen`
- **Plataformas:** Android e iOS
- **Tipo:** Funcional
- **Invariante que protege:** no se elimina un hábito que tiene registros asociados

---

## Precondiciones

- Sesión iniciada.
- Existe al menos un hábito **con** registros (por ejemplo, "Beber agua", que trae registros
  semilla).

---

## Pasos

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Abrir la pestaña Hábitos | La tarjeta de "Beber agua" muestra el número total de registros, mayor que 0 |
| 2 | Pulsar el control de eliminar de "Beber agua" | Aparece una alerta nativa de confirmación: `¿Eliminar "Beber agua"?` con Cancelar y Eliminar |
| 3 | Pulsar Cancelar | La alerta se cierra. **Nada cambia**: el hábito sigue en la lista |
| 4 | Pulsar eliminar de nuevo y confirmar con Eliminar | **Aviso "Listo": "El hábito tenía registros: se archivó y su historial se conserva."** (ADR-008, D-10; antes se bloqueaba) |
| 5 | Revisar la lista | "Beber agua" **ya no aparece** en Hábitos, ni en el Dashboard, ni en el selector de Nuevo registro |
| 6 | Abrir las pestañas Registros e Historial | Los registros de "Beber agua" siguen todos ahí; en Historial aparece como "Beber agua [Archivado]" |

---

## Segunda parte: el camino que sí funciona

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 7 | Crear un hábito nuevo: "Leer", categoría Meditación, unidad "paginas" | Aparece en la lista con 0 registros y sin meta |
| 8 | Crear una meta para "Leer": 20 páginas | La meta aparece activa en la pestaña Metas |
| 9 | Eliminar "Leer" y confirmar | **Se elimina correctamente**: no tiene registros |
| 10 | Abrir la pestaña Metas | **La meta de "Leer" también desapareció**: las metas se eliminan en cascada con su hábito |

---

## Lo que este caso demuestra

| Comportamiento | Paso |
|----------------|------|
| Toda eliminación pide confirmación | 2 |
| Cancelar no tiene efectos secundarios | 3 |
| Un hábito con historial está protegido | 4-6 |
| Un hábito sin registros sí se elimina | 9 |
| Las metas se eliminan en cascada | 10 |

> **Por qué esta regla existe:** no es una limitación técnica sino una decisión de producto.
> Borrar un hábito con historial destruiría registros de salud de la persona. El backend impone
> la misma restricción mediante la clave foránea.

---

## Variantes a comprobar

| Variante | Resultado esperado |
|----------|--------------------|
| Eliminar un hábito cuyo único registro se acaba de borrar | Se elimina correctamente: la comprobación es sobre el estado actual |
| Crear un hábito sin rellenar la unidad de medida | "Completa nombre, unidad y categoria" |
| Crear un hábito sin seleccionar categoría | Mismo mensaje |

---

## Resultado

- **Estado:** Aprobado en web (pasos 1-10 y variantes de validación)
- **Build:** copia de trabajo con app conectada al API (2026-10-26)
- **Dispositivo / SO:** app web de Expo (Chromium, vista de 375×812) contra el API en Docker. **No ejecutado en Android ni iOS físicos.**
- **Evidencia:** auditoría E2E del 2026-10-26 ([`../auditoria-e2e-2026-10-26.md`](../auditoria-e2e-2026-10-26.md)): recorrido por la interfaz y script de caja negra contra el API.
- **Notas / defectos:** en el paso 6 el historial muestra "Beber agua [Archivado]". La pestaña Metas sigue listando la meta del hábito archivado (no lo regula ningún documento).
