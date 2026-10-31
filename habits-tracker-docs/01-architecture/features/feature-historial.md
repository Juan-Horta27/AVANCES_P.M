# Feature — Historial y reportes

- **Responsable:** Juan José Horta Vanegas
- **Estado:** Entregada. La vista del **profesional** por paciente y rango de fechas es otra feature: [panel del profesional](./feature-panel-profesional.md) (2026-10-28)
- **Historias relacionadas:** HU-02 (S-01, S-02); M-09 en el panel del profesional

---

## Propósito

Responder a la pregunta "¿cómo me ha ido?" más allá del día de hoy: porcentaje de adherencia
por mes, desglose por hábito, y evolución semana a semana. Es la base de los reportes que en el
futuro consultará el profesional de bienestar.

---

## Pantallas

| Pantalla | Ruta | Propósito |
|----------|------|-----------|
| `HistorialScreen` | `Historial` (pestaña) | Alternar entre vista mensual y semanal |
| `DashboardScreen` (parcial) | `Dashboard` (pestaña) | Gráfica de la semana en curso con `WeekChart` |

---

## Vistas

### Vista mensual

- Selector horizontal de los 12 meses del año en curso.
- Tres métricas de cabecera: total de registros del mes, cumplidos y porcentaje.
- Desglose por hábito: total de registros, cumplidos, porcentaje y **promedio del valor
  registrado** (`suma / total`, redondeado a un decimal).

### Vista semanal

- Agrupa **todos** los registros por su lunes (`inicioDeSemana`), sin limitarse al año en curso.
- Ordena de la semana más reciente a la más antigua.
- Muestra una barra de cumplimiento por semana.

### Código de color (compartido con `WeekChart`)

| Porcentaje | Color | Token |
|------------|-------|-------|
| 80 % o más | Verde | `colors.green` |
| Entre 50 % y 79 % | Naranja | `colors.orange` |
| Menos de 50 % | Rojo | `colors.red` |
| Sin registros | Gris | `colors.surface2` |

> Este umbral aparece en dos archivos (`HistorialScreen.tsx` y `WeekChart.tsx`). Es duplicación
> conocida: si cambia el criterio, hay que cambiar ambos. Candidato a extraerse a `constants/`.

---

## Estado

- **Patrón:** React Context + `useState` ([ADR-001](../decisions/records/ADR-001-state-management-pattern.md))
- **Estado base:** solo lee `registros`; no escribe nada
- **Estado local:** modo (`mensual` | `semanal`) y mes seleccionado
- **Agregaciones:** calculadas con `useMemo` sobre `registros`, mediante `Map` por hábito y por semana

---

## Reglas de cálculo

| Métrica | Fórmula |
|---------|---------|
| Porcentaje de adherencia | `redondear(cumplidas / total * 100)` |
| Promedio del valor | `redondear(suma / total * 10) / 10` |
| Semana | Lunes a domingo; el lunes se obtiene con `inicioDeSemana()` |
| Mes | Comparación de componentes locales de `aDate(fecha)` contra mes y año seleccionados |

> Ojo con la división por cero: cuando no hay registros, el porcentaje es 0 por definición, no
> `NaN`. Está contemplado tanto en `actividadSemanal` como en la vista mensual.

---

## Datos

- **Fuente:** `registros` del contexto, cargados del API (y de la caché local al abrir sin red)
- **Persistencia local:** no aplica (es todo derivado)
- **Relación con M-09:** el reporte por rango de fechas del profesional **sí** lo agrega el
  servidor (`GET /reportes/progreso`); este historial del paciente se sigue calculando en la app.

---

## Estados de borde

- [x] Vacío — mensaje propio cuando el mes o la semana no tienen registros
- [x] Cargando — lo resuelve `AppNavigator` antes de mostrar las pestañas
- [x] Sin conexión — se calcula con los registros en memoria o en la caché
- [ ] Rango de fechas libre — no en esta pantalla: solo mes del año en curso (el rango libre está en el panel del profesional)

---

## Decisiones

- [ADR-003](../decisions/records/ADR-003-fechas-como-texto-iso.md) — fechas como texto `YYYY-MM-DD`
- [ADR-011](../decisions/records/ADR-011-roles-y-alcance-completo.md) — roles, edición completa, panel del profesional y S-06

---

## Pruebas

| Nivel | Qué cubre | Dónde | Estado |
|-------|-----------|-------|--------|
| Unitaria | `inicioDeSemana` y `semanaDe` en cambios de mes y de año | `src/utils/date.test.ts` | ✅ |
| Unitaria | Umbrales de color compartidos con el panel del profesional | `constants/theme.ts` (`colorDeCumplimiento`), usado por las dos pantallas | Sin prueba propia |
| Manual | Recorrido de historial mensual y semanal | Manual de usuario (C3) | ✅ |

---

## Deuda conocida

- **Solo se ve el año en curso** en la vista mensual: no hay selector de año.
- No hay exportación a PDF (C-01 de HU-02, fase posterior).
- Las gráficas están construidas con `View` y altura calculada, sin librería. Funciona y evita
  una dependencia, pero limita la riqueza visual (sin ejes, sin interacción).
