# Caso de prueba — TC-004

- **ID:** TC-004
- **Historia relacionada:** HU-02 (M-05)
- **Feature / pantalla:** [Metas por hábito](../../01-architecture/features/feature-metas.md) · `MetasScreen`
- **Plataformas:** Android e iOS
- **Tipo:** Funcional
- **Invariante que protege:** un hábito solo puede tener una meta activa a la vez

---

## Precondiciones

- Sesión iniciada.
- Existe el hábito "Beber agua" con la meta activa de 8 vasos.
- Existe el hábito "Meditar" con una meta **inactiva** de 10 minutos (así vienen los datos semilla).

---

## Pasos — camino de creación

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Abrir la pestaña Metas | La cabecera muestra cuántas metas están activas sobre el total. "Beber agua" aparece con `Badge` de activa; "Meditar", de inactiva |
| 2 | Pulsar el control de añadir meta | Se abre el modal de creación |
| 3 | Seleccionar "Beber agua", escribir `2000` y la descripción "2 litros al dia", y guardar | **Mensaje de error: "Este habito ya tiene una meta activa. Desactivala antes de crear otra."** El modal no se cierra y la meta no se crea |
| 4 | Sin cerrar el modal, cambiar el hábito a "Meditar" y guardar | **Se crea correctamente**: "Meditar" no tenía ninguna meta activa. Nace activa |
| 5 | Revisar la lista | "Meditar" tiene ahora **dos** metas: la nueva activa y la antigua de 10 minutos, inactiva |

## Pasos — camino de activación (el que se olvida)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 6 | Pulsar el control de estado de la meta **inactiva** de "Meditar" (10 minutos) para activarla | **Alerta: "Accion no permitida" con el mensaje "Ya hay otra meta activa para este habito. Desactivala primero."** |
| 7 | Desactivar la meta de 2000 que se creó en el paso 4 | Se desactiva sin problema: **desactivar siempre está permitido** |
| 8 | Volver a activar la meta de 10 minutos | **Ahora sí se activa**: ya no hay otra activa para "Meditar" |
| 9 | Revisar la cabecera | El contador de metas activas se actualiza en consecuencia |

---

## Lo que este caso demuestra

| Comportamiento | Paso |
|----------------|------|
| La invariante se valida **al crear** | 3 |
| La invariante se valida **también al reactivar** | 6 |
| Desactivar nunca está bloqueado | 7 |
| El histórico de metas se conserva | 5 |
| Un hábito sin meta activa admite una nueva | 4 |

> **El paso 6 es el corazón de este caso.** Validar la invariante solo al crear es el error
> clásico: dejaría un camino abierto para tener dos metas activas simplemente reactivando una
> antigua. `alternarMeta` valida ese segundo camino, y por eso hay que probarlo explícitamente.

---

## Segunda parte: el efecto sobre los registros

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 10 | Con la meta de "Meditar" en 10 minutos activa, registrar `12` minutos para hoy | "Registro guardado. ¡Meta cumplida!" |
| 11 | Desactivar esa meta y activar una de 20 minutos | La meta cambia |
| 12 | Revisar el registro del paso 10 en la pestaña Registros | **Sigue marcado como cumplido**: `metaCumplida` se congeló contra la meta vigente ese día y no se recalcula |
| 13 | Registrar `12` minutos para **ayer** | **No** cumple: se evalúa contra la meta activa ahora (20 minutos) |

> El paso 12 documenta un comportamiento deliberado. El paso 13 muestra su límite: un registro
> retroactivo se juzga con la meta **actual**, no con la que estaba vigente en esa fecha. Es una
> simplificación conocida del MVP, anotada en
> [feature-metas.md](../../01-architecture/features/feature-metas.md).

---

## Variantes a comprobar

| Variante | Resultado esperado |
|----------|--------------------|
| Guardar con el valor objetivo vacío | "Completa todos los campos" |
| Valor objetivo `0` o negativo | "El valor objetivo debe ser un numero mayor a 0" |
| Valor objetivo no numérico | Mismo mensaje |
| Guardar sin descripción | "Completa todos los campos" |

---

## Resultado

- **Estado:** Aprobado en web (pasos 1-13 y todas las variantes)
- **Build:** copia de trabajo con app conectada al API (2026-10-26)
- **Dispositivo / SO:** app web de Expo (Chromium, vista de 375×812) contra el API en Docker. **No ejecutado en Android ni iOS físicos.**
- **Evidencia:** auditoría E2E del 2026-10-26 ([`../auditoria-e2e-2026-10-26.md`](../auditoria-e2e-2026-10-26.md)): recorrido por la interfaz y script de caja negra contra el API.
- **Notas / defectos:** los mensajes de los pasos 3 y 6 son los literales del contrato (E-10 y E-10b), con tildes. La meta inactiva de 10 minutos de la precondición se creó por API.
