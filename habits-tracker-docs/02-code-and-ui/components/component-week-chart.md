# Componente — WeekChart

- **Ubicación:** `src/components/WeekChart.tsx`
- **Estado:** Estable, **con una brecha de accesibilidad conocida**

---

## Propósito

Mostrar de un vistazo cómo ha ido la semana en curso: una barra por día, de lunes a domingo,
con la altura y el color proporcionales al porcentaje de metas cumplidas ese día.

Está construido **solo con `View`**, sin ninguna librería de gráficas. Es una decisión
deliberada: para siete barras, una dependencia como `victory-native` o `react-native-svg`
añadiría peso al bundle y una superficie de mantenimiento que no compensa.

**Cuándo NO usarlo:** para series de más de ~10 puntos, para gráficas con ejes o interacción, o
cuando haga falta comparar varias series. En esos casos toca reconsiderar una librería.

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `dias` | `Dia[]` | Sí | — | Los días a dibujar, en orden |

```ts
interface Dia {
  fecha: string;      // 'YYYY-MM-DD'
  total: number;      // registros de ese día
  cumplidas: number;  // cuántos cumplieron su meta
  porcentaje: number; // 0-100, ya calculado
}
```

> El componente **no calcula nada del dominio**: recibe el porcentaje ya resuelto. Quien lo
> calcula es `actividadSemanal` en `AppContext`, con `useMemo`. Esta separación es la que
> mantiene al componente libre de lógica de negocio.

---

## Reglas de dibujo

| Caso | Altura de la barra | Color |
|------|--------------------|-------|
| `porcentaje` mayor o igual a 80 | Proporcional al porcentaje | `colors.green` |
| `porcentaje` entre 50 y 79 | Proporcional al porcentaje | `colors.orange` |
| `porcentaje` menor que 50 | Proporcional, con un mínimo de 14 px | `colors.red` |
| `total === 0` (día sin registros) | 6 px fijos | `colors.surface2` |

- `ALTURA_MAXIMA = 90` px es la altura de una barra al 100 %.
- El mínimo de 14 px evita que un día con muy bajo cumplimiento quede invisible.
- El porcentaje se escribe encima de la barra, **excepto** cuando el día no tiene registros.

> **Umbrales en un solo lugar (2026-10-28):** el color sale de `colorDeCumplimiento()` y de
> `UMBRAL_CUMPLIMIENTO_ALTO` / `UMBRAL_CUMPLIMIENTO_MEDIO` en `constants/theme.ts`, que comparten
> `WeekChart`, `HistorialScreen` y `ProgresoPacienteScreen`. La duplicación anterior se eliminó.

---

## Estados visuales

| Estado | Apariencia |
|--------|------------|
| Semana con datos | Barras de colores con su porcentaje encima |
| Día sin registros | Barra gris de 6 px, sin texto de porcentaje |
| Semana entera vacía | Siete barras grises: correcto, no se rompe |
| Cargando | **No existe.** Se añadirá al conectar el backend |

---

## Tokens usados

- **Color:** `colors.green`, `colors.orange`, `colors.red`, `colors.surface2`, `colors.muted`
- **Espaciado:** `spacing.sm` entre columnas, `spacing.xs + 2` dentro de cada columna
- **Radio:** `radius.sm`
- **Tipografía:** `fontSize.xs - 1` para el porcentaje y la etiqueta del día

---

## Accesibilidad

> ❌ **Esta es la brecha de accesibilidad más grande de la app.**

Las barras son `View` sin etiqueta: para un lector de pantalla, la gráfica **no existe**. Solo
se anuncian las etiquetas de día (`Lun`, `Mar`, ...) y los porcentajes como textos sueltos,
sin relación entre ellos.

**Corrección pendiente**, registrada en [accessibility.md](../accessibility.md):

```tsx
<View
  key={dia.fecha}
  style={styles.columna}
  accessible
  accessibilityRole="image"
  accessibilityLabel={
    dia.total > 0
      ? `${diaCorto(dia.fecha)}: ${dia.cumplidas} de ${dia.total} metas cumplidas, ${dia.porcentaje} por ciento`
      : `${diaCorto(dia.fecha)}: sin registros`
  }
>
```

Nota adicional: el color es hoy el único portador de la valoración (bien / regular / mal). El
porcentaje escrito encima lo compensa **salvo en los días sin registros**, donde no se escribe
nada. La etiqueta accesible resuelve también ese caso.

---

## Ejemplo de uso

```tsx
const { actividadSemanal } = useApp();

<Card>
  <Text style={styles.tituloTarjeta}>Actividad de la semana</Text>
  <WeekChart dias={actividadSemanal} />
</Card>
```
