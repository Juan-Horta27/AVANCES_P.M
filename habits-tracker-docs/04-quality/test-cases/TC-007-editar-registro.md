# Caso de prueba — TC-007

- **ID:** TC-007
- **Historia relacionada:** HU-02 (M-04, M-05, M-06; "editar" del CRUD); [ADR-011](../../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md)
- **Feature / pantalla:** [Registro diario](../../01-architecture/features/feature-registro-diario.md), [hábitos](../../01-architecture/features/feature-habitos.md) y [metas](../../01-architecture/features/feature-metas.md)
- **Plataformas:** Android, iOS y web
- **Tipo:** Funcional
- **Invariante que protege:** al editar el valor de un registro, el **servidor** vuelve a decidir si se cumplió la meta; editar una meta no reescribe el historial

---

## Precondiciones

- Sesión iniciada como `paciente@habitos.test`.
- "Beber agua" tiene meta activa de 8 vasos y un registro reciente de 9 vasos (✅).

---

## Pasos — editar registro

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Registros → en la tarjeta de "Beber agua" pulsar ✎ ("Editar registro") | Se abre "✏️ Editar registro" con el valor y las notas precargados y el texto "(el hábito y la fecha no se cambian)" |
| 2 | Cambiar el valor a `5` y "Guardar registro" | **"✅ Registro actualizado."** y el modal se cierra |
| 3 | Mirar la tarjeta | Ahora muestra **⭕** y **5 vasos**: 5 < 8, ya no cumple |
| 4 | Volver a editarlo a `9` | "Registro actualizado. ¡Meta cumplida!" y vuelve el ✅; la racha del hábito se recalcula |

## Pasos — editar hábito y meta

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 5 | Hábitos → "Editar" en "Beber agua" | Ventana "Editar hábito" precargada; la categoría aparece fija: "(no se puede cambiar)" |
| 6 | Cambiar la descripción y "Guardar" | La tarjeta muestra la nueva descripción |
| 7 | Crear el hábito "Leer" y, en Metas, la meta "20 páginas al día" con valor 20 | La meta aparece activa |
| 8 | "Editar" la meta: valor `25`, descripción "25 páginas al día" | La tarjeta muestra 25 y la nueva descripción |
| 9 | "Eliminar" la meta | Confirmación "¿Eliminar esta meta? Los registros ya evaluados conservan su resultado."; al aceptar, desaparece |
| 10 | Hábitos → "Eliminar" en "Leer" (sin registros) | "Hábito eliminado." |

---

## Resultado

- **Estado:** Aprobado (pasos 1 a 3 y 5 a 10). El paso 4 se ejecutó como restauración del dato (valor 9) sin comprobar el mensaje; el recálculo hacia `true` está cubierto por la prueba e2e `editarRegistro_valorQueYaNoCumple_recalculaMetaCumplidaYLaRacha` y la sonda Postman 18.
- **Build:** copias de trabajo de `habits-tracker-app` y `habits-tracker-api` (2026-10-28).
- **Dispositivo / SO:** app web de Expo en Chrome sin ventana (390×844) contra la API en Docker. **No ejecutado en Android ni iOS físicos.**
- **Evidencia:** recorrido automatizado del paciente del 2026-10-28 (17/17 comprobaciones; capturas "editar hábito", "metas" y "registro editado"); `test/edicion.e2e-spec.ts`.
- **Notas / defectos:** en la primera ejecución la comprobación del mensaje del paso 2 falló por tiempo (se leía la pantalla 1,15 s después de pulsar y el modal ya se había cerrado a los 900 ms); el dato sí se había guardado. Se corrigió la **prueba** para esperar el mensaje en vez de leer a ciegas, y se reforzó la del paso 3 para mirar la tarjeta concreta. La app no cambió.
