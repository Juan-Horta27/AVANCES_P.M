# ADR-008 — Reconciliación del contrato de API y del modelo de datos

- **ID:** ADR-008
- **Fecha:** 2026-10-25
- **Estado:** Propuesto (pendiente de revisión del equipo)
- **Autores:** Juan José Horta Vanegas, Daniel Felipe Fernandez Rojas — redactado con asistencia de Claude Code

---

## Contexto

Antes de escribir la primera línea del backend se revisó toda la documentación de
`03-api-and-data/`, los ADR y las HU. Los documentos se escribieron en momentos distintos
(HU-01 y HU-02 el 2026-09-06/17; `api-contract.md` y `data-model.md` el 2026-09-25) y **se
contradicen** en puntos que el backend y el cliente necesitan tener resueltos: la URL base,
el nombre de las rutas, la forma de los errores, qué pasa al borrar un hábito, los nombres de
las categorías, las reglas de contraseña y la política de reintentos.

Si no se decide ahora, cada integrante implementará la versión del documento que haya leído,
y la integración (Fase 5 del plan) fallará en lugares difíciles de diagnosticar.

Además, `api-contract.md` §10 y `data-model.md` §11 presentan resultados de pruebas contra un
`hbt-api` y una base PostgreSQL "levantados". **Ese backend no existe todavía** en ningún
repositorio ni rama del proyecto, así que esos resultados no son reproducibles.

**Restricciones conocidas:**
- Stack ya decidido (HU-01): NestJS + Prisma + PostgreSQL + Docker; cliente Expo.
- Equipo de dos personas; el código debe poder explicarse en una sustentación.
- El cliente v1.0.0 ya funciona con datos en memoria y sus pantallas no deberían cambiar al
  conectar el API ([ADR-001](./ADR-001-state-management-pattern.md), [ADR-005](./ADR-005-cliente-http.md)).
- El contrato admite cambios en v1 mientras no exista ningún cliente desplegado contra él.

---

## Decisión

**Decidimos:** tomar [`api-contract.md`](../../../03-api-and-data/api-contract.md) como
**documento canónico del contrato**, con las correcciones que siguen. Cuando otro documento
contradiga una decisión de esta tabla, gana esta tabla. Se numeran a continuación de las
decisiones D-01 a D-06 del contrato.

| # | Tema | Decisión | Fuentes en conflicto |
|---|------|----------|----------------------|
| **D-07** | URL base | `http://<host>:3000/api/v1` en desarrollo (`10.0.2.2` en el emulador de Android); `https://…/api/v1` en producción. El puerto 3001 sin prefijo queda descartado | HU-01 §6, README del código ↔ `api-contract.md` §1 |
| **D-08** | Nombres de recurso | Siempre en **plural**: `/auth`, `/categorias`, `/habitos`, `/metas`, `/registros`. `POST /registro` queda descartado | `endpoint-post-registro.md`, HU-02 ↔ `api-contract.md` E-11 |
| **D-09** | Forma de las respuestas | **Éxito:** el recurso o la colección van directamente en el cuerpo, sin envoltorio. **Error:** RFC 7807 (`application/problem+json`) con `title`, `status`, `detail`, `code` y, en validaciones, `errors`. En NestJS esto lo produce un único filtro global de excepciones; **no** se usa un `ResponseInterceptor` que envuelva los éxitos | ADR-005, HU-01 S-03 ↔ `api-contract.md` §2 |
| **D-10** | Borrar un hábito | **Sin registros:** borrado físico; sus metas se borran en cascada. **Con registros:** baja lógica (`activo = false`), responde `204`. Un hábito archivado no aparece en selectores ni en el dashboard, se muestra como `[Archivado]` en el historial y se reactiva con `PUT /habitos/:id { "activo": true }` | `AppContext`, TC-003, `layers-and-state.md` ↔ `api-contract.md` E-08, `data-model.md` §6 |
| **D-11** | Catálogo de categorías | Los cinco nombres de HU-02, con tildes: **Hidratación, Ejercicio, Alimentación, Sueño, Meditación**. `icono` es un emoji (la app no usa librería de iconos, ver `design-system.md`) | `mockData.ts`, HU-02 ↔ `data-model.md` §1 y §10 |
| **D-12** | Contraseña | **Registro:** mínimo 8 caracteres, con al menos una mayúscula y un número. **Login:** solo se exige que no esté vacía (validar la fortaleza en el login revelaría la política y no protege nada) | `RegisterScreen` (6), contrato de login ↔ contrato E-02 |
| **D-13** | Apellidos | **Opcionales** (columna nula). El cliente deja de rellenar "Sin apellido" | HU-02 §5.1.2 (sin asterisco) ↔ contrato E-02 (obligatorio) |
| **D-14** | Respuesta del registro | `POST /auth/register` responde `201` con `{ token, usuario }`: la sesión empieza de inmediato, como ya hace el cliente | HU-02 Flujo 1 ↔ E-02 ↔ `RegisterScreen` |
| **D-15** | Códigos de conflicto | `409` para todo choque con el estado actual: `DUPLICATE_DAILY_LOG` (registro duplicado), `DUPLICATE_EMAIL`, **`ACTIVE_GOAL_EXISTS`** (segunda meta activa, nuevo) e `IDEMPOTENCY_CONFLICT`. `422 BUSINESS_RULE_VIOLATION` se reserva para valores inválidos según el dominio (por ejemplo, `valorObjetivo <= 0`) | `api-contract.md` §2.1 (ejemplo con 422) ↔ §2.2 (tabla con 409) |
| **D-16** | Reintentos del cliente | Timeout de 10 s en toda petición. **Solo los `GET` se reintentan solos** (3 intentos: inmediato, 1 s, 2 s). Las mutaciones fallidas se muestran al usuario con la acción "Reintentar". Cuando exista la cola offline (S-06), `POST /registros` se encolará y reenviará con el mismo `clienteId` | `api-networking.md`, `endpoint-post-registro.md` ↔ `api-contract.md` §6.3 |
| **D-17** | Idempotencia de registros | `clienteId` (UUID v4) obligatorio en el cuerpo y guardado en `registro_diario.cliente_id` con restricción `UNIQUE`. Mismo `clienteId` y mismo cuerpo → `200` con el registro existente; mismo `clienteId` y cuerpo distinto → `409 IDEMPOTENCY_CONFLICT`. **Sin Redis** y sin cabecera `Idempotency-Key` | `api-contract.md` §6.2 |
| **D-18** | `metaCumplida` | La calcula el servidor al **crear** el registro, contra la meta activa en ese momento, y **queda congelada**. Los registros no se editan en v1.x (la edición es C-04, *Could Have*); cuando se implemente, este punto se revisará en un ADR | `data-model.md` §2.5 ↔ `api-contract.md` §7 |
| **D-19** | Racha en el servidor | **Se calcula al consultar**, a partir de los registros, con el mismo algoritmo que `src/utils/racha.ts`. No hay tabla `racha` en v1.x | HU-01 §5.4, HU-02 §6, `data-model.md` §2.6 |
| **D-20** | Concurrencia | Fuera de alcance en v1.x: el MVP es un usuario en un dispositivo. Sin control optimista por `updatedAt` en hábitos ni metas | `api-contract.md` §7 |
| **D-21** | Sincronización incremental | `updatedSince`, `X-Server-Time` y las marcas de borrado se aplazan a la fase de S-06. Para no tener que migrar después, `registro_diario` gana desde ya la columna `updated_at` | `api-contract.md` §8, `offline-sync.md` |
| **D-22** | Resumen del dashboard | Si se implementa, será `GET /dashboard` y el usuario saldrá del token, como exige D-03. Se descarta `GET /dashboard/usuario/:usuarioId` | `api-contract.md` E-13 ↔ D-03 |
| **D-23** | Pertenencia del registro | `registro_diario` **no** tiene `usuario_id`: pertenece al usuario a través de su hábito. Evita un dato redundante que podría quedar incoherente | HU-02 §6 ↔ `data-model.md` §3 |
| **D-24** | Roles y panel del profesional (M-09) | Sin decidir. **No** se añade `rol` al modelo hasta que se defina el alcance de M-09 (ver HU-02 §5.8) | HU-02 ↔ `data-model.md` |
| **D-26** | Endpoints que faltaban | Se añaden **`PATCH /metas/:id`** (activar o desactivar, con `409 ACTIVE_GOAL_EXISTS` al reactivar) y **`DELETE /registros/:id`**. La app v1.0.0 ya ofrece ambas acciones (`alternarMeta`, `eliminarRegistro`), pero el contrato no las cubría | `AppContext` ↔ `api-contract.md` §5 |
| **D-27** | Fecha futura y zona horaria | `POST /registros` rechaza una fecha posterior a hoy con `422 BUSINESS_RULE_VIOLATION`. "Hoy" se calcula en la zona del centro (`ZONA_HORARIA`, por omisión `America/Bogota`), no en la del servidor: un contenedor corre en UTC, y a las 20:00 de Colombia en UTC ya es el día siguiente. La racha usa el mismo "hoy" | El cliente ya bloquea fechas futuras (`feature-registro-diario.md`); el contrato no lo decía |
| **D-28** | Formas de respuesta | `HabitoSummary` incluye además `descripcion` y `rachaMaxima` (la app ya los muestra; añadir campos no rompe el contrato, §9.2). `metaActiva` es `{ id, habitoId, valorObjetivo, descripcion, activa }` o `null`. Los decimales viajan como números JSON y los textos vacíos como `null` | `api-contract.md` §8.3 ("16 campos" sin definir) |
| **D-25** | Evidencia | Las sondas de `api-contract.md` §10 y las salidas de `data-model.md` §11 pasan a estado **"Pendiente de ejecutar"**. Se volverán a correr contra el backend real y se sustituirán por la salida obtenida | `api-contract.md` §10, `data-model.md` §11 |

### Justificación de las decisiones con más peso

**D-09 — RFC 7807 sin envoltorio de éxito.** El contrato canónico ya lo especifica campo por
campo, con códigos estables (`code`) que el cliente puede usar para decidir. Un envoltorio
`{ data, ... }` en los éxitos no aporta información y obliga a desenvolver cada respuesta.
Lo que S-03 de HU-02 pedía ("respuestas normalizadas") se cumple con el filtro global de
errores: los errores son lo que necesita una forma común.

**D-10 — Archivar en lugar de bloquear.** El objetivo de la regla original era proteger el
historial de salud de la persona. Archivar lo protege igual (los registros no se tocan y la
clave foránea `RESTRICT` sigue impidiendo borrarlos), pero además deja al usuario retirar un
hábito que ya no sigue. Con el bloqueo, un hábito abandonado quedaría para siempre en el
dashboard bajando su porcentaje, sin forma de quitarlo.

**D-19 — Racha calculada.** Guardar la racha en una tabla obliga a mantenerla sincronizada en
cada alta y cada baja de un registro: cualquier camino que lo olvide deja un número falso. Es
la misma regla que el cliente ya sigue ("los datos derivados nunca se guardan",
[`layers-and-state.md`](../../layers-and-state.md)). Al volumen previsto (unos 3.600 registros
por usuario y año, ver [ADR-004](./ADR-004-persistencia-local.md)), calcularla al consultar es
inmediato. Además, el algoritmo ya está cubierto por pruebas en el cliente, y el backend se
probará contra los mismos casos.

**D-16 — Reintentar solo lecturas.** Reintentar una mutación a ciegas puede duplicar datos; la
idempotencia lo evita, pero añade lógica que hay que probar. Para el MVP, reintentar solo lo
que es seguro por definición es más simple de implementar y de explicar.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **`api-contract.md` canónico, con correcciones (elegida)** | Es el documento más reciente y más detallado; define códigos estables y RFC 7807 | Hay que corregir sus inconsistencias internas y quitar lo que sobra (Redis, sondas no reproducibles) | — (elegida) |
| HU-01 / HU-02 como fuente de verdad | Son los documentos aprobados con el tutor | No definen la forma de los errores ni los códigos; habría que inventar todo eso | Insuficientes para implementar |
| Contrato nuevo desde cero | Coherente por construcción | Tira trabajo bueno del equipo y retrasa el backend | Desproporcionado |
| **D-10:** bloquear el borrado (comportamiento v1.0.0) | Ya implementado y probado en TC-003 | El usuario no puede retirar un hábito con historial | Ver justificación |
| **D-19:** tabla `racha` persistida | Lectura sin cálculo | Dato derivado que puede desincronizarse; más código y más pruebas | Ver justificación |
| **D-09:** envoltorio `{ data }` en todos los éxitos | Forma uniforme | Ruido en cada respuesta; el contrato no lo pide | No aporta información |

---

## Consecuencias

**Positivas:**
- El backend (Fases 3 y 4) tiene un único contrato contra el que implementarse y probarse.
- `apiFetch` (Fase 5) sabe exactamente qué forma tienen los éxitos y los errores.
- El modelo pierde una tabla (`racha`) y una columna redundante (`registro_diario.usuario_id`).

**Negativas / Compromisos:**
- **D-10 cambia el comportamiento visible del cliente:** TC-003 y `eliminarHabito` deberán
  actualizarse en la Fase 5. Hasta entonces, la app v1.0.0 sigue bloqueando el borrado.
- **D-12 cambia la validación del registro:** `RegisterScreen` pasa de 6 a 8 caracteres en la Fase 5.
- La sincronización incremental (D-21) y la concurrencia (D-20) quedan explícitamente sin
  resolver para v1.x.

**Impacto en el sistema:**
- Pantallas que cambiarán en la Fase 5: `HabitosScreen` (archivar), `RegisterScreen`
  (contraseña y apellidos), `HistorialScreen` (etiqueta `[Archivado]`).
- Documentos actualizados en el mismo cambio que este ADR: `api-contract.md`, `data-model.md`,
  `api-networking.md`, `endpoint-post-registro.md`, `offline-sync.md`, `HU-01.md` §6.

---

## Referencias

- RFC 7807 — *Problem Details for HTTP APIs*.
- Relacionado con: [ADR-003](./ADR-003-fechas-como-texto-iso.md), [ADR-004](./ADR-004-persistencia-local.md),
  [ADR-005](./ADR-005-cliente-http.md), [ADR-009](./ADR-009-backend-en-repositorio-de-codigo.md).
