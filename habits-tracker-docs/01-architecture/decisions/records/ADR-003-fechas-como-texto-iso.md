# ADR-003 — Las fechas de registro se manejan como texto `YYYY-MM-DD`

- **ID:** ADR-003
- **Fecha:** 2026-09-10
- **Estado:** Aceptado
- **Autores:** Juan José Horta Vanegas, Javier Esteban Ortiz López

---

## Contexto

El producto entero gira alrededor de una pregunta: **¿qué día ocurrió este registro?** De esa
respuesta dependen la unicidad (`un registro por hábito y fecha`), el cálculo de rachas (días
consecutivos), la gráfica semanal y el historial mensual.

Durante la versión web aparecía un error recurrente: un registro creado por la noche se
mostraba como si fuera del día siguiente. La causa era mezclar fechas en UTC (que es lo que
produce `new Date().toISOString()` y lo que devuelve un `DATE` de PostgreSQL serializado a
JSON) con comparaciones hechas en hora local. Para un usuario en Colombia (UTC-5), todo
registro hecho después de las 19:00 caía en el día siguiente.

**Restricciones conocidas:**
- Un registro diario es un **día del calendario**, no un instante. No tiene hora.
- El backend impone `@@unique([habitoId, fecha])`: si el cliente y el servidor no coinciden en
  qué día es, la restricción rechaza registros legítimos o admite duplicados.
- La app debe funcionar igual en Android, iOS y web, donde las implementaciones de `Date`
  difieren en detalles.

---

## Decisión

**Decidimos:** representar la fecha de un `RegistroDiario` **siempre como una cadena
`'YYYY-MM-DD'` construida a partir de los componentes locales de la fecha**, y no como un
objeto `Date` ni como un timestamp.

Toda conversión pasa por `src/utils/date.ts`:

```ts
aISO(fecha: Date): string        // usa getFullYear/getMonth/getDate — nunca toISOString()
aDate(iso: string): Date         // new Date(anio, mes-1, dia) — medianoche local
hoyISO(): string
sumarDias(iso, dias): string
diferenciaDias(a, b): number
```

**Reglas derivadas, de obligado cumplimiento:**
- **Nunca** se usa `toISOString()` para obtener la fecha de un registro.
- **Nunca** se usa `new Date('2026-09-17')`: esa forma parsea en UTC y reintroduce el bug.
- Comparar y ordenar fechas se hace con comparación de cadenas (`a.fecha.localeCompare(b.fecha)`,
  `fecha < hoyISO()`), lo cual es correcto porque el formato ISO ordena lexicográficamente igual
  que cronológicamente.
- El tipo lo documenta en `src/types/index.ts`:
  `/** Fecha en formato YYYY-MM-DD (se guarda como texto para evitar líos de zona horaria) */`

**Justificación:**
Un día del calendario no es un instante, y modelarlo como instante es la fuente del error.
Guardarlo como texto elimina la zona horaria del problema en lugar de intentar compensarla.
El desempate fue que la cadena ISO es directamente comparable, ordenable y serializable a
JSON sin ninguna transformación, lo que hace que el mismo valor viaje intacto entre el cliente,
el API y la columna `DATE` de PostgreSQL.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **Texto `YYYY-MM-DD` local (elegida)** | Sin zona horaria, comparable y ordenable como cadena, serializa a JSON sin transformar, idéntico en las 3 plataformas | Hay que convertir a `Date` para formatear en pantalla; el tipo no impide pasar una cadena mal formada | — (elegida) |
| Objeto `Date` en el modelo | Tipo nativo, aritmética de fechas directa | Lleva hora y zona horaria que el dominio no tiene; se serializa a UTC y reintroduce el desfase | Es exactamente el bug que queríamos eliminar |
| Timestamp en milisegundos (número) | Comparación numérica trivial | Aún menos legible; sigue siendo un instante, no un día; imposible de leer en un log | No resuelve el problema de fondo |
| Librería de fechas (`date-fns`, `Luxon`, `dayjs`) | Manejo robusto de zonas horarias y formateo | Dependencia extra para un dominio que **no necesita zonas horarias**; `date-fns-tz` o `Luxon` pesan en el bundle | Sobredimensionado: nuestro `date.ts` son 60 líneas de funciones puras |

---

## Consecuencias

**Positivas:**
- El desfase de un día desapareció por construcción, no por parches.
- `utils/date.ts` son funciones puras sin dependencias: se prueban sin renderizar ni simular reloj.
- El valor que el cliente envía es exactamente el que la columna `DATE` de PostgreSQL almacena.
- Ordenar y filtrar registros es comparación de cadenas: barato y sin sorpresas.

**Negativas / Compromisos:**
- El tipo es `string`, así que TypeScript no distingue una fecha válida de cualquier cadena.
  Mitigación pendiente: introducir un tipo de marca (`type FechaISO = string & { __iso: true }`).
- Para mostrar la fecha en español (`17 de septiembre de 2026`) hace falta convertir a `Date`,
  paso que ya encapsulan `fechaLarga()` y `fechaCorta()`.
- Los nombres de meses y días están escritos a mano en `date.ts`, lo que hay que reconciliar
  cuando se implemente la internacionalización (ver [`../../../02-code-and-ui/i18n.md`](../../../02-code-and-ui/i18n.md)).

**Impacto en el sistema:**
- Afectados: `utils/date.ts`, `utils/racha.ts`, `AppContext.tsx`, `NuevoRegistroScreen`,
  `RegistrosScreen`, `HistorialScreen`, `WeekChart`, `mockData.ts`.
- Documentos a actualizar: [`../../../03-api-and-data/_template-entity.md`](../../../03-api-and-data/_template-entity.md) al definir la entidad local de registros.

---

## Referencias

- Implementación: `05-release/healthy-habits-tracker/src/utils/date.ts`
- Relacionado con: [`../../layers-and-state.md`](../../layers-and-state.md),
  [`../../../04-quality/test-cases/TC-002-calculo-de-racha.md`](../../../04-quality/test-cases/TC-002-calculo-de-racha.md)
