# Presupuestos de Rendimiento

Se fijan presupuestos, se miden y una regresión se trata como un bug que bloquea la release.

---

## Presupuestos

| Métrica | Presupuesto | Estado actual |
|---------|-------------|---------------|
| Arranque en frío hasta el primer fotograma | 2 s o menos en gama media | **No medido** |
| Renderizado | 60 fps, sin saltos al desplazar | **No medido** |
| Tamaño del bundle de JavaScript | Referencia: **2 MB** (`expo export --platform android`) | ✅ Medido: 2 MB |
| Tamaño del `.aab` instalado | Se registra en cada release; todo aumento se justifica | **No medido** |
| Memoria en los flujos principales | Sin fugas; estable al navegar entre pestañas | **No medido** |
| Tiempo de respuesta al guardar un registro | Percibido como inmediato (menos de 100 ms) | **No medido** desde que el guardado pasa por el API; sin red es inmediato porque queda en la cola local (S-06) |
| Arranque del backend con Docker | Listo en menos de 2 minutos desde un clon limpio | ✅ Medido (2026-10-28): 73 s con imagen sin caché y base nueva; 21 s con la imagen construida |

> La columna de estado es deliberadamente honesta. Los presupuestos existen desde ya para que la
> primera medición tenga contra qué compararse, no para fingir que ya se cumplen.

---

## Riesgos de rendimiento conocidos en esta app

Estos son los puntos concretos que más probablemente se degradarán, en orden:

### 1. Re-render global del contexto

Cualquier cambio en `AppContext` re-renderiza a **todos** sus consumidores: las cinco pestañas a
la vez. Está mitigado con `useCallback` en las acciones y `useMemo` en el objeto de valor, pero
es el techo estructural del patrón elegido
([ADR-001](../01-architecture/decisions/records/ADR-001-state-management-pattern.md)).

**Cuándo se notará:** con cientos de registros y varias pantallas montadas.

### 2. Recálculo de rachas en cada cambio de `registros`

```ts
const rachas = useMemo(
  () => habitos.map((h) => calcularRacha(h.id, registros)),
  [habitos, registros],
);
```

Es `O(hábitos × registros)` con una ordenación por hábito. Con 10 hábitos y 3.600 registros son
36.000 iteraciones más 10 ordenaciones **cada vez que se crea o elimina un registro**.

**Mitigación cuando haga falta:** agrupar los registros por hábito una sola vez antes de
iterar, o tomar la racha del servidor en lugar de recalcularla.

### 3. `HistorialScreen` recorre todos los registros

La vista semanal agrupa **todo el historial**, sin limitarse a un rango. Crece sin cota.

### 4. Serialización completa en cada escritura

Cuando entre la persistencia, reescribir el arreglo completo de registros en `AsyncStorage` tras
cada mutación será el primer cuello de botella. Su umbral de reevaluación está en
[ADR-004](../01-architecture/decisions/records/ADR-004-persistencia-local.md).

### 5. Listas sin virtualización efectiva

`RegistrosScreen` usa `FlatList`, que virtualiza correctamente. **Pero `HistorialScreen` dibuja
sus filas con `map` dentro de un `ScrollView`**: con muchos meses o semanas, monta todas las
filas a la vez.

---

## Reglas

- **Medir antes de optimizar.** Ninguno de los riesgos de arriba se corrige hasta que se mida y
  duela; están documentados para saber dónde mirar cuando pase, no para optimizar por adelantado.
- Las listas largas usan `FlatList` o `SectionList`, nunca `map` dentro de un `ScrollView`.
- Los datos derivados se calculan con `useMemo`, con las dependencias correctas.
- Los valores se renderizan a partir de estado inmutable, para que React pueda descartar
  re-renders.
- No se añade una dependencia sin comprobar su impacto en el tamaño del bundle.

---

## Cómo medir

```bash
# Tamaño del bundle
npx expo export --platform android

# Rendimiento en tiempo real
# Expo Go → agitar el dispositivo → Performance Monitor (fps de JS y de UI)

# Perfil de renders
# React DevTools Profiler, conectado a la app en Expo Go
```

---

## En CI y antes de la release

- Capturar el tamaño del bundle en el trabajo previo a la release.
- Comparar contra la release anterior; un salto grande exige revisión.
- Registrar arranque en frío y tamaño en la
  [checklist de release](../05-release/_template-release-checklist.md).

---

## Dispositivo de referencia

Los presupuestos se miden en **gama media Android**, no en el mejor teléfono del equipo. Un
presupuesto medido en un dispositivo tope de gama no protege a nadie.
