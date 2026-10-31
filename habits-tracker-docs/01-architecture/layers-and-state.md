# Capas y Estado

## Las capas en esta app

La app no tiene carpetas llamadas `presentation/`, `domain/` y `data/`, pero **sí tiene las
tres capas**. Están separadas por archivo, no por carpeta:

| Capa | Dónde vive hoy | Responsabilidad |
|------|----------------|-----------------|
| Presentación | `src/screens/` + `src/components/` | Renderizar, mantener el estado del formulario, disparar acciones |
| Dominio | `src/types/` + `src/utils/` + `AppContext.tsx` | Modelos, cálculo de rachas y rangos, cola sin conexión; las **reglas de negocio** las impone la API |
| Datos | `src/services/` (API) y `src/storage/` (token, caché local y cola de pendientes) | De dónde salen y a dónde van los datos |

```
Presentación  ──▶  AppContext (dominio)  ──▶  Datos: services/ (API) · storage/ (token, caché, pendientes)
```

## Reglas de dependencia

- **El dominio no depende hacia afuera.** `utils/date.ts` y `utils/racha.ts` no importan
  React, ni React Native, ni nada de red. Reciben datos y devuelven datos.
- **La presentación nunca toca la fuente de datos.** Ninguna pantalla importa `services/` ni
  `storage/`. Todo pasa por `useApp()`, incluidas las consultas del panel del profesional
  (`listarPacientes`, `obtenerProgreso`), que el contexto expone sin guardarlas.
- **La capa de datos es reemplazable.** Ese es el punto entero de la arquitectura: el
  contrato `AppState` no cambió cuando `mockData.ts` se sustituyó por `fetch` (2026-10-25).

**Comprobación práctica (2026-10-28):** `grep -rn "services/|storage/" src/screens src/components src/navigation`
no devuelve nada. Si una pantalla importara uno de esos módulos, la capa se habría filtrado.

---

## Gestión de estado

**Patrón adoptado: React Context + `useState`, con flujo unidireccional y estado inmutable.**
Registrado en [ADR-001](./decisions/records/ADR-001-state-management-pattern.md).

```
Pantalla  ──(intención: crearRegistro)──▶  AppContext
                                              │
                                 llama a services/ (API)
                                              │
                                    setState inmutable
                                              │
Pantalla  ◀──(estado nuevo + { ok, mensaje })─┘
```

### Reglas

- **Un único proveedor global**, montado en `App.tsx`. No hay contextos anidados por feature.
- **El estado se actualiza siempre de forma inmutable.** Nunca se muta un arreglo:

  ```ts
  setRegistros((previos) => [...previos, nuevo]);          // sí
  setRegistros((previos) => previos.filter(...));          // sí
  registros.push(nuevo);                                    // nunca
  ```

- **Toda escritura pasa por una acción del contexto.** Las pantallas no reciben los `setState`.
- **Los datos derivados nunca se guardan en estado**; se calculan con `useMemo` a partir del
  estado base. `rachas`, `actividadSemanal` y `registrosDeHoy` se derivan de `registros`, y
  por eso no pueden quedar desincronizados.
- **Las acciones que pueden fallar devuelven `{ ok, mensaje? }`**, no lanzan excepciones ni
  muestran alertas. Quien decide cómo comunicar el error es la pantalla.

  ```ts
  crearMeta: (datos) => Promise<{ ok: boolean; mensaje?: string; pendiente?: boolean }>
  ```

- **El estado local del formulario se queda en la pantalla.** Lo que el usuario está
  escribiendo no es estado global; solo lo es el resultado de guardarlo.
- **Las funciones expuestas se envuelven en `useCallback`** y el objeto de valor del
  proveedor en `useMemo`, para no re-renderizar las 5 pestañas en cada pulsación de tecla.
- **El rol decide qué se carga.** Con sesión de `paciente` se descargan, cachean y persisten
  hábitos, metas y registros; con sesión de `profesional` no se carga nada de eso (ADR-011).

---

## Dónde viven las reglas de negocio

Desde la integración con la API (2026-10-25) **la autoridad es el servidor**: el contexto ya no
repite las reglas, sino que traduce sus respuestas en mensajes. Lo que la app sigue calculando
es lo que se puede derivar de los datos que ya tiene:

| Invariante | Quién la impone | Qué hace la app |
|------------|-----------------|-----------------|
| Un único registro por hábito y fecha | API: `@@unique([habitoId, fecha])` → `409` | Muestra el `detail`; en la cola, `encolar` no admite dos pendientes del mismo día |
| Una sola meta activa por hábito | API: `MetasService` → `409` | Muestra el `detail` |
| Un hábito con registros se archiva, no se borra | API: `HabitosService` (D-10) | Vuelve a pedir la lista y explica qué pasó |
| `metaCumplida = valorRegistrado >= meta.valorObjetivo` | API al crear y al editar el valor (D-18) | Usa el valor que devuelve el servidor |
| Cada rol solo usa sus rutas | API: `RolesGuard` → `403` | `AppNavigator` monta solo las rutas del rol |
| Racha actual y máxima a partir del historial | API y app, mismo algoritmo (`racha.ts`) | La recalcula al instante tras registrar, editar o eliminar |
| Adherencia del profesional | API: `ReportesService` | Solo la muestra |

> **Nota de diseño importante:** la racha es un **valor derivado**, no una tabla, tanto en el
> cliente como en el servidor. HU-02 la modelaba como entidad 1:1 con `Habito` persistida por el
> backend; [ADR-008](./decisions/records/ADR-008-reconciliacion-contrato-api.md) (D-19) lo cambió:
> el backend la calcula al consultar con el mismo algoritmo que `calcularRacha()`. Ambos cálculos
> deben dar el mismo número; cuando exista el API, el valor del servidor es la fuente de verdad y
> el cálculo del cliente se conserva para que la racha cambie en pantalla sin volver a pedir la lista.

---

## Acciones expuestas hoy (2026-10-28)

| Grupo | Acciones |
|-------|----------|
| Sesión | `iniciarSesion`, `crearCuenta`, `cerrarSesion` |
| Carga y conexión | `recargarDatos`, `reintentarConexion`; estado `cargandoDatos`, `errorDatos`, `sinConexion`, `sincronizado` |
| Hábitos | `crearHabito`, `editarHabito`, `eliminarHabito` |
| Metas | `crearMeta`, `editarMeta`, `alternarMeta`, `eliminarMeta` |
| Registros | `crearRegistro` (encola sin red), `editarRegistro`, `eliminarRegistro` |
| Cola sin conexión (S-06) | estado `pendientes`, `avisoPendientes`; `descartarAvisoPendientes` |
| Panel del profesional | `listarPacientes`, `obtenerProgreso` (sin caché) |
| Consultas | `habitoPorId`, `categoriaPorId`, `metaActivaDe`, `rachaDe` |
| Derivados | `habitosActivos`, `rachas`, `actividadSemanal`, `registrosDeHoy` |

Todas las acciones devuelven `Respuesta` (`{ ok, mensaje?, pendiente? }`): la pantalla solo
muestra el mensaje y decide si cierra su ventana.
