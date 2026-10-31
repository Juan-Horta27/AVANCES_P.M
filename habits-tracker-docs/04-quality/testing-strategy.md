# Estrategia de Pruebas

> **Estado (2026-10-28):** la deuda registrada en la [retrospectiva del Sprint 1](../00-governance/retros/sprint-01.md)
> está cerrada. **App** (`habits-tracker-app`, `npm test`, 97 pruebas): `utils/` (racha, date, numeros,
> rango), `services/api.ts`, `storage/` (cache, pendientes) y `AppContext` (arranque, sesión por rol,
> edición y cola sin conexión). **API** (`habits-tracker-api`): `npm test` (35 unitarias),
> `npm run test:e2e` (113, Supertest contra PostgreSQL en el esquema `e2e`) y `npm run test:postman`
> (Newman, 18 peticiones). Decisión: [ADR-006](../01-architecture/decisions/records/ADR-006-estrategia-de-pruebas.md).

---

## Herramientas

| Herramienta | Para qué |
|-------------|----------|
| **Jest** con preset `jest-expo` | Ejecutor de todas las pruebas |
| **React Native Testing Library** | Lo que necesita render: componentes y hooks |
| **Supertest** (API) | e2e de cada endpoint contra PostgreSQL real |
| **Postman + Newman 6.2.3** (API) | Colección de demostración ejecutable con `npm run test:postman` (se descarga con `npx` al usarla; no es dependencia del proyecto) |
| Casos de prueba manuales en [`test-cases/`](./test-cases/) | Recorridos completos en dispositivo |

---

## Pirámide de pruebas

| Tipo | Alcance | Velocidad | Proporción |
|------|---------|-----------|------------|
| Unitaria pura | `utils/date.ts`, `utils/racha.ts` — sin UI, sin E/S | Muy rápida | ~60 % |
| Unitaria de estado | Invariantes de `AppContext` con `renderHook` | Rápida | ~20 % |
| Componente | Un componente o pantalla aislada | Media | ~20 % |
| Flujo completo | Manual, en dispositivo, guiado por `test-cases/` | Lenta | Antes de cada release |

**No hay E2E automatizado en emulador ni en CI**, y es una decisión explícita, no un olvido:
exigiría emulador en CI y un mantenimiento fuera del presupuesto del equipo. El razonamiento está en
[ADR-006](../01-architecture/decisions/records/ADR-006-estrategia-de-pruebas.md). Para la entrega C3
(2026-10-28) se hizo un **recorrido automatizado de la app web** en Chrome sin ventana (protocolo
DevTools), una vez por rol, que además produjo las capturas del manual de usuario; es evidencia de
esta entrega, no una suite que viva en los repositorios.

> La base de la pirámide es ancha aquí porque **el riesgo real de este producto está en
> funciones puras**. La app calcula rachas, porcentajes y rangos de fechas; si esos números
> están mal, la interfaz los muestra igual de bonitos. Ninguna prueba de UI detecta eso.

---

## Qué hay que probar primero

Prioridad por riesgo, no por facilidad:

### 1. `utils/racha.ts` — máxima prioridad

`calcularRacha` es la función más delicada del producto y la única cuya salida es imposible de
verificar a ojo. Casos obligatorios:

| Caso | Resultado esperado |
|------|--------------------|
| Sin registros | `{ rachaActual: 0, rachaMaxima: 0 }` |
| Registros existentes, ninguno con `metaCumplida` | `{ 0, 0 }` |
| Un solo registro cumplido, hoy | `{ 1, 1 }` |
| Un solo registro cumplido, ayer | `{ 1, 1 }` — la tolerancia de un día es deliberada |
| Un solo registro cumplido, hace 3 días | `{ rachaActual: 0, rachaMaxima: 1 }` |
| 5 días consecutivos terminando hoy | `{ 5, 5 }` |
| Tramo cortado: 3 días recientes, hueco, 7 días antiguos | `{ rachaActual: 3, rachaMaxima: 7 }` |
| Tramo que cruza un cambio de mes | Cuenta correctamente |
| Tramo que cruza un cambio de año | Cuenta correctamente |
| Registros desordenados en el arreglo de entrada | Mismo resultado: la función ordena |
| Registros de otros hábitos mezclados | Se ignoran |

### 2. `utils/date.ts`

`sumarDias`, `diferenciaDias`, `inicioDeSemana` y `semanaDe` en los bordes: fin de mes, año
bisiesto, cambio de año, y domingo (que en `inicioDeSemana` debe devolver el lunes anterior, no
el siguiente).

### 3. Invariantes de `AppContext`

- `crearRegistro` rechaza un duplicado `(habitoId, fecha)`.
- `crearRegistro` calcula `metaCumplida` correctamente, y lo pone en `false` si no hay meta activa.
- `crearMeta` rechaza si ya hay una meta activa para ese hábito.
- `alternarMeta` permite desactivar siempre, pero bloquea reactivar si hay otra activa.
- `eliminarHabito` rechaza si el hábito tiene registros, y elimina sus metas cuando no los tiene.

### 4. Componentes con lógica

`WeekChart` (altura y color según el porcentaje), `AppButton` (no llama a `onPress` cuando está
deshabilitado), `ChipSelector` (marca como seleccionada la opción correcta).

---

## Reglas

- Se prueba **comportamiento y transiciones de estado**, no detalles de implementación.
- Las pruebas son deterministas: sin red real, sin esperas por reloj de pared.
- **Reloj fijo obligatorio** en todo lo que dependa de "hoy":
  `jest.useFakeTimers().setSystemTime(new Date(2026, 8, 17))`. Sin esto, las pruebas de rachas
  fallan de forma intermitente al cambiar de día.
- Preparar, ejecutar, comprobar. Una afirmación lógica por prueba cuando se pueda.
- Se simulan **solo las dependencias directas**. `calcularRacha` no necesita simular nada: es pura.

---

## Nombres

`<unidad>_<condición>_<resultadoEsperado>`

```
calcularRacha_cuandoElTramoSeCorta_congelaLaRachaActual
crearRegistro_cuandoYaExisteEsaFecha_devuelveError
inicioDeSemana_cuandoEsDomingo_devuelveElLunesAnterior
```

---

## Cobertura

| Área | Mínimo |
|------|--------|
| `utils/` | **90 %** |
| Acciones de `AppContext` | 80 % |
| `components/` | Los que tengan lógica |
| `screens/` | Sin mínimo: se cubren con casos manuales |

> La cobertura es un **piso, no una meta**. Una línea cubierta no es un comportamiento probado:
> `calcularRacha` se puede cubrir al 100 % con una sola prueba trivial que no detecta ninguno de
> los once casos de la tabla de arriba.

---

## Pruebas manuales

Los recorridos completos se documentan copiando [`_template-test-case.md`](./_template-test-case.md)
a [`test-cases/`](./test-cases/), y se ejecutan antes de cada release.

| Caso | Qué cubre |
|------|-----------|
| [TC-001](./test-cases/TC-001-registro-duplicado.md) | Rechazo de registro duplicado en la misma fecha |
| [TC-002](./test-cases/TC-002-calculo-de-racha.md) | La racha crece, se corta y conserva la máxima |
| [TC-003](./test-cases/TC-003-eliminar-habito-con-registros.md) | No se elimina un hábito con registros |
| [TC-004](./test-cases/TC-004-meta-activa-unica.md) | Una sola meta activa por hábito |
| [TC-005](./test-cases/TC-005-permisos-por-rol.md) | Permisos por rol (paciente / profesional) |
| [TC-006](./test-cases/TC-006-registro-sin-conexion.md) | Registro sin conexión (S-06) |
| [TC-007](./test-cases/TC-007-editar-registro.md) | Edición de registros, hábitos y metas |
| [TC-008](./test-cases/TC-008-reporte-de-progreso.md) | Reporte de progreso del profesional (M-09) |

---

## En CI

- Tipos (`tsc --noEmit`) y suite de pruebas corren en **cada PR**. El PR no se integra si fallan.
- Los casos manuales se ejecutan antes de etiquetar una release y se registran en la
  [checklist de release](../05-release/_template-release-checklist.md).
