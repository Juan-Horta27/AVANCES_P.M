# Accesibilidad

La accesibilidad es un **requisito**, no un extra. Estas reglas se verifican antes de dar una
historia por terminada.

---

## Reglas

- Todo elemento interactivo tiene una etiqueta accesible y un rol declarado
  (`accessibilityRole`, `accessibilityLabel`).
- Objetivo táctil mínimo: **44×44 pt** en iOS, **48×48 dp** en Android.
- El texto escala con el ajuste de tamaño de fuente del sistema: nada de alturas fijas que
  recorten el texto.
- El contraste cumple **WCAG AA**: 4,5:1 para texto de cuerpo y 3:1 para texto grande e iconos.
- **El color nunca es el único portador del significado**: se acompaña de texto, icono o forma.
- Las pantallas son navegables y legibles con el lector de pantalla (VoiceOver y TalkBack).
- Se respeta "reducir movimiento".
- El orden de foco sigue el orden de lectura; los modales atrapan el foco y lo devuelven al cerrarse.

---

## Contraste de la paleta sobre el fondo

Verificado contra `colors.bg` (`#0D1117`) y `colors.surface` (`#161B22`):

| Token | Sobre `bg` | Sobre `surface` | Veredicto |
|-------|-----------|-----------------|-----------|
| `colors.text` (`#E6EDF3`) | ~15,8:1 | ~14,4:1 | Cumple AA y AAA |
| `colors.muted` (`#8B949E`) | ~6,6:1 | ~6,0:1 | Cumple AA en texto de cuerpo |
| `colors.teal` (`#2DD4BF`) | ~9,9:1 | ~9,0:1 | Cumple AA |
| `colors.green` (`#3FB950`) | ~6,9:1 | ~6,3:1 | Cumple AA |
| `colors.orange` (`#F0883E`) | ~7,6:1 | ~6,9:1 | Cumple AA |
| `colors.red` (`#F85149`) | ~5,1:1 | ~4,7:1 | Cumple AA en cuerpo |
| `colors.subtle` (`#484F58`) | ~2,3:1 | ~2,1:1 | **No cumple**: solo para elementos decorativos y placeholders |

> **Acción pendiente:** `colors.subtle` se usa hoy para el texto de la nota al pie del login y
> para los placeholders de `Input`. Los placeholders son admisibles (no transmiten información
> necesaria), pero la nota al pie debe subir a `colors.muted`.

---

## Estado actual, componente a componente

| Componente | Estado | Detalle |
|------------|--------|---------|
| `AppButton` | ✅ | Declara `accessibilityRole="button"`; altura resultante de ~48 dp |
| `ChipSelector` | ✅ | `accessibilityRole="radio"` + `accessibilityState={{ selected }}` |
| `SegmentedTabs` | ✅ | `accessibilityRole="tab"` + `accessibilityState={{ selected }}` |
| `StatCard` | ✅ | Un único `accessibilityLabel` con valor, etiqueta y detalle (2026-10-26) |
| `Badge` | ⚠️ | Es texto, se lee bien, pero no declara que es un estado |
| `Input` | ✅ | `accessibilityLabel` del `TextInput` = etiqueta visible (2026-10-26) |
| `WeekChart` | ✅ | Cada columna anuncia "Lun: 2 de 2 cumplidas, 100%" o "sin registros" (2026-10-26) |
| `EmptyState` | ✅ | Texto plano legible + botón con rol |
| `AvisoSinConexion` | ✅ | `accessibilityRole="alert"` y región activa; botón "Reintentar conexión" con `disabled`/`busy` (2026-10-28) |
| `PantallaEstado` | ✅ | Región activa: el paso de "cargando" a "error" se anuncia |
| Botones ✎ y ✕ de `RegistrosScreen` | ✅ | Etiquetas "Editar registro" y "Eliminar registro" (el icono solo no se anuncia) |
| Tarjetas de `PacientesScreen` | ✅ | Botón con etiqueta "Ver el progreso de <nombre>" |
| Flechas de rango (`ProgresoPacienteScreen`) | ✅ | "Desde: día anterior", "Hasta: día siguiente"…; las métricas se anuncian como "valor, etiqueta" |
| Flechas de fecha (`NuevoRegistroScreen`) | ⚠️ | Rol `button` y etiquetas "Día anterior" / "Día siguiente"; `accessibilityState.disabled` en la de avanzar, **no verificado en dispositivo** (react-native-web no lo publica como `aria-disabled`) |
| Iconos de pestaña | ✅ | La emoji es decorativa; la etiqueta de texto acompaña siempre |

---

## Acciones concretas pendientes

> **Estado (2026-10-26):** 1 a 5 aplicadas (la 5 ya estaba resuelta: la nota al pie usa
> `colors.muted`). Además, todo control pulsable (pestañas, chips, botones "+", "Salir", "Cerrar",
> enlaces y meses del historial) declara rol y etiqueta. Pendiente: la 6 y la checklist con
> TalkBack/VoiceOver en dispositivo.

1. `WeekChart`: añadir a cada columna
   `accessibilityLabel={`${diaCorto(dia.fecha)}: ${dia.cumplidas} de ${dia.total} cumplidas, ${dia.porcentaje}%`}`.
2. `NuevoRegistroScreen`: `accessibilityLabel="Día anterior"` / `"Día siguiente"` en las flechas,
   más `accessibilityState={{ disabled: true }}` cuando no se puede avanzar.
3. `StatCard`: un único `accessibilityLabel` que combine valor, etiqueta y detalle.
4. `Input`: propagar `etiqueta` a `accessibilityLabel` del `TextInput`.
5. Subir el texto de la nota al pie del login de `colors.subtle` a `colors.muted`.
6. Confirmar que los `Modal` de `HabitosScreen` y `MetasScreen` atrapan el foco.

---

## Checklist de verificación

- [ ] Recorrido con lector de pantalla (VoiceOver y TalkBack) en el flujo principal:
      login → dashboard → nuevo registro → historial.
- [ ] El tamaño de fuente más grande del sistema no rompe la disposición.
- [ ] Contraste comprobado sobre `bg` y sobre `surface`.
- [ ] Todos los objetivos táctiles cumplen el tamaño mínimo.
- [ ] "Reducir movimiento" respetado.
- [ ] Ninguna información transmitida solo por color.
