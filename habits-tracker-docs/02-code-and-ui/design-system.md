# Sistema de Diseño

Fuente única de verdad: `src/constants/theme.ts`.

---

## Tokens

### Color

La paleta es **oscura por defecto** y continúa la identidad visual de la versión web del
producto. `app.json` declara `"userInterfaceStyle": "dark"`, de modo que el sistema no fuerza
un tema claro.

| Token | Valor | Uso |
|-------|-------|-----|
| `colors.bg` | `#0D1117` | Fondo de pantalla |
| `colors.surface` | `#161B22` | Tarjetas, barra de pestañas, cabeceras |
| `colors.surface2` | `#21262D` | Superficie elevada: botón secundario, chip activo, barra sin datos |
| `colors.border` | `#30363D` | Bordes y separadores |
| `colors.text` | `#E6EDF3` | Texto principal |
| `colors.muted` | `#8B949E` | Texto secundario, etiquetas, iconos inactivos |
| `colors.subtle` | `#484F58` | Texto terciario, placeholders, notas al pie |
| `colors.teal` | `#2DD4BF` | **Acento de marca**: acción primaria, selección, pestaña activa |
| `colors.green` | `#3FB950` | Éxito, meta cumplida, cumplimiento mayor o igual al 80 % |
| `colors.orange` | `#F0883E` | Advertencia, cumplimiento entre el 50 % y el 79 % |
| `colors.red` | `#F85149` | Error, acción destructiva, cumplimiento menor al 50 % |
| `colors.blue` | `#58A6FF` | Información |
| `colors.greenSoft` | `#162017` | Fondo de mensaje de éxito |
| `colors.redSoft` | `#2D1517` | Fondo de mensaje de error |

### Espaciado

Escala fija en píxeles independientes de densidad. **No se usan valores intermedios.**

| Token | Valor |
|-------|-------|
| `spacing.xs` | 4 |
| `spacing.sm` | 8 |
| `spacing.md` | 12 |
| `spacing.lg` | 16 |
| `spacing.xl` | 24 |
| `spacing.xxl` | 32 |

> Cuando hace falta un valor entre dos escalones, se compone (`spacing.md + 1`,
> `spacing.sm + 2`), nunca se escribe el número suelto. Es un compromiso pragmático: deja
> rastro de que el valor viene de la escala.

### Radio

| Token | Valor | Uso |
|-------|-------|-----|
| `radius.sm` | 6 | Barras, segmentos internos |
| `radius.md` | 10 | Botones, campos, contenedores segmentados |
| `radius.lg` | 14 | Tarjetas |
| `radius.pill` | 999 | `Badge`, chips |

### Tipografía

No se declaran familias tipográficas: la app usa la **fuente del sistema** de cada plataforma.

| Token | Valor | Uso |
|-------|-------|-----|
| `fontSize.xs` | 11 | Etiquetas de campo, `Badge`, etiquetas de pestaña |
| `fontSize.sm` | 13 | Texto secundario, notas |
| `fontSize.md` | 15 | Texto de botón, cuerpo |
| `fontSize.lg` | 18 | Títulos de tarjeta |
| `fontSize.xl` | 22 | Títulos de pantalla |
| `fontSize.xxl` | 28 | Valor destacado de métrica |

Pesos en uso: `600` (semi), `700` (bold), `800` (títulos y valores).

---

## Reglas

- **Ningún color, espaciado, radio ni tamaño de fuente literal fuera de `theme.ts`.** Es punto
  del [DoD](../00-governance/definition-of-done.md) y se verifica en revisión.
- Las pantallas se construyen con los componentes de `src/components/`. Si una pantalla necesita
  un contenedor con borde y fondo, usa `Card`; no reimplementa uno.
- Un componente de `components/` **posee solo estilo y disposición**: ni lógica de negocio, ni
  acceso al contexto, ni obtención de datos.
- El tema de navegación (`AppNavigator`) se alimenta de los mismos tokens, para que no haya un
  destello de fondo blanco durante las transiciones.
- Las emojis se usan como iconografía (`🏠`, `📌`, `🎯`, `📋`, `📊`, `💧`, `🏃`). Evitan una
  dependencia de iconos, pero **no son accesibles por sí solas**: siempre van acompañadas de
  texto (ver [accessibility.md](./accessibility.md)).

---

## Catálogo de componentes

| Componente | Propósito | Documentado |
|------------|-----------|-------------|
| `AppButton` | Botón único de la app, 3 variantes de intención y estado de carga | [component-app-button.md](./components/component-app-button.md) |
| `Card` | Contenedor base: superficie, borde y radio, con acento superior opcional | [component-card.md](./components/component-card.md) |
| `Badge` | Etiqueta pequeña de estado, en forma de píldora | [component-badge.md](./components/component-badge.md) |
| `Input` | Campo de texto con etiqueta en mayúsculas y borde de foco | [component-input.md](./components/component-input.md) |
| `ChipSelector` | Selección única horizontal; sustituye al `<select>` web | [component-chip-selector.md](./components/component-chip-selector.md) |
| `SegmentedTabs` | Alternador de vistas tipo píldora, genérico sobre el tipo del valor | [component-segmented-tabs.md](./components/component-segmented-tabs.md) |
| `ScreenHeader` | Encabezado consistente: título, subtítulo y acción a la derecha | [component-screen-header.md](./components/component-screen-header.md) |
| `StatCard` | Tarjeta de métrica del dashboard | [component-stat-card.md](./components/component-stat-card.md) |
| `EmptyState` | Estado vacío reutilizable con acción opcional | [component-empty-state.md](./components/component-empty-state.md) |
| `WeekChart` | Gráfica semanal de barras, construida solo con `View` | [component-week-chart.md](./components/component-week-chart.md) |
| `AvisoSinConexion` | Franja "Sin conexión" con pendientes y "Reintentar" | [component-aviso-sin-conexion.md](./components/component-aviso-sin-conexion.md) |
| `PantallaEstado` | Pantalla completa de carga o error con acciones | [component-pantalla-estado.md](./components/component-pantalla-estado.md) |
| `confirmar` / `avisar` | Diálogos iguales en Android, iOS y web | [component-dialogos.md](./components/component-dialogos.md) |

Cada componente compartido se documenta copiando [`_template-component.md`](./_template-component.md)
a `components/`.

---

## Tema claro

**No existe todavía, y es una decisión consciente:** la app declara tema oscuro fijo. La
estructura para soportarlo ya está —todo sale de tokens—, así que añadirlo consiste en
convertir `colors` en dos juegos de valores y leer `useColorScheme()`, sin tocar ni un
componente. Se hará cuando haya una necesidad real, no antes.
