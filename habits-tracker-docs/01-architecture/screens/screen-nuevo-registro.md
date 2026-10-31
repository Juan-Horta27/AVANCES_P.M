# Pantalla — Nuevo registro / editar registro (modal)

- **Ruta:** `NuevoRegistro` — modal del stack raíz (rol `paciente`), parámetros opcionales `{ habitoId?: number; registroId?: number }`. Con `registroId` la pantalla **edita** ese registro (ADR-011)
- **Feature:** [registro diario y rachas](../features/feature-registro-diario.md)
- **Referencia de diseño:** `Project/HU-02.md` sección 5.3
- **Archivo:** `src/screens/NuevoRegistroScreen.tsx`

---

## Propósito

Capturar cuánto cumplió la persona de un hábito en una fecha, y decirle **en el momento** si
alcanzó su meta. Es el único punto de escritura del dato más importante del producto.

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Cabecera del modal | `ScreenHeader` + cierre | "📝 Nuevo registro · Anota tu avance del dia" o "✏️ Editar registro · Corrige el valor o las notas"; "×" con etiqueta "Cerrar sin guardar" |
| Selector de hábito | `ChipSelector` | Lista horizontal; preseleccionado si llega `habitoId`. **Al editar** se reemplaza por el texto fijo "<hábito> · <fecha> (el hábito y la fecha no se cambian)" |
| Selector de fecha | Controles propios | Flechas "Día anterior" y "Día siguiente", con la fecha larga en el centro (no aparece al editar) |
| Referencia de meta | Texto | Muestra la meta activa del hábito o avisa de que no tiene |
| Valor | `Input` numérico | Etiquetado con la unidad de medida del hábito |
| Notas | `Input` multilínea | Opcional |
| Acción | `AppButton` | "Guardar registro" (primario). Para salir sin guardar se usa la "×" de la cabecera |

---

## Estados

| Estado | Disparador | Interfaz |
|--------|------------|----------|
| Formulario vacío | Apertura sin parámetro | Ningún hábito seleccionado, fecha = hoy |
| Formulario prellenado | Apertura con `habitoId` | Hábito ya seleccionado |
| Error de validación | Falta hábito o valor, o el valor no es numérico o es negativo | Mensaje en rojo sobre el formulario |
| Modo edición | Apertura con `registroId` | Valor y notas precargados; hábito y fecha fijos |
| Error de negocio | Ya existe registro de ese hábito para esa fecha (`409`) | Mensaje en rojo con el `detail` del servidor |
| Éxito | `crearRegistro` / `editarRegistro` devuelve `ok` | "✅ Registro guardado. ¡Meta cumplida!" (o "Sigue esforzándote.") / "✅ Registro actualizado." y cierre automático a los 900 ms |
| Pendiente (S-06) | Sin red al crear | "⏳ Sin conexión: el registro quedó pendiente y se subirá solo al recuperar la conexión." y cierre automático |
| Hábito sin meta activa | El hábito seleccionado no tiene meta | Aviso: el registro se guardará pero no contará para la racha |
| Cargando | Guardando en el API | El botón Guardar muestra un indicador y no admite otro toque |
| Sin conexión al **editar** | El API no responde | "No pudimos conectar. Revisa tu conexión e intenta de nuevo."; la edición no se encola |

---

## Acciones

| Acción del usuario | Resultado | Acción del contexto |
|--------------------|-----------|---------------------|
| Elegir un hábito | Se muestra su meta activa y su unidad de medida | `metaActivaDe(habitoId)` |
| Flecha de día anterior | Retrocede un día | `sumarDias(fecha, -1)` |
| Flecha de día siguiente | Avanza un día, **solo si la fecha actual es anterior a hoy** | `sumarDias(fecha, 1)` |
| Guardar (nuevo) | Valida, crea el registro (o lo encola sin red) y muestra el resultado | `crearRegistro({ habitoId, fecha, valorRegistrado, notas })` |
| Guardar (edición) | Valida y actualiza valor y notas | `editarRegistro(id, { valorRegistrado, notas })` → `PUT /registros/:id` |
| "×" ("Cerrar sin guardar") | Cierra el modal sin guardar | `navigation.goBack()` |

---

## Validaciones, en orden

1. Hay un hábito seleccionado y el campo de valor no está vacío → si no: "Selecciona un hábito y escribe el valor".
2. El valor es numérico y no negativo → si no: "Ingresa un valor válido".
3. La API comprueba la unicidad de `(habitoId, fecha)` y que la fecha no sea futura → si falla,
   el contexto devuelve `{ ok: false, mensaje }` con el `detail` y la pantalla lo muestra.
4. Si todo pasa, **el servidor** calcula `metaCumplida` contra la meta activa (D-18) y el mensaje
   de éxito cambia en consecuencia.

> La pantalla **no decide** si la meta se cumplió: lo decide el servidor y el contexto lo
> traduce en el mensaje. La pantalla solo valida la forma del formulario y muestra lo que el
> contexto devuelve.

---

## Accesibilidad

- [x] `ChipSelector` declara `accessibilityRole="radio"` y `accessibilityState={{ selected }}`.
- [x] Los campos usan `Input`, que muestra etiqueta visible en mayúsculas sobre el campo.
- [x] Las flechas de fecha tienen `accessibilityLabel` ("Día anterior" / "Día siguiente").
- [x] La flecha de día siguiente expone `accessibilityState={{ disabled }}` en la fecha de hoy.
- [ ] El mensaje de éxito y el cierre automático a 900 ms no se anuncian como región activa: un
      usuario con lector puede no enterarse de que se guardó antes de que el modal se cierre.

---

## Deuda conocida

- ~~El `setTimeout` de cierre no se cancela al desmontar.~~ **Resuelto:** el efecto devuelve
  `clearTimeout`, así que cerrar el modal a mano durante los 900 ms ya no llama a `goBack()` de más.
- No existe selector de calendario: llegar a una fecha de hace tres semanas exige 21 pulsaciones.
- ~~No se puede editar un registro existente.~~ **Resuelto (ADR-011):** modo edición con `registroId`.
  El hábito y la fecha siguen sin poder cambiarse: para eso se elimina y se crea otro.
