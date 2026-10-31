# Caso de prueba — TC-002

- **ID:** TC-002
- **Historia relacionada:** HU-02 (M-07)
- **Feature / pantalla:** [Registro diario y rachas](../../01-architecture/features/feature-registro-diario.md) · `DashboardScreen`, `HabitosScreen`
- **Plataformas:** Android e iOS
- **Tipo:** Funcional
- **Invariante que protege:** cálculo de racha actual y racha máxima

---

## Precondiciones

- Sesión iniciada.
- Existe el hábito "Caminar" con la meta activa de 30 minutos.
- Conviene empezar desde un estado conocido: eliminar todos los registros de "Caminar" desde la
  pestaña Registros.

> Desde la integración con el backend (2026-10-25) los datos se guardan en el servidor: el caso
> puede repartirse en varias sesiones. Los mismos pasos están automatizados en
> `test/habitos.e2e-spec.ts` de `habits-tracker-api` (`listar_conRegistros_calculaRachaActualYMaxima_TC002`).

---

## Pasos

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Sin ningún registro de "Caminar", abrir la pestaña Hábitos | La tarjeta de "Caminar" muestra racha actual **0** |
| 2 | Registrar "Caminar" con `35` minutos para **hoy** | Racha actual **1** (35 ≥ 30, la meta se cumple) |
| 3 | Registrar "Caminar" con `40` para **ayer** | Racha actual **2** |
| 4 | Registrar "Caminar" con `45` para **anteayer** | Racha actual **3** |
| 5 | Registrar "Caminar" con `10` para **hace 3 días** | Racha actual sigue en **3**: 10 < 30, la meta no se cumple y ese día no cuenta |
| 6 | Registrar "Caminar" con `50` para **hace 4 días** | Racha actual sigue en **3**: el día 3 rompió la continuidad. La racha máxima sigue siendo 3 |
| 7 | Registrar `50` para hace 5, 6, 7 y 8 días | **Racha actual 3**, **racha máxima 5** (el tramo antiguo es más largo, pero no está conectado con hoy) |
| 8 | Eliminar el registro de **hoy** desde la pestaña Registros | **Racha actual sigue en 2**, no baja a 0: la racha cuenta hasta hoy **o hasta ayer**, para no castigar al usuario que aún no ha registrado el día en curso |
| 9 | Eliminar también el registro de **ayer** | **Racha actual 0**: el tramo ya no llega ni a ayer. Racha máxima **5** |

---

## Lo que este caso demuestra

| Comportamiento | Paso |
|----------------|------|
| Solo cuentan los registros con la meta cumplida | 5 |
| Un día incumplido rompe la continuidad | 6 |
| Un tramo antiguo mejora la máxima pero no la actual | 7 |
| La tolerancia de un día (hoy o ayer) es intencional | 8 |
| Sin conexión con hoy ni con ayer, la racha actual es 0 | 9 |

---

## Variantes a comprobar

| Variante | Resultado esperado |
|----------|--------------------|
| Hábito sin meta activa, con registros | Racha 0: sin meta, `metaCumplida` es siempre `false` |
| Registrar un valor **exactamente igual** a la meta (30) | Cuenta como cumplida: la comparación es `>=` |
| Racha que cruza el fin de mes | Cuenta correctamente, sin saltos |
| Racha que cruza el fin de año | Cuenta correctamente |

> Las dos últimas variantes son laboriosas de ejecutar a mano. **Son exactamente el motivo por
> el que este caso debe automatizarse** en cuanto exista la suite de pruebas
> ([ADR-006](../../01-architecture/decisions/records/ADR-006-estrategia-de-pruebas.md)): con
> `jest.setSystemTime()` se prueban en un segundo y sin depender del calendario real.

---

## Resultado

- **Estado:** Aprobado (pasos 1-9 por API; pasos 7-9 también por la interfaz: Hábitos muestra racha 3/5, 2/5 y 0/5)
- **Build:** copia de trabajo con app conectada al API (2026-10-26)
- **Dispositivo / SO:** app web de Expo (Chromium, vista de 375×812) contra el API en Docker. **No ejecutado en Android ni iOS físicos.**
- **Evidencia:** auditoría E2E del 2026-10-26 ([`../auditoria-e2e-2026-10-26.md`](../auditoria-e2e-2026-10-26.md)): recorrido por la interfaz y script de caja negra contra el API.
- **Notas / defectos:** el historial anterior a hoy se creó por API como precondición; las eliminaciones de los pasos 8 y 9 se hicieron desde la pestaña Registros. Fin de mes y fin de año: cubiertos por pruebas unitarias (`racha.test.ts`, `racha.spec.ts`).
