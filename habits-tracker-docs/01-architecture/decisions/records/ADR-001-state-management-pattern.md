# ADR-001 — Patrón de gestión de estado

- **ID:** ADR-001
- **Fecha:** 2026-09-08
- **Estado:** Aceptado
- **Autores:** Juan José Horta Vanegas, Javier Esteban Ortiz López

---

## Contexto

La app necesita una forma única y consistente de manejar el estado de la interfaz en sus
8 pantallas. Sin un patrón decidido, cada integrante elige el suyo y aparecen pantallas
inconsistentes, difíciles de probar y con modelos mentales mezclados durante la revisión.

El estado que hay que compartir entre pantallas no es trivial: el usuario en sesión, el
catálogo de categorías, los hábitos, las metas y los registros diarios. Cinco pestañas leen
los mismos registros y tres de ellas los modifican. Un registro creado en el modal
`NuevoRegistro` tiene que verse inmediatamente reflejado en el dashboard, en la lista de
registros, en el historial y en el cálculo de rachas.

**Restricciones conocidas:**
- Equipo de dos personas, con el sprint atado a fechas de corte académicas. El patrón debe
  aprenderse rápido.
- El estado debe ser probable sin renderizar interfaz.
- En esta primera versión **no hay backend**: todo vive en memoria. El patrón elegido no puede
  quedar obsoleto cuando lleguen las llamadas asíncronas.
- La app corre en Android, iOS y web desde una sola base de código.

---

## Decisión

**Decidimos:** usar **React Context + `useState`** como único mecanismo de estado global,
con flujo unidireccional y actualizaciones inmutables, expuesto a las pantallas mediante un
hook `useApp()`.

Concretamente:
- Un solo `AppProvider` montado en `App.tsx`.
- Las pantallas leen estado y llaman acciones; nunca reciben los `setState`.
- Todo dato derivado (rachas, actividad semanal, registros de hoy) se calcula con `useMemo`,
  no se guarda.
- Las acciones que pueden fallar devuelven `{ ok, mensaje? }`; la pantalla decide cómo
  comunicarlo.

**Justificación:**
Context viene incluido en React: cero dependencias nuevas, cero configuración y cero riesgo de
incompatibilidad con el SDK de Expo. Para un modelo de dominio de cinco entidades y un solo
usuario en sesión, es suficiente. Lo que realmente nos importaba era la **frontera**: que las
pantallas dependan de un contrato (`AppState`) y no de la fuente de los datos. Esa frontera la
da igual de bien Context que Redux, y Context la da sin coste de aprendizaje.

El desempate fue la migración futura: cuando entre el backend, cambia el **cuerpo** de las
acciones de `AppContext.tsx` y ninguna pantalla se toca.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **React Context + useState (elegida)** | Sin dependencias, mínimo por aprender, frontera clara entre UI y datos | Re-renderiza a todos los consumidores ante cualquier cambio; no escala a decenas de entidades | — (elegida) |
| Redux Toolkit | Herramientas de depuración excelentes, middleware para asincronía, patrón muy explícito | Mucho andamiaje (store, slices, thunks) para 5 entidades; curva de aprendizaje real en un equipo de 2 con fecha de corte | Desproporcionado para el alcance actual |
| Zustand | API mínima, sin proveedor, selectores que evitan re-render innecesario | Dependencia externa adicional; el equipo no la conocía | El beneficio (menos re-renders) no era un problema medido |
| React Query / TanStack Query | Ideal para estado de servidor: caché, reintentos, invalidación | **No hay servidor todavía**; resuelve un problema que aún no tenemos | Prematuro. Se reevaluará al conectar el API |
| `useState` en cada pantalla, sin estado global | Trivial | Imposible mantener sincronizados dashboard, registros, historial y rachas | Rompe el requisito principal |

---

## Consecuencias

**Positivas:**
- Cero dependencias nuevas y cero configuración de build.
- Las pantallas no saben de dónde vienen los datos: `mockData.ts` se puede borrar sin tocarlas.
- Las reglas de negocio quedan en un solo archivo, lo que permite compararlas línea a línea
  con las del backend.
- Los datos derivados no pueden desincronizarse, porque no se guardan.

**Negativas / Compromisos:**
- Cualquier cambio en el contexto re-renderiza a **todos** los consumidores. Se mitiga con
  `useCallback` en las acciones y `useMemo` en el objeto de valor, pero el techo existe.
- No hay herramientas de time-travel debugging.
- Cuando llegue la asincronía, habrá que añadir a mano `cargando` y `error` al estado, algo
  que React Query daría gratis.

**Impacto en el sistema:**
- Pantallas afectadas: todas.
- Documentos a actualizar: [`../../layers-and-state.md`](../../layers-and-state.md).

**Umbral de reevaluación:** si el re-render global produce jank medible en una lista, o si al
conectar el API la gestión manual de `cargando`/`error` empieza a duplicarse pantalla por
pantalla, se abre un ADR para introducir React Query sobre el mismo `AppContext`.

---

## Referencias

- Implementación: `05-release/healthy-habits-tracker/src/context/AppContext.tsx`
- Relacionado con: [`../../layers-and-state.md`](../../layers-and-state.md),
  [ADR-005](./ADR-005-cliente-http.md)
