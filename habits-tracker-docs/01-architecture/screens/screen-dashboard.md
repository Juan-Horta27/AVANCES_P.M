# Pantalla — Dashboard (Inicio)

- **Ruta:** `Dashboard` (pestaña del `TabNavigator`)
- **Feature:** transversal — lee de [hábitos](../features/feature-habitos.md), [metas](../features/feature-metas.md), [registro diario](../features/feature-registro-diario.md) e [historial](../features/feature-historial.md)
- **Referencia de diseño:** `Project/HU-02.md` sección 5.2
- **Archivo:** `src/screens/DashboardScreen.tsx`

---

## Propósito

Es la primera pantalla tras iniciar sesión y responde a una sola pregunta: **¿cómo voy hoy?**
Resume el estado del día y de la semana, y ofrece el atajo para registrar un cumplimiento.

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Encabezado | `ScreenHeader` | Saludo con el nombre del usuario y la fecha larga de hoy; a la derecha, cerrar sesión |
| Métricas | 4 × `StatCard` | Hábitos activos · registrados hoy · racha máxima actual · cumplimiento de la semana |
| Gráfica semanal | `WeekChart` dentro de `Card` | 7 barras, lunes a domingo, coloreadas por porcentaje |
| Registros de hoy | Lista dentro de `Card` | Hábito, valor registrado con su unidad y `Badge` de meta cumplida |
| Acción principal | `AppButton` | "+ Registrar cumplimiento" → abre el modal `NuevoRegistro` |

---

## Métricas y de dónde salen

| Tarjeta | Cálculo | Origen |
|---------|---------|--------|
| Hábitos activos | `habitos.filter(h => h.activo).length` | Estado base |
| Registrados hoy | Número de hábitos distintos con registro hoy, sobre el total activo | `registrosDeHoy` (derivado) |
| Mejor racha actual | `max(rachaDe(h).rachaActual)` entre los hábitos activos | `rachas` (derivado) |
| Cumplimiento semanal | `cumplidasSemana / registrosSemana` | `actividadSemanal` (derivado) |

> Ninguna de estas cifras se guarda en estado: todas se recalculan a partir de `registros`.
> Por eso no pueden quedar desincronizadas con la lista de registros
> (ver [`../layers-and-state.md`](../layers-and-state.md)).

---

## Estados

| Estado | Disparador | Interfaz |
|--------|------------|----------|
| Con datos | Hay hábitos y registros | Métricas, gráfica y lista del día |
| Sin registros hoy | `registrosDeHoy` vacío | Mensaje propio en la tarjeta del día, con el botón de registrar |
| Sin hábitos | `habitos` vacío | Las métricas muestran 0 y la gráfica queda en gris |
| Cargando | Carga inicial de datos tras iniciar sesión | `PantallaEstado` de carga (lo resuelve `AppNavigator`, no la pantalla) |
| Error | La carga inicial falla y no hay caché | `PantallaEstado` de error con "Reintentar" y "Cerrar sesión" |
| Sin conexión | Se abrió con datos de la caché y el API no responde | Franja `AvisoSinConexion` sobre la barra de pestañas, con "Reintentar" |

---

## Acciones

| Acción del usuario | Resultado | Acción del contexto |
|--------------------|-----------|---------------------|
| Pulsar "+ Registrar cumplimiento" | Abre el modal de nuevo registro | `navigation.navigate('NuevoRegistro')` |
| Pulsar "Salir" (cerrar sesión) | Confirmación "¿Seguro que quieres salir?"; si hay registros pendientes de subir (S-06), "Tienes N registro(s) sin subir. Si sales ahora se perderán. ¿Salir de todas formas?" | `cerrarSesion()`; `AppNavigator` vuelve solo a `Login` |

> No hace falta `navigation.replace`: al cerrarse la sesión, el stack raíz deja de montar las
> pestañas y el botón atrás de Android no puede volver a una sesión cerrada.

---

## Accesibilidad

- [x] El botón principal usa `AppButton`, que declara `accessibilityRole="button"`.
- [ ] Las tarjetas de métrica se anuncian como texto suelto: falta agrupar valor y etiqueta en
      un único `accessibilityLabel` (hoy el lector lee "8" y "Hábitos activos" por separado).
- [ ] La gráfica semanal **no tiene alternativa textual**: las barras son `View` sin etiqueta.
      Es la brecha de accesibilidad más grande de la pantalla.
- [ ] El color es el único portador del significado en las barras (verde/naranja/rojo). Debe
      acompañarse del porcentaje, que ya se muestra encima de cada barra excepto cuando el día
      no tiene registros.
- [x] `StatCard` usa `adjustsFontSizeToFit`, así que el valor no desborda con fuentes grandes.

---

## Deuda conocida

- Las métricas no son pulsables: tocar "Registrados hoy" debería llevar a la lista filtrada.
- El saludo, los títulos y las etiquetas están escritos dentro de la pantalla
  (ver [`../../02-code-and-ui/i18n.md`](../../02-code-and-ui/i18n.md)).
