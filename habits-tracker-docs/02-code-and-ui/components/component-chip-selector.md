# Componente — ChipSelector

- **Ubicación:** `src/components/ChipSelector.tsx`
- **Estado:** Estable

---

## Propósito

Selección de **una sola opción** entre varias, presentadas como chips en una fila con
desplazamiento horizontal. Es el sustituto móvil del `<select>` de la versión web, y evita
depender de una librería de picker o del `Picker` nativo, cuyo aspecto difiere mucho entre
Android e iOS.

**Cuándo usarlo:** elegir la categoría de un hábito, elegir el hábito de una meta o de un
registro, filtrar la lista de registros por hábito.

**Cuándo NO usarlo:** para alternar entre dos o tres vistas de la misma pantalla —eso es
`SegmentedTabs`—, ni para listas largas (más de ~15 opciones), donde el desplazamiento
horizontal deja de ser usable y conviene una pantalla de selección.

---

## Props

| Prop | Tipo | Obligatorio | Por defecto | Qué controla |
|------|------|-------------|-------------|--------------|
| `etiqueta` | `string` | Sí | — | Título del grupo; se muestra en mayúsculas |
| `opciones` | `Opcion[]` | Sí | — | Las opciones disponibles |
| `seleccion` | `number \| null` | Sí | — | El `id` seleccionado, o `null` si no hay ninguno |
| `onSeleccionar` | `(id: number) => void` | Sí | — | Se llama con el `id` de la opción pulsada |

```ts
export interface Opcion {
  id: number;
  etiqueta: string;
}
```

> El componente es **controlado**: no guarda estado propio. Quien lo usa mantiene la selección.
> Por eso admite `null`, que representa "aún no se ha elegido nada" y permite validar el
> formulario antes de guardar.

---

## Estados visuales

| Estado | Apariencia |
|--------|------------|
| Chip no seleccionado | Fondo `colors.surface`, borde `colors.border`, texto `colors.muted` |
| Chip seleccionado | Fondo y borde de acento (`colors.teal`), texto destacado |
| Presionado | Retroalimentación por defecto de `Pressable` |
| Sin opciones | Fila vacía: **el componente no dibuja nada**. Quien lo usa debe evitar ese caso (por ejemplo, `MetasScreen` no debería abrir el modal si no hay hábitos) |
| Deshabilitado | **No soportado** |

---

## Tokens usados

- **Color:** `colors.surface`, `colors.border`, `colors.muted`, `colors.teal`
- **Espaciado:** `spacing.sm` entre chips, `spacing.lg` de margen final para insinuar que hay más contenido
- **Radio:** `radius.pill`
- **Tipografía:** `fontSize.xs` para la etiqueta del grupo (peso `700`, `letterSpacing: 0.5`)

---

## Accesibilidad

- **Rol:** cada chip declara `accessibilityRole="radio"` y `accessibilityState={{ selected }}`,
  que es la semántica correcta para una selección única.
- **Objetivo táctil:** el relleno del chip queda algo por debajo de los 48 dp de altura en las
  etiquetas de una sola línea. **Pendiente de verificar y ajustar.**
- **Pendiente:** el `ScrollView` horizontal no expone que hay más opciones fuera de pantalla.
  Un lector de pantalla las encuentra al desplazarse, pero no se anuncia cuántas hay.

---

## Ejemplo de uso

```tsx
<ChipSelector
  etiqueta="Categoria"
  opciones={categorias.map((c) => ({
    id: c.id,
    etiqueta: `${c.icono} ${c.nombre}`,
  }))}
  seleccion={categoriaId}
  onSeleccionar={setCategoriaId}
/>
```

Con una opción sintética para representar "todos" (patrón de `RegistrosScreen`):

```tsx
<ChipSelector
  etiqueta="Filtrar por habito"
  opciones={[
    { id: TODOS, etiqueta: 'Todos' },
    ...habitos.map((h) => ({ id: h.id, etiqueta: h.nombre })),
  ]}
  seleccion={filtro}
  onSeleccionar={setFiltro}
/>
```

> `TODOS` es `-1`, declarado como constante del módulo. Funciona porque ningún `id` real es
> negativo, pero es un valor centinela: si algún día los identificadores dejan de ser enteros
> positivos (por ejemplo, si el backend usara UUID), este patrón hay que revisarlo.
