# Caso de prueba — TC-001

- **ID:** TC-001
- **Historia relacionada:** HU-02 (M-06)
- **Feature / pantalla:** [Registro diario](../../01-architecture/features/feature-registro-diario.md) · `NuevoRegistroScreen`
- **Plataformas:** Android e iOS
- **Tipo:** Funcional
- **Invariante que protege:** un único registro por hábito y fecha (`@@unique([habitoId, fecha])`)

---

## Precondiciones

- Sesión iniciada (cualquier correo y contraseña sirven en la v1.0.0).
- Existe el hábito "Beber agua" con la meta activa de 8 vasos.
- **No existe** aún un registro de "Beber agua" para la fecha de hoy. Si los datos semilla ya
  crearon uno, elimínalo primero desde la pestaña Registros.

---

## Pasos

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Abrir la pestaña Inicio y pulsar "+ Registrar cumplimiento" | Se abre el modal de nuevo registro, con la fecha de hoy preseleccionada |
| 2 | Seleccionar el hábito "Beber agua" | Se muestra la meta activa (8 vasos) y la unidad de medida |
| 3 | Escribir `9` en el campo de valor | El campo acepta el número con teclado numérico |
| 4 | Pulsar "Guardar" | Mensaje en verde: "Registro guardado. ¡Meta cumplida!". El modal se cierra solo a los ~900 ms |
| 5 | Volver a pulsar "+ Registrar cumplimiento" | Se abre el modal de nuevo |
| 6 | Seleccionar "Beber agua", escribir `5` y pulsar "Guardar" | **Mensaje en rojo: "Ya existe un registro de este habito para esa fecha."** El modal NO se cierra y el registro NO se crea |
| 7 | Cerrar el modal y abrir la pestaña Registros | Aparece **un solo** registro de "Beber agua" para hoy, con valor `9` |
| 8 | En el modal, seleccionar "Beber agua", retroceder un día con la flecha izquierda, escribir `7` y guardar | Se guarda correctamente: la restricción es por hábito **y fecha**, no solo por hábito |
| 9 | Abrir el modal, seleccionar "Caminar" (otro hábito) con la fecha de hoy, escribir `30` y guardar | Se guarda correctamente: la restricción es por hábito, no global |

---

## Variantes a comprobar

| Variante | Resultado esperado |
|----------|--------------------|
| Guardar sin seleccionar hábito | "Selecciona un habito y escribe el valor" |
| Guardar con el campo de valor vacío | Mismo mensaje |
| Escribir un valor negativo | "Ingresa un valor valido" |
| Escribir texto no numérico | "Ingresa un valor valido" |
| Registrar un hábito **sin meta activa** (por ejemplo, "Meditar") | Se guarda, pero con `metaCumplida = false`; el mensaje es "Registro guardado. Sigue esforzandote." y la pantalla avisa de que el hábito no tiene meta activa |
| Intentar avanzar más allá de hoy con la flecha derecha | La fecha no avanza |

---

## Resultado

- **Estado:** Aprobado en web (pasos 1-9 y todas las variantes)
- **Build:** copia de trabajo con app conectada al API (2026-10-26)
- **Dispositivo / SO:** app web de Expo (Chromium, vista de 375×812) contra el API en Docker. **No ejecutado en Android ni iOS físicos.**
- **Evidencia:** auditoría E2E del 2026-10-26 ([`../auditoria-e2e-2026-10-26.md`](../auditoria-e2e-2026-10-26.md)): recorrido por la interfaz y script de caja negra contra el API.
- **Notas / defectos:** el mensaje del paso 6 es el literal del contrato (E-11, canónico según ADR-008): "Ya existe un registro para este hábito en la fecha indicada.", no el texto de este caso. La flecha derecha no avanza más allá de hoy y el servidor rechaza una fecha futura con 422.

---

## Nota sobre la migración al backend

Tras conectar el API, este caso **no cambia desde el punto de vista del usuario**, pero sí cambia
quién impone la regla: el mensaje del paso 6 pasará a venir de un `409` del servidor
(ver [`../../03-api-and-data/endpoints/endpoint-post-registro.md`](../../03-api-and-data/endpoints/endpoint-post-registro.md)).
El texto mostrado debe seguir siendo el mismo.
