# Pantalla — Historial

- **Ruta:** `Historial` (pestaña del `TabParamList`)
- **Feature:** [historial](../features/feature-historial.md)
- **Referencia de diseño:** `Project/HU-02.md` sección 5.4
- **Archivo:** `src/screens/HistorialScreen.tsx`

---

## Propósito

Ofrecer una vista analítica y agregada del progreso del paciente en dos modalidades temporales: mensual (con selector de mes) y semanal (orden cronológico inverso por semana).

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Encabezado | `ScreenHeader` | Título "📊 Historial" y subtítulo "Tu progreso acumulado" |
| Selector de Modo | `SegmentedTabs` | Alterna entre vista "Por mes" y "Por semana" |
| Selector de Meses | `ScrollView` horizontal | Meses del año (Ene, Feb, Mar...) para filtrar la vista mensual |
| Tarjeta de Resumen | `Card` | Indicadores de total registros, cumplidas y porcentaje de adherencia global del mes |
| Desglose por Hábito | `Card` | Lista de hábitos evaluados en el mes, mostrando cumplidas/totales, porcentaje de adherencia, valor promedio y barra visual de progreso |
| Vista Semanal | `Card` | Agrupación por semana a partir del lunes (`inicioDeSemana()`), con porcentaje y barra de progreso semanal |

---

## Algoritmos en el Cliente

Todas las métricas de esta pantalla se calculan como funciones puras en memoria sobre el arreglo `registros` del `AppContext`, de modo que la pantalla funciona sin conexión con los datos ya descargados (en Android e iOS, también tras reiniciar la app, gracias a la caché).

- **Mensual:** registros del mes elegido **del año en curso**; por hábito, cumplidas / totales, porcentaje y valor promedio.
- **Semanal:** agrupación por semana que empieza en lunes (`inicioDeSemana()`), de la más reciente a la más antigua.
- **Color del porcentaje:** `colorDeCumplimiento()` de `constants/theme.ts` (≥ 80 % verde, ≥ 50 % naranja, menos rojo), el mismo que usa el panel del profesional.

---

## Estados

| Estado | Disparador | Interfaz |
|--------|------------|----------|
| Cargado (mes) | Hay registros en el mes elegido | Resumen del mes y desglose por hábito |
| Vacío (mes) | Ningún registro ese mes | `EmptyState` "Sin datos este mes · No hay registros para el mes seleccionado." |
| Cargado (semana) | Hay registros | Una tarjeta por semana |
| Vacío (semana) | Ningún registro | `EmptyState` "Sin datos · Todavia no hay registros para agrupar por semana." |
| Sin conexión | Sin red | Se calcula con los registros en memoria o en la caché; la franja "Sin conexión" lo indica |

---

## Acciones

| Acción | Resultado | Caso de uso / evento |
|--------|-----------|----------------------|
| Tocar "Por mes" / "Por semana" | Cambia la vista | M-07 |
| Tocar un mes | Recalcula el resumen de ese mes | M-07 |

---

## Accesibilidad

- [x] Las pestañas de modo son `SegmentedTabs` con rol de pestaña.
- [x] Cada porcentaje aparece como número además del color de la barra.
- [x] Cada mes del selector horizontal es una pestaña con `accessibilityState={{ selected }}`.
- [ ] Texto escalable con el tamaño de fuente del sistema: sin verificar en dispositivo.
