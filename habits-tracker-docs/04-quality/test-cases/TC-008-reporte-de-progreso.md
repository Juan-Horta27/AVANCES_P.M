# Caso de prueba — TC-008

- **ID:** TC-008
- **Historia relacionada:** HU-02 (Flujo 5, **M-09**); [ADR-011](../../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md)
- **Feature / pantalla:** [Panel del profesional](../../01-architecture/features/feature-panel-profesional.md) · `PacientesScreen`, `ProgresoPacienteScreen`
- **Plataformas:** Android, iOS y web
- **Tipo:** Funcional
- **Invariante que protege:** la adherencia y la racha máxima se calculan en el servidor, solo dentro del rango elegido

---

## Precondiciones

- Base recién creada con los datos semilla (manual de implementación): Carlos Gómez con 3 hábitos y 27 registros de los días anteriores.
- Sesión iniciada como `profesional@habitos.test`.

---

## Pasos

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ver la lista | "🩺 Pacientes" con el número de pacientes y la tarjeta de Carlos Gómez con su correo y "Ver progreso ›" |
| 2 | Tocar a Carlos Gómez | "Progreso del paciente" con el atajo **30 días** marcado; totales "Días evaluados", "Días cumplidos" y "Adherencia" |
| 3 | Revisar las tarjetas | Una por hábito con "N de M días cumplidos", el porcentaje con su barra de color (≥ 80 % verde, ≥ 50 % naranja, menos rojo) y "🔥 Racha máxima: N días" |
| 4 | Comparar con la semilla (base recién creada) | Beber agua **10 de 12 (83 %)**, racha máxima **4**; Caminar **6 de 8 (75 %)**; Dormir bien **5 de 7 (71 %)** |
| 5 | Tocar **7 días** | Los días evaluados bajan: solo cuentan los registros de la última semana |
| 6 | Pulsar la flecha "Desde: día siguiente" | El rango se acorta un día, el atajo queda sin marcar y los días evaluados bajan o se mantienen |
| 7 | Pulsar varias veces "Hasta: día siguiente" | No avanza más allá de hoy |
| 8 | Volver y pulsar "Salir" | Pide confirmación y vuelve al login |

---

## Resultado

- **Estado:** Aprobado.
- **Build:** copias de trabajo de `habits-tracker-app` y `habits-tracker-api` (2026-10-28).
- **Dispositivo / SO:** app web de Expo en Chrome sin ventana (390×844) contra la API en Docker. **No ejecutado en Android ni iOS físicos.**
- **Evidencia:**
  - Paso 4: cifras verificadas a mano contra `GET /reportes/progreso` con la base recién sembrada (2026-10-28), contando los registros de la migración `datos_semilla_por_rol`.
  - Pasos 1 a 3, 5, 6 y 8: recorrido automatizado del profesional (8/8 comprobaciones; capturas "pacientes", "progreso 30 días" y "progreso 7 días"). En esa ejecución, con datos de pruebas anteriores añadidos, 30 → 7 días bajó de 29 a 20 días evaluados y la flecha, de 20 a 17.
  - Paso 7: `moverExtremo` en `src/utils/rango.test.ts`.
  - Cálculo: `reportes.service.spec.ts` y `test/reportes.e2e-spec.ts`.
- **Notas / defectos:** las cifras exactas del paso 4 solo valen con la base recién creada: los registros de la semilla se fechan **relativos al día de la migración**, y cualquier registro nuevo del paciente cambia los totales.
