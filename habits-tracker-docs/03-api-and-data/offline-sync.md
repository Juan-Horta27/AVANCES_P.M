# Offline y Sincronización

> **Estado (2026-10-28): cola de registros sin conexión implementada (S-06,
> [ADR-011](../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md)).** Crear un
> registro diario funciona sin red: queda en una cola local y se sube solo al volver la conexión.
> El resto de escrituras exige red. La sincronización incremental (`updatedSince`) sigue aplazada
> (ADR-008, D-21). Código: `src/storage/pendientes.ts` y la sección "cola sin conexión" de
> `src/context/AppContext.tsx`, en `habits-tracker-app`.

---

## Estrategia por entidad

| Feature / Entidad | Estrategia | Soporte offline |
| :--- | :--- | :--- |
| **Registro diario (crear)** | **Cola local con `clienteId`** | Funciona sin conexión; se encola en `hst:v1:pendientes` y se reenvía solo |
| **Registro diario (editar / eliminar)** | En línea | Exige red; sin red se muestra el error con "Reintentar" (D-16) |
| **Registro diario (listar)** | Caché local (solo en el teléfono) | Se ve lo último descargado; la lista completa se vuelve a pedir al recuperar la red |
| **Hábitos** | Caché de lectura, mutación en línea | Crear, editar o eliminar un hábito exige red |
| **Metas** | Caché de lectura, mutación en línea | Crear, editar, activar o eliminar una meta exige red |
| **Categorías** | Catálogo estático | En la caché junto al resto del dominio |
| **Panel del profesional** | Solo en línea | Sin caché ni cola: siempre muestra los datos del servidor |
| **Autenticación** | Solo en línea | Requiere conexión activa con el servidor |

> La **caché** (`cache.ts`) solo se usa en Android e iOS, porque en la web `localStorage` no está
> cifrado y guardaría el perfil. La **cola** sí funciona también en la web: guarda solo hábito,
> fecha, valor, notas y `clienteId`, nunca el perfil (ver [persistence.md](./persistence.md)).

---

## Cola de registros pendientes (S-06)

### Cuándo entra un registro en la cola

`crearRegistro` genera primero el `clienteId` (UUID v4, `expo-crypto`) y llama a `POST /registros`.

| Resultado de la llamada | Qué hace la app |
| :--- | :--- |
| `201` / `200` | Guarda el registro en la lista y muestra "Registro guardado…" |
| Error **con** código HTTP (`409`, `422`, `404`...) | Es una regla de negocio: muestra el `detail` y **no** encola |
| **Sin respuesta** (sin red, servidor caído, tiempo agotado) | Encola `{ habitoId, fecha, valorRegistrado, notas, clienteId }` y responde *"Sin conexión: el registro quedó pendiente y se subirá solo al recuperar la conexión."* |

Si ya hay un pendiente para el mismo hábito y fecha, no se encola otro: *"Ya tienes un registro
pendiente de subir para este hábito en esa fecha."*

### Dónde se guarda

- Clave `hst:v1:pendientes` de `AsyncStorage`, con la forma `{ usuarioId, registros: [...] }`.
- Al iniciar o restaurar sesión se lee la cola **solo si es de la misma persona**; si es de otra
  cuenta o está corrupta, se descarta. Así nunca se suben registros bajo la cuenta equivocada.
- Al cerrar sesión se borra. Si hay pendientes, la app avisa antes: *"Tienes N registro(s) sin
  subir. Si sales ahora se perderán. ¿Salir de todas formas?"*

### Cuándo se reenvía

1. Después de cada carga correcta de datos (al iniciar sesión, al arrancar con sesión guardada o
   al pulsar **Reintentar conexión** en la franja "Sin conexión").
2. Cada **15 segundos** mientras haya pendientes (`INTERVALO_REENVIO_MS`), solo para el rol `paciente`.

El envío es **en orden y de uno en uno**, con el mismo `clienteId` de cuando se encoló. Si una
petición vuelve a quedarse sin respuesta, se detiene y se reintenta en la siguiente ocasión. Al
terminar, se quitan de la cola **solo** los pendientes procesados: si entró uno nuevo durante el
envío, se conserva.

### Desduplicación

Si el primer intento sí llegó al servidor pero la respuesta se perdió, el reenvío con el mismo
`clienteId` devuelve `200 OK` con el registro que ya existía (idempotencia, ADR-008, D-17;
[api-contract.md §6](./api-contract.md#6-idempotencia-y-reintentos)). El registro no se duplica.

### Conflictos: gana el servidor

| Respuesta al reenviar | Política | Qué ve la persona |
| :--- | :--- | :--- |
| `409 DUPLICATE_DAILY_LOG` (ese día ya tenía registro, por ejemplo desde otro dispositivo) | **Gana el servidor**: el pendiente se descarta | *"Ya existía un registro sincronizado para este hábito en esa fecha. Se mantuvo el registro del servidor."* |
| Otro error con código (`404` hábito eliminado, `422` fecha futura...) | **Gana el servidor**: el pendiente se descarta | *"No se pudo subir un registro pendiente: "* + el `detail` del servidor |

### Qué se ve en la interfaz

- **Nuevo registro:** el mensaje de éxito lleva ⏳ en vez de ✅ cuando quedó pendiente.
- **Franja "Sin conexión"** (`AvisoSinConexion`): cuenta los pendientes ("1 registro pendiente") y
  ofrece **Reintentar conexión**.
- **Registros:** los pendientes aparecen arriba, con borde punteado y el texto "Pendiente de subir";
  el subtítulo suma "· N pendientes de subir".
- **Inicio:** "Cerrar sesión" advierte si hay pendientes.

### Cómo se probó

- Pruebas unitarias: `src/storage/pendientes.test.ts` (6) y el bloque S-06 de
  `src/context/AppContext.test.tsx` (6: encolar sin red, no encolar ante un error de negocio, no
  duplicar pendientes, reenviar al volver la red, descartar con aviso ante `409`, borrar al salir).
- Prueba de punta a punta en el navegador (2026-10-28): con la red del navegador cortada, se
  registró "Caminar"; apareció como pendiente en la franja y en Registros; al devolver la red y
  pulsar "Reintentar conexión" se subió y desapareció el aviso. También se comprobó el conflicto
  `409` (gana el servidor, con el aviso) y el aviso al cerrar sesión con pendientes. Los pasos para
  repetirlo a mano están en el manual de implementación (`habits-tracker-infra/README.md`).

---

## Sincronización incremental y marcas de borrado (aplazada, D-21)

Lo que sigue es el diseño acordado para cuando se implemente; **hoy no existe** en la API ni en la app.

1. **Punto de corte autoritativo (`serverTime`):**
   - El cliente solicita cambios enviando `updatedSince=<instante_utc>`.
   - La respuesta del servidor incluye el nuevo timestamp de corte en la cabecera `X-Server-Time` y el cuerpo JSON.
   - El cliente almacena ese valor exacto. **Nunca se usa la hora del reloj del teléfono móvil** para solicitar incrementales ([`api-contract.md §8.1`](./api-contract.md#81-soporte-para-sincronizacion-incremental)).
2. **Propagación de bajas (lápidas):**
   - Los registros o hábitos dados de baja viajan en la carga incremental con la marca `activo: false` o `deletedAt: "..."`.
   - El cliente móvil procesa estas marcas para purgar o archivar elementos en su base local `AsyncStorage`.

Mientras tanto, la app descarga la lista completa al iniciar sesión y al recuperar la conexión.
