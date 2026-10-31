# Contrato de API — Healthy Habits Tracker

Qué es este documento: la forma exacta de cada petición y de cada respuesta.  
Si al implementar hay que elegir entre dos formas y esto no lo dice, es un fallo de este documento.

> **Estado (2026-10-25):** documento **canónico** del contrato, con las correcciones de
> [ADR-008](../01-architecture/decisions/records/ADR-008-reconciliacion-contrato-api.md). Si otro
> documento lo contradice, gana este. El backend existe en `backend/` del repositorio de código; las
> sondas de la sección 10 se ejecutaron contra él (2026-10-25) y la auditoría E2E del 2026-10-26 volvió
> a comprobar el contrato, incluido el `413` de la sección 1.
>
> **Actualización (2026-10-28, [ADR-010](../01-architecture/decisions/records/ADR-010-separacion-en-cuatro-repositorios.md) y
> [ADR-011](../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md)):** el backend vive ahora en su
> propio repositorio, `habits-tracker-api`. Se añadieron los roles (`paciente` y `profesional`, código
> `FORBIDDEN_ROLE`), la edición completa de metas y registros (E-10b ampliado, E-10c, E-12c), la lista de
> pacientes (E-15) y el reporte de progreso (E-16). Todos se comprobaron con las pruebas e2e y con la colección
> Postman del repositorio de la API (sección 10).

---

## 1. Convenciones comunes

| Aspecto | Qué hay que decidir | Decisión acordada para Healthy Habits Tracker |
| :--- | :--- | :--- |
| **Base** | La URL base por ambiente: desarrollo y producción | **Desarrollo:** `http://localhost:3000/api/v1` (en emulador Android: `http://10.0.2.2:3000/api/v1`)<br>**Producción:** `https://api.healthyhabits.com/api/v1` |
| **Transporte** | HTTPS y excepciones en desarrollo | **Producción:** HTTPS obligatorio con TLS 1.3.<br>**Desarrollo:** HTTP permitido únicamente sobre `localhost` y red local de depuración. |
| **Formato** | Codificación y formato de intercambio | `application/json; charset=utf-8` para todas las peticiones con cuerpo y respuestas. |
| **Nombres de campo** | Notación de propiedades JSON | **camelCase** estricto tanto en peticiones entrantes como en respuestas salientes, sin excepciones. |
| **Autenticación** | Cabecera y endpoints anónimos | `Authorization: Bearer <token_jwt>`.<br>**Endpoints anónimos:** únicamente `POST /auth/login` y `POST /auth/register`. Todo lo demás exige token válido.<br>**Roles (ADR-011):** el token lleva el rol (`paciente` o `profesional`). Hábitos, metas y registros son del `paciente`; la lista de pacientes y el reporte de progreso son del `profesional`; `/categorias` y `/usuarios/me` son de ambos. Un rol que llama a una ruta del otro recibe `403 FORBIDDEN_ROLE`. |
| **Identificadores** | Tipo y forma de los IDs | Enteros numéricos positivos en JSON (`number`), correspondientes a secuencias en BD. Validado con `IsInt()`, `Min(1)`. |
| **Importes y moneda** | Tipo, decimales y divisa | **No aplica en esta versión:** la aplicación no maneja transacciones monetarias ni pasarelas de pago. Declarado formalmente: si en el futuro se incorporan cobros, viajará `numeric(10,2)` y código `COP`. |
| **Fechas** | Formato y zona horaria | **Timestamps de auditoría:** ISO 8601 con desplazamiento explícito (`YYYY-MM-DDTHH:mm:ss-05:00`).<br>**Fechas de calendario diario:** Cadena de texto pura en formato `YYYY-MM-DD` sin hora. Nunca una fecha sin zona. |
| **Idioma de los mensajes** | Idioma de cara al usuario | **Español de Colombia (`es-CO`)**. Los textos de `detail` se redactan en lenguaje claro, respetuoso y sin tecnicismos de base de datos. |
| **Tamaño máximo de petición** | Límite en bytes y código | **10 Megabytes (10,485,760 bytes)**. Si se supera, el servidor rechaza inmediatamente con código HTTP **`413 Payload Too Large`** y cuerpo problem+json. |

---

## 2. La forma del error

### 2.1 El cuerpo, campo por campo

Todos los errores devueltos por el servidor con código `4xx` tienen una única forma canónica conforme a **RFC 7807 (`application/problem+json`)**:

```json
{
  "title": "Conflicto con el estado actual",
  "status": 409,
  "detail": "Ya existe un registro para este hábito en la fecha indicada.",
  "code": "DUPLICATE_DAILY_LOG",
  "errors": {
    "fecha": ["La fecha ya fue registrada para este hábito."]
  }
}
```

| Campo | Obligatorio | Para quién | Significado |
| :--- | :--- | :--- | :--- |
| `title` | **Sí** | Registros / Telemetría | Título breve de la categoría del error HTTP (ej. "Error de validación", "Conflicto de estado"). |
| `status` | **Sí** | Máquina / Depuración | Entero que replica exactamente el código de estado HTTP del encabezado. |
| `detail` | **Sí, siempre** | **Persona usuaria** | Frase explicativa y amigable en español que la pantalla móvil muestra en un banner o toast. |
| `code` | **Sí** | **Aplicación móvil** | Clave alfanumérica fija en mayúsculas sostenidas que la app usa para tomar decisiones condicionales en el código. |
| `errors` | Solo en validaciones (400 / 422) | Formulario móvil | Mapa clave-valor donde la clave es el nombre de la propiedad y el valor es un arreglo con las razones del fallo. |

### 2.2 Códigos estables para la app

| Código estable (`code`) | Código HTTP | Cuándo se devuelve | Qué debe hacer la aplicación móvil |
| :--- | :--- | :--- | :--- |
| `INVALID_CREDENTIALS` | 401 | Credenciales de login erróneas | Resaltar campos de correo/contraseña y ofrecer recuperación |
| `TOKEN_EXPIRED` | 401 | El token JWT ha caducado (`detail`: *"Tu sesión expiró. Inicia sesión de nuevo."*) | Purgar sesión segura y redirigir limpiamente a pantalla de Login |
| `UNAUTHORIZED` | 401 | Petición a endpoint protegido sin cabecera `Authorization` | Redirigir a Login |
| `FORBIDDEN_RESOURCE` | 403 | El recurso solicitado pertenece a otro usuario | Mostrar alerta: "No tienes permiso para acceder a este recurso" |
| `FORBIDDEN_ROLE` | 403 | El rol del token no tiene permiso sobre esa ruta (ADR-011) | Mostrar el `detail`; es un defecto de navegación, porque la app solo muestra a cada rol sus pantallas |
| `PATIENT_NOT_FOUND` | 404 | `GET /reportes/progreso` con un `usuarioId` que no existe o no es paciente | Volver a la lista de pacientes y refrescarla |
| `HABIT_NOT_FOUND` | 404 | El ID del hábito no existe o está archivado | Refrescar listado local de hábitos |
| `DUPLICATE_DAILY_LOG` | 409 | Ya existe un registro para el par `(habitoId, fecha)` | Marcar el hábito como ya completado hoy y actualizar UI |
| `DUPLICATE_EMAIL` | 409 | El correo ya está registrado | Mostrar el mensaje junto al campo de correo |
| `ACTIVE_GOAL_EXISTS` | 409 | El hábito ya tiene una meta activa (al crear o al reactivar una meta) | Mostrar el `detail`; la meta no se crea ni se activa |
| `IDEMPOTENCY_CONFLICT` | 409 | Mismo `clienteId` con un cuerpo distinto al del primer intento | Descartar el registro pendiente e informar al usuario |
| `CATEGORY_NOT_FOUND` | 404 | La categoría indicada no existe | Refrescar el catálogo |
| `GOAL_NOT_FOUND` | 404 | La meta no existe o es de otra persona (`PATCH` y `DELETE /metas/:id`) | Refrescar la lista de metas |
| `DAILY_LOG_NOT_FOUND` | 404 | El registro no existe o es de otra persona (`PUT` y `DELETE /registros/:id`) | Quitarlo de la lista local |
| `ROUTE_NOT_FOUND` | 404 | La ruta no existe | Defecto del cliente: revisar la URL |
| `VALIDATION_FAILED` | 400 | JSON mal formado, tipos de datos inválidos o una edición sin ningún campo | Mostrar errores debajo de cada campo del formulario |
| `BUSINESS_RULE_VIOLATION` | 422 | Regla de dominio incumplida (ej. valor objetivo menor o igual a 0) | Mostrar mensaje literal de `detail` en modal o toast de alerta |
| `PAYLOAD_TOO_LARGE` | 413 | El cuerpo supera 10 MB (sección 1); `detail`: *"La petición supera el tamaño máximo permitido."* | Defecto del cliente: la app nunca envía cuerpos tan grandes |
| `INTERNAL_ERROR` | 500 | Error no controlado; `detail`: *"Ocurrió un error inesperado. Intenta de nuevo más tarde."* (no expone el error real) | Mostrar el `detail`; es un defecto a reportar (regla de oro de la sección 3) |
| `HTTP_ERROR` | Otro 4xx | Respaldo del filtro global para un estado sin código propio (p. ej. 405) | Mostrar el `detail` |

### 2.3 Los errores sin cuerpo

- **`401 Unauthorized` por socket cortado o token malformado a nivel de gateway:** Puede responder cuerpo vacío con longitud 0. El cliente HTTP (`apiFetch`) captura el código 401 sin intentar deserializar JSON y transiciona a cierre de sesión.
- **`204 No Content`:** Respuestas exitosas de mutaciones sin retorno (ej. `DELETE /habitos/:id`) devuelven cuerpo vacío.

---

## 3. Catálogo de códigos de estado

| Código | Cuándo se usa | Cuándo NO se usa |
| :--- | :--- | :--- |
| **`200 OK`** | Operación exitosa de lectura (`GET`), actualización (`PUT`), o mutación idempotente con retorno. | Nunca para creaciones exitosas de nuevos recursos. |
| **`201 Created`** | Creación exitosa de un recurso (`POST /habitos`, `POST /registros`). Devuelve el recurso creado con su ID. | Nunca para actualizaciones ni operaciones sin nuevo identificador. |
| **`204 No Content`** | Eliminación física o archivado exitoso sin carga útil de retorno (`DELETE /habitos/:id`). | Si hay algún dato que deba viajar al cliente. |
| **`400 Bad Request`** | La petición no se pudo interpretar, tipos equivocados (ej. `page=abc`) o JSON mal formado sintácticamente ("no te entendí"). | Para infracción de reglas lógicas o semánticas del negocio. |
| **`401 Unauthorized`** | No hay credencial provista, el token es inválido o expiró. | Si la credencial es válida pero no tiene privilegios suficientes. |
| **`403 Forbidden`** | La credencial es válida pero el recurso pertenece a otro usuario (`FORBIDDEN_RESOURCE`) o el rol no tiene permiso sobre la ruta (`FORBIDDEN_ROLE`). | Si el recurso simplemente no existe en la base de datos. |
| **`404 Not Found`** | La ruta o el identificador del recurso no existe en el sistema. | Para campos faltantes dentro del cuerpo de la petición. |
| **`409 Conflict`** | Conflicto con el estado actual del servidor (ej. violación de unicidad `@@unique([habitoId, fecha])`). | Para errores de sintaxis o tipos inválidos. |
| **`422 Unprocessable`**| La sintaxis del JSON es perfecta pero viola una regla de negocio del modelo ("te entendí pero está prohibido"). | Para JSON mal formado o con campos de tipo erróneo. |

> **Regla de oro sobre errores 500:** Ningún error documentado en este contrato es un `500 Internal Server Error`. Si un endpoint devuelve 500, se considera un **defecto de programación no controlado** en el backend y debe reportarse como bug crítico.

---

## 4. Decisiones cerradas

| Identificador | Decisión cerrada | Razón técnica irrefutable |
| :--- | :--- | :--- |
| **D-01** | Fechas de registro diario como cadena exacta `YYYY-MM-DD` | Evita que desfases de zona horaria (UTC vs UTC-5) alteren el día de cumplimiento al cruzar medianoches. |
| **D-02** | `metaCumplida` es calculado y congelado exclusivamente por el servidor | Evita que el cliente móvil altere su historial o mienta sobre su porcentaje de éxito; el backend tiene la verdad histórica. |
| **D-03** | `usuarioId` nunca viaja en el cuerpo de una petición de mutación | Previene agujeros de seguridad donde un cliente suplante a otro usuario; el ID se extrae directamente de la firma criptográfica del JWT. |
| **D-04** | Formato de error estandarizado RFC 7807 | Unifica la deserialización en el cliente móvil, evitando que caídas por errores inesperados muestren pantallas en blanco. |
| **D-05** | Las respuestas de colecciones vacías devuelven un arreglo `[]`, nunca `null` | Previene excepciones `TypeError: Cannot read property 'map' of null` en componentes de React Native. |
| **D-06** | Respuesta 401 unificada en login ("Credenciales incorrectas") | Evita enumeración maliciosa de cuentas de correo de usuarios registrados. |

> Las decisiones **D-07 a D-28** (URL base, rutas en plural, éxitos sin envoltorio, baja lógica de
> hábitos, catálogo, contraseñas, códigos 409, reintentos, idempotencia, racha calculada y lo que
> queda aplazado) están en [ADR-008](../01-architecture/decisions/records/ADR-008-reconciliacion-contrato-api.md).

---

## 5. Fichas de endpoint

### E-01 · POST /auth/login
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Anónimo (público) |
| **Idempotente** | No |

**Parámetros de ruta:** Ninguno.  
**Parámetros de consulta:** Ninguno.

**Petición (`application/json`):**
| Campo | Tipo | Obligatorio | Reglas |
| :--- | :--- | :--- | :--- |
| `correo` | `string` | Sí | Formato de email válido, recortado de espacios y en minúsculas. |
| `contrasena` | `string` | Sí | Texto plano no vacío. La fortaleza solo se valida al registrarse (ADR-008, D-12). |

**Respuesta de éxito (`200 OK`):**
| Campo | Tipo | Nulo | Qué es |
| :--- | :--- | :--- | :--- |
| `token` | `string` | No | Token JWT firmado con duración de 24 horas (1440 minutos). |
| `usuario` | `object` | No | Objeto de perfil del usuario autenticado. |
| `usuario.id` | `integer` | No | ID del usuario en BD. |
| `usuario.nombres` | `string` | No | Nombres de pila registrados. |
| `usuario.apellidos` | `string` | Sí | Apellidos registrados, o nulo si no se dieron. |
| `usuario.correo` | `string` | No | Correo de la cuenta. |
| `usuario.edad` | `integer` | Sí | Edad en años o nulo. |
| `usuario.peso` | `number` | Sí | Peso corporal en kg o nulo. |
| `usuario.estatura` | `number` | Sí | Estatura en metros o nulo. |
| `usuario.rol` | `string` | No | `"paciente"` o `"profesional"` (ADR-011). El token lleva el mismo rol en su contenido (`{ sub, rol }`). |

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `400` | Campos ausentes o correo mal formado | `VALIDATION_FAILED` | `"El correo y la contraseña son obligatorios y deben ser válidos."` |
| `401` | Correo no registrado o contraseña inválida | `INVALID_CREDENTIALS` | `"Credenciales incorrectas."` |

**Notas:**
- **Orden de comprobación:** 1. Campos obligatorios; 2. Formato de correo; 3. Verificación de hash en servidor.
- **Atributos que NO tiene:** No incluye contraseñas ni marcas de auditoría.

---

### E-02 · POST /auth/register
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Anónimo (público) |
| **Idempotente** | No |

**Petición (`application/json`):**
| Campo | Tipo | Obligatorio | Reglas |
| :--- | :--- | :--- | :--- |
| `nombres` | `string` | Sí | Longitud entre 2 y 100 caracteres. |
| `apellidos` | `string` | No | Si se envía, longitud entre 2 y 100 caracteres (ADR-008, D-13). |
| `correo` | `string` | Sí | Formato de email válido, minúsculas. |
| `contrasena` | `string` | Sí | Mínimo 8 caracteres, al menos un número y una mayúscula. |
| `edad` | `integer` | No | Rango 12 a 120 años. |
| `peso` | `number` | No | Decimal entre 20.0 y 350.0 kg. |
| `estatura` | `number` | No | Decimal entre 0.80 y 2.50 m. |

**Respuesta de éxito (`201 Created`):**
| Campo | Tipo | Nulo | Qué es |
| :--- | :--- | :--- | :--- |
| `token` | `string` | No | Token JWT para sesión inmediata. |
| `usuario` | `object` | No | Perfil creado en BD con ID generado, con `rol: "paciente"`. |

> **Rol (ADR-011):** quien se registra desde la app siempre es `paciente`; la petición no acepta `rol`
> (sería un campo desconocido, `400`). Las cuentas `profesional` las crea el centro; en desarrollo hay una
> de prueba en los datos semilla (ver el README de `habits-tracker-api`).

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `400` | Campos requeridos faltantes | `VALIDATION_FAILED` | `"Datos de registro incompletos o inválidos."` |
| `409` | El correo ya se encuentra registrado | `DUPLICATE_EMAIL` | `"El correo electrónico ya se encuentra registrado en la plataforma."` |

---

### E-03 · GET /categorias
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado (`Authorization: Bearer <token>`) |
| **Idempotente** | Sí |

**Respuesta de éxito (`200 OK`):**
Devuelve arreglo `Array<CategoriaHabito>` (`id`, `nombre`, `descripcion`, `icono`).

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `401` | Token no enviado o vencido | `UNAUTHORIZED` | `"No autorizado. Sesión inválida o expirada."` |

---

### E-04 · GET /habitos
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

**Parámetros de consulta:**
| Nombre | Tipo | Obligatorio | Por omisión | Notas |
| :--- | :--- | :--- | :--- | :--- |
| `activos` | `boolean` | No | `true` | Si es `true`, filtra solo hábitos no archivados. Si es `false`, incluye archivados. |

**Respuesta de éxito (`200 OK`):** Arreglo de objetos `HabitoSummary` (`id`, `categoriaHabitoId`, `nombre`, `unidadMedida`, `frecuencia`, `activo`, `rachaActual`, `metaActiva`).

---

### E-05 · POST /habitos
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | No |

**Petición (`application/json`):**
| Campo | Tipo | Obligatorio | Reglas |
| :--- | :--- | :--- | :--- |
| `categoriaHabitoId` | `integer` | Sí | Debe existir en catálogo. |
| `nombre` | `string` | Sí | Longitud entre 2 y 100 caracteres. |
| `descripcion` | `string` | No | Longitud máx 300 caracteres. |
| `unidadMedida` | `string` | Sí | Longitud entre 1 y 30 caracteres. |
| `frecuencia` | `string` | No | 'diaria' o 'semanal'. Por omisión 'diaria'. |
| `metaInicial` | `object` | No | Objeto opcional con `valorObjetivo > 0`. |

**Respuesta de éxito (`201 Created`):** Objeto `Habito` creado con sus relaciones.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `400` | Campos obligatorios faltantes | `VALIDATION_FAILED` | `"Faltan datos obligatorios para crear el hábito."` |
| `404` | Categoría no existe | `CATEGORY_NOT_FOUND` | `"La categoría seleccionada no existe."` |
| `422` | Meta inicial menor o igual a 0 | `BUSINESS_RULE_VIOLATION` | `"El valor objetivo de la meta debe ser mayor que cero."` |

---

### E-06 · GET /habitos/:id
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

**Parámetros de ruta:** `id` (`integer`, mayor a 0).  
**Respuesta de éxito (`200 OK`):** Objeto completo `HabitoDetail`.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `401` | Token no válido | `UNAUTHORIZED` | `"No autorizado. Sesión inválida o expirada."` |
| `403` | Pertenece a otra cuenta | `FORBIDDEN_RESOURCE` | `"No tienes permiso para acceder a este hábito."` |
| `404` | No encontrado | `HABIT_NOT_FOUND` | `"El hábito solicitado no fue encontrado."` |

---

### E-07 · PUT /habitos/:id
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

**Parámetros de ruta:** `id` (`integer`).  
**Petición (`application/json`):** Campos opcionales a modificar (`nombre`, `descripcion`, `unidadMedida`, `frecuencia`, `activo`).  
**Respuesta de éxito (`200 OK`):** Objeto `Habito` modificado.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `400` | Tipos erróneos | `VALIDATION_FAILED` | `"Datos de actualización inválidos."` |
| `403` | Pertenece a otro usuario | `FORBIDDEN_RESOURCE` | `"No tienes permiso para modificar este hábito."` |
| `404` | No encontrado | `HABIT_NOT_FOUND` | `"El hábito solicitado no fue encontrado."` |

---

### E-08 · DELETE /habitos/:id
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

**Parámetros de ruta:** `id` (`integer`).  
**Comportamiento de negocio:** Si tiene registros históricos, se ejecuta **baja lógica** (`activo = false`). Si no tiene registros, eliminación física, y sus metas se eliminan en cascada (ADR-008, D-10).  
**Respuesta de éxito (`204 No Content`):** Sin cuerpo.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `403` | Pertenece a otro usuario | `FORBIDDEN_RESOURCE` | `"No tienes permiso para eliminar este hábito."` |
| `404` | No existe | `HABIT_NOT_FOUND` | `"El hábito no existe."` |

---

### E-09 · GET /metas
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

**Parámetros de consulta:** `habitoId` (opcional), `activas` (`1` o `0`).  
**Respuesta de éxito (`200 OK`):** Arreglo de metas `Array<Meta>`.

---

### E-10 · POST /metas
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | No |

**Petición (`application/json`):** `habitoId` (`integer`), `valorObjetivo` (`number > 0`), `descripcion` (opcional).  
**Respuesta de éxito (`201 Created`):** Objeto `Meta` creado.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `404` | Hábito no encontrado o ajeno | `HABIT_NOT_FOUND` | `"El hábito especificado no existe o no te pertenece."` |
| `409` | El hábito ya tiene una meta activa | `ACTIVE_GOAL_EXISTS` | `"Este hábito ya tiene una meta activa. Desactívala antes de crear otra."` |
| `422` | `valorObjetivo` menor o igual a cero | `BUSINESS_RULE_VIOLATION` | `"El valor objetivo de la meta debe ser mayor que cero."` |

---

### E-10b · PATCH /metas/:id
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

> Añadido por ADR-008 (D-26) para activar y desactivar metas. **Ampliado por ADR-011 (2026-10-28):** también
> edita el valor objetivo y la descripción (M-05, "editar metas").

**Parámetros de ruta:** `id` (`integer`).
**Petición (`application/json`):** al menos uno de estos campos; los que no viajan no cambian.

| Campo | Tipo | Reglas |
| :--- | :--- | :--- |
| `activa` | `boolean` | Reactivar exige que el hábito no tenga otra meta activa. |
| `valorObjetivo` | `number` | Mayor que cero (422 si no), máximo 2 decimales. |
| `descripcion` | `string \| null` | Máx 300 caracteres. Vacía o solo espacios se guarda como `null`. |

**Respuesta de éxito (`200 OK`):** Objeto `Meta` actualizado.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `400` | Cuerpo sin ningún campo | `VALIDATION_FAILED` | `"Indica qué quieres cambiar de la meta."` |
| `400` | Tipos inválidos o campos desconocidos | `VALIDATION_FAILED` | `"Los datos de la meta no son válidos."` |
| `422` | `valorObjetivo` menor o igual a cero | `BUSINESS_RULE_VIOLATION` | `"El valor objetivo de la meta debe ser mayor que cero."` |
| `404` | Meta inexistente o de un hábito ajeno | `GOAL_NOT_FOUND` | `"La meta indicada no existe."` |
| `409` | Se intenta activar y el hábito ya tiene otra meta activa | `ACTIVE_GOAL_EXISTS` | `"Ya hay otra meta activa para este hábito. Desactívala primero."` |

**Notas:** desactivar siempre está permitido. La regla de meta activa única se valida **al crear y al reactivar** (TC-004).
Cambiar el valor objetivo **no** recalcula `metaCumplida` de los registros ya guardados: ese dato queda congelado al registrar (D-02).

---

### E-10c · DELETE /metas/:id
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

> Añadido por ADR-011 (2026-10-28): M-05 pide "crear, editar y eliminar metas".

**Parámetros de ruta:** `id` (`integer`).
**Comportamiento de negocio:** eliminación física de la meta. Los registros no dependen de la meta: su `metaCumplida` ya quedó guardado, así que el historial no cambia.
**Respuesta de éxito (`204 No Content`):** Sin cuerpo.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `404` | Meta inexistente o de un hábito ajeno | `GOAL_NOT_FOUND` | `"La meta indicada no existe."` |

---

### E-11 · POST /registros
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Con `clienteId` o cabecera `Idempotency-Key` |

**Petición (`application/json`):**
| Campo | Tipo | Obligatorio | Reglas |
| :--- | :--- | :--- | :--- |
| `habitoId` | `integer` | Sí | Hábito existente del usuario autenticado. |
| `fecha` | `string` | Sí | Formato exacto `YYYY-MM-DD`. |
| `valorRegistrado` | `number` | Sí | Decimal mayor o igual a 0. |
| `notas` | `string` | No | Máx 500 caracteres. |
| `clienteId` | `string` | Sí | UUID v4 generado por el cliente. |

**Respuesta de éxito (`201 Created` / `200 OK` en reintento idempotente):**
`{ "id": 42, "habitoId": 1, "fecha": "2026-09-25", "valorRegistrado": 8.0, "metaCumplida": true, "notas": "..." }`

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `400` | Formato inválido de fecha o valor < 0 | `VALIDATION_FAILED` | `"La fecha debe tener formato YYYY-MM-DD y el valor registrado no puede ser negativo."` |
| `403` | Hábito ajeno | `FORBIDDEN_RESOURCE` | `"No tienes permiso para registrar progreso en este hábito."` |
| `404` | Hábito no existe o archivado | `HABIT_NOT_FOUND` | `"El hábito indicado no está disponible."` |
| `409` | Ya existe registro para ese hábito en esa fecha | `DUPLICATE_DAILY_LOG` | `"Ya existe un registro para este hábito en la fecha indicada."` |
| `409` | Mismo `clienteId` con otro cuerpo, o de otra persona | `IDEMPOTENCY_CONFLICT` | `"Conflicto de clave de idempotencia: el cuerpo de la petición difiere del intento original."` |
| `422` | La fecha es posterior a hoy en la zona del centro (ADR-008, D-27) | `BUSINESS_RULE_VIOLATION` | `"No se puede registrar una fecha futura."` |

**Notas:**
- **Orden de comprobación:** 1. Campos obligatorios; 2. Formato de fecha; 3. `valorRegistrado >= 0`; 4. Reintento con el mismo `clienteId`; 5. Existencia y pertenencia del hábito; 6. Fecha no futura; 7. Unicidad `(habitoId, fecha)`.
- `notas` vacías se devuelven como `null`.

---

### E-12 · GET /registros
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

**Parámetros de consulta:** `habitoId` (opcional), `page` (default 1), `size` (default 20, máx 100), `from` (`YYYY-MM-DD`, inclusivo), `to` (`YYYY-MM-DD`, exclusivo).  
**Respuesta de éxito (`200 OK`):** `{ "items": [...], "page": 1, "size": 20, "total": 45, "totalPages": 3 }`.  
**Orden determinista:** `ORDER BY fecha DESC, id DESC`.

---

### E-12b · DELETE /registros/:id
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

> Añadido por ADR-008 (D-26): la app ya permite eliminar un registro (`eliminarRegistro`).

**Parámetros de ruta:** `id` (`integer`).  
**Comportamiento de negocio:** eliminación física. La racha del hábito se recalcula en la siguiente consulta, porque es un valor calculado (D-19).  
**Respuesta de éxito (`204 No Content`):** Sin cuerpo.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `404` | Registro inexistente o de un hábito ajeno | `DAILY_LOG_NOT_FOUND` | `"El registro indicado no existe."` |

---

### E-12c · PUT /registros/:id
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `paciente` (ADR-011) |
| **Idempotente** | Sí |

> Añadido por ADR-011 (2026-10-28): corregir un registro mal digitado sin borrarlo y volverlo a crear.

**Parámetros de ruta:** `id` (`integer`).
**Petición (`application/json`):** al menos uno de `valorRegistrado` (`number >= 0`, máximo 2 decimales) y `notas` (`string \| null`, máx 500; vacía se guarda como `null`). El hábito y la fecha **no** se cambian: para eso se elimina y se crea otro.
**Respuesta de éxito (`200 OK`):** el objeto `Registro` actualizado.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `400` | Cuerpo sin ningún campo | `VALIDATION_FAILED` | `"Indica qué quieres cambiar del registro."` |
| `400` | Valor negativo, notas largas o campos desconocidos (`habitoId`, `fecha`...) | `VALIDATION_FAILED` | `"El valor registrado no puede ser negativo y las notas no pueden superar 500 caracteres."` |
| `404` | Registro inexistente o de un hábito ajeno | `DAILY_LOG_NOT_FOUND` | `"El registro indicado no existe."` |

**Notas:** si cambia `valorRegistrado`, el servidor **recalcula** `metaCumplida` contra la meta activa de hoy (D-02 sigue valiendo: el cliente nunca lo envía). Si solo cambian las notas, `metaCumplida` no se toca.

---

### E-14 · GET /usuarios/me
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado |
| **Idempotente** | Sí |

> Añadido el 2026-10-25: `authentication.md` ya lo usaba en el ciclo de vida de la sesión, pero el
> contrato no lo definía. La app lo llama al arrancar con un token guardado.

**Respuesta de éxito (`200 OK`):** el mismo objeto `usuario` de E-01 (sin contraseña), con su `rol` (`"paciente"` o `"profesional"`). Lo pueden llamar los dos roles; la app decide con `rol` qué pantallas mostrar.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `401` | Token ausente o inválido, o la cuenta ya no existe | `UNAUTHORIZED` | `"No autorizado. Sesión inválida o expirada."` |
| `401` | Token vencido | `TOKEN_EXPIRED` | `"Tu sesión expiró. Inicia sesión de nuevo."` |

---

### E-15 · GET /usuarios
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `profesional` (ADR-011) |
| **Idempotente** | Sí |

> Añadido por ADR-011 (2026-10-28): HU-02, Flujo 5 ("el profesional consulta los pacientes del centro"), M-09.

**Parámetros de consulta:** `rol` (opcional; el único valor admitido es `paciente`, que es también el valor por defecto).
**Respuesta de éxito (`200 OK`):** `Array<Usuario>` con los pacientes en orden alfabético (nombres, apellidos), sin contraseña. `[]` si no hay ninguno (D-05).

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `400` | `rol` distinto de `paciente` | `VALIDATION_FAILED` | `"Los datos enviados no son válidos."` (con `errors.rol`) |
| `403` | Lo llama un paciente | `FORBIDDEN_ROLE` | `"No tienes permiso para realizar esta acción con tu rol."` |

---

### E-16 · GET /reportes/progreso
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado, rol `profesional` (ADR-011) |
| **Idempotente** | Sí |

> Añadido por ADR-011 (2026-10-28): M-09, "reportes de progreso por rango de fechas".

**Parámetros de consulta:** `usuarioId` (`integer >= 1`, el paciente), `fechaInicio` y `fechaFin` (`YYYY-MM-DD`, **ambos inclusivos**).
**Respuesta de éxito (`200 OK`)** (ejemplo):

```json
{
  "paciente": { "id": 1, "nombres": "Carlos", "apellidos": "Gómez", "rol": "paciente", "...": "..." },
  "fechaInicio": "2026-10-01",
  "fechaFin": "2026-10-28",
  "habitos": [
    {
      "habitoId": 1, "nombre": "Beber agua", "categoria": "Hidratación", "icono": "💧",
      "unidadMedida": "vasos", "activo": true, "metaActiva": 8,
      "diasEvaluados": 12, "diasCumplidos": 10, "porcentajeAdherencia": 83, "rachaMaxima": 4
    }
  ],
  "totales": { "diasEvaluados": 27, "diasCumplidos": 21, "porcentajeAdherencia": 78 }
}
```

| Campo | Cálculo |
| :--- | :--- |
| `diasEvaluados` | Días con registro del hábito dentro del rango. |
| `diasCumplidos` | De esos días, los que tienen `metaCumplida: true` (el valor congelado al registrar, D-02). |
| `porcentajeAdherencia` | `round(diasCumplidos / diasEvaluados × 100)`; `0` si no hay registros. |
| `rachaMaxima` | El tramo más largo de días **consecutivos** cumplidos dentro del rango. |
| `metaActiva` | Valor objetivo de la meta activa hoy, o `null`. |
| `totales` | Suma de todos los hábitos; el porcentaje se calcula sobre la suma, no como promedio de porcentajes. |

**Notas:** se incluyen todos los hábitos activos del paciente; los archivados (`activo: false`) solo si tienen registros en el rango. El profesional no puede modificar nada: este endpoint es de solo lectura.

**Errores:**
| Código | Cuándo | Código estable | Mensaje literal |
| :--- | :--- | :--- | :--- |
| `400` | Falta un parámetro o una fecha no es válida | `VALIDATION_FAILED` | `"Indica el paciente y un rango de fechas válido (YYYY-MM-DD)."` |
| `403` | Lo llama un paciente | `FORBIDDEN_ROLE` | `"No tienes permiso para realizar esta acción con tu rol."` |
| `404` | `usuarioId` no existe o no es un paciente | `PATIENT_NOT_FOUND` | `"El paciente indicado no existe."` |
| `422` | `fechaInicio` posterior a `fechaFin` | `BUSINESS_RULE_VIOLATION` | `"La fecha inicial no puede ser posterior a la fecha final."` |

---

### E-13 · GET /dashboard
| Atributo | Valor |
| :--- | :--- |
| **Autorización** | Autenticado |
| **Idempotente** | Sí |

> Corregido por ADR-008 (D-22): antes era `GET /dashboard/usuario/:usuarioId`. El usuario sale del
> token, como exige D-03. Prioridad baja: hoy el cliente calcula estas cifras con sus propios datos.
>
> **Estado (2026-10-28): no implementado en v1.0.0.** El dashboard del paciente se calcula en la app con
> los hábitos y registros que ya descargó; queda como mejora futura (sección 11).

**Parámetros de ruta:** ninguno.  
**Respuesta de éxito (`200 OK`):** `{ "totalHabitos": 5, "habitosConRegistroHoy": 3, "totalRegistrosSemana": 18, "metasCumplidasSemana": 15, "porcentajeSemana": 83, "mejorRacha": 12 }`.

---

## 6. Idempotencia y reintentos

### 6.1 Clasificación de operaciones según reintento

| Operación | ¿Se puede reintentar sola? | Justificación técnica |
| :--- | :--- | :--- |
| **Lecturas (`GET /categorias`, `GET /habitos`, `GET /registros`)** | **Sí, siempre** | Métodos seguros (`SAFE`). No mutan el estado del servidor. |
| **Creación de registros sin conexión (`POST /registros`)** | **Sí, con la misma `clienteId`** (S-06) | La app guarda el registro en la cola local y lo reenvía al volver la red con el mismo `clienteId`: si el primer intento sí llegó, el servidor responde `200` con el registro existente y no se duplica. |
| **Actualizaciones y bajas (`PUT /habitos/:id`, `PATCH /metas/:id`, `PUT /registros/:id`, `DELETE ...`)** | **No, en v1.x** (D-16) | Son idempotentes y podrían reintentarse, pero para el MVP el fallo se muestra con la acción "Reintentar". Más simple de implementar y de probar. |
| **Creación de Hábitos o Metas (`POST /habitos`, `POST /metas`)** | **No** | Reintentar a ciegas duplicaría hábitos o metas idénticos con distintos identificadores. |
| **Creación de Registro Diario (`POST /registros`)** | **Solo desde la cola offline (S-06)**, con el mismo `clienteId` | La clave desduplica en el backend. Hasta que exista la cola, el fallo se muestra con "Reintentar". |

### 6.2 Las tres reglas de la clave de idempotencia

Para la mutación más crítica en móvil (`POST /registros`), el cliente envía el campo `clienteId` (UUID v4) en el cuerpo. No se usa la cabecera `Idempotency-Key` (D-17):

1. **Misma clave y mismo cuerpo:** El servidor detecta la clave ya procesada en la base de datos y **devuelve la misma respuesta original (`200 OK` con el JSON del registro)** sin duplicar el dato ni alterar rachas.
2. **Misma clave y cuerpo distinto:** El servidor rechaza la llamada con **`409 IDEMPOTENCY_CONFLICT`** y mensaje literal:  
   `"Conflicto de clave de idempotencia: el cuerpo de la petición difiere del intento original."`
3. **Tiempo de conservación:** la clave se guarda para siempre en la columna `registro_diario.cliente_id`, con restricción `UNIQUE`. **Sin Redis** (D-17).

### 6.3 Política de reintentos en el cliente móvil (D-16)

- **Timeout:** máximo **10 segundos** por petición (`AbortController`).
- **Solo los `GET` se reintentan solos:** intento inmediato, otro a 1 s y otro a 2 s.
- **Las mutaciones no se reintentan solas:** el error se muestra con la acción "Reintentar".
- Cuando exista la cola offline (S-06), un `POST /registros` que falle por red se encolará en `hst:v1:pendientes` y se reenviará con el mismo `clienteId`.

---

## 7. Concurrencia

> **Aplazado en v1.x (ADR-008, D-20 y D-18).** El MVP es un usuario en un dispositivo, y los
> registros no se editan: `metaCumplida` se calcula al crear y queda congelada. La tabla siguiente
> es el diseño para cuando exista la edición (C-04) o varios dispositivos; no se implementa todavía.
>
> **Actualización (2026-10-28, ADR-011):** la edición ya existe (E-07, E-10b, E-12c) pero **sin control
> de versión**: con un solo dispositivo por persona, la última escritura gana. El "optimista por
> versión" de esta tabla sigue aplazado y no tiene relación con la respuesta optimista descartada en ADR-012.

Cuando dos dispositivos editan el mismo recurso en momentos cercanos:

| Entidad | Estrategia elegida | Cómo se escribe en el contrato |
| :--- | :--- | :--- |
| **Hábitos (`habito`)** | **Optimista por versión** | La app envía la marca temporal `updatedAt` del registro que tiene en memoria. Si el servidor detecta que otro dispositivo modificó el hábito en el intervalo, responde **`409 Conflict`** con mensaje literal: `"El hábito fue modificado en otro dispositivo. Por favor refresca antes de guardar."` |
| **Metas (`meta`)** | **Optimista por versión** | Aplica validación optimista con código 409 ante ediciones simultáneas. |
| **Registros Diarios (`registro_diario`)** | **El servidor gana (Último gana)** | Debido a la naturaleza factual de un registro diario ("cuántos vasos tomé hoy"), la última actualización recibida y confirmada por el servidor sobrescribe los campos mutables (`valorRegistrado`, `notas`), recalculando `metaCumplida` en base a la meta vigente. |

---

## 8. Sincronización móvil incremental

### 8.1 Soporte para sincronización incremental

> **Aplazado (ADR-008, D-21).** S-06 se implementó el 2026-10-28 como cola de registros en el cliente
> y no necesitó sincronización incremental. Mientras tanto, el cliente descarga la lista
> completa al iniciar sesión. Lo único que se adelanta es la columna `registro_diario.updated_at`.

Para evitar que la app móvil descargue todo el catálogo de registros cada vez que recupera señal:

```http
GET /api/v1/registros?updatedSince=2026-09-25T12:00:00-05:00
```

**Reglas obligatorias:**
1. **Instante de corte del servidor (`serverTime`):** Toda respuesta de sincronización incluye el encabezado HTTP `X-Server-Time: 2026-09-25T17:30:00-05:00` y el campo `serverTime` en el JSON. El cliente almacena este valor exacto para usarlo en la siguiente llamada incremental. **El reloj del teléfono nunca se utiliza como referencia de corte.**
2. **Los borrados y bajas viajan:** Los hábitos o registros archivados viajan con `activo: false` o marca `deletedAt: "..."` (lápidas o *tombstones*) para que la caché local de `AsyncStorage` los purge o marque como archivados.

### 8.2 Resolución de conflictos sin conexión

| Escenario | Política de resolución | Comportamiento hacia la persona usuaria |
| :--- | :--- | :--- |
| El usuario registró un hábito en modo avión, pero en el servidor ya existía un registro para esa fecha subido desde la web u otro teléfono. | **Gana el servidor** | El registro local de la cola offline se descarta. La aplicación muestra el aviso: *"Ya existía un registro sincronizado para este hábito en esa fecha. Se mantuvo el registro del servidor."* (implementado el 2026-10-28; ver [`offline-sync.md`](./offline-sync.md)) |

### 8.3 Carga útil diferenciada: Lista vs Detalle

Para preservar batería y plan de datos móviles, el contrato define dos formas DTO por entidad:

- **`HabitoSummary` (Pantalla de lista):** Retorna solo 8 campos esenciales para renderizar la tarjeta en pantalla (`id`, `categoriaHabitoId`, `nombre`, `unidadMedida`, `frecuencia`, `activo`, `rachaActual`, `metaActiva`).
- **`HabitoDetail` (Pantalla de edición y detalle):** Retorna los 16 campos completos (incluye categoría expandida, descripción extensa, historial de metas y marcas de auditoría).

### 8.4 Imágenes y archivos binarios

- En esta versión v1.0.0, **no se realiza carga de imágenes binarias pesadas**. Los iconos de las categorías son un emoji en texto (`icono: "💧"`), porque la app no usa librería de iconos (ADR-008, D-11).
- Si en futuras versiones se añaden fotos de progreso, se almacenarán fuera de la base de datos relacional (almacenamiento S3 compatible) y el contrato devolverá URLs HTTPS absolutas seguras con expiración.

---

## 9. Versionado y cambios rompientes

### 9.1 Prefijo y compatibilidad

- **Prefijo de ruta:** `/api/v1` en todos los endpoints.
- **Ventana de soporte:** Cuando se introduzca `/api/v2`, la versión `/api/v1` sobrevivirá un mínimo de **6 meses** sin apagarse.
- **Regla del cliente tolerante:** La aplicación móvil `hbt-app` ignora propiedades nuevas desconocidas presentes en las respuestas JSON sin fallar.

### 9.2 Matriz de cambios rompientes

| Cambio en el contrato | ¿Rompe la app móvil? | Regla de procedimiento |
| :--- | :--- | :--- |
| Agregar un nuevo campo opcional a la respuesta | **No** | Permitido en v1 en cualquier momento. |
| Agregar un parámetro de consulta opcional | **No** | Permitido en v1. |
| Quitar o renombrar una propiedad de respuesta | **Sí** | **Terminantemente prohibido en v1.** Exige nueva versión `/api/v2`. |
| Cambiar el tipo de dato de un campo (ej. `number` a `string`) | **Sí** | Exige versión `/api/v2`. |
| Volver obligatorio un campo en la petición | **Sí** | Exige versión `/api/v2`. |
| Modificar el mensaje literal o estructura de error | **Sí** | Los códigos `code` son inmutables. |

---

## 10. Sondas de API

> **Ejecutadas el 2026-10-25 contra el contenedor de `docker compose`** (ADR-008, D-25). Una versión
> anterior de esta tabla presentaba resultados obtenidos antes de que existiera el backend. Las mismas
> situaciones están cubiertas por las pruebas e2e de `test/` del repositorio `habits-tracker-api`, que se ejecutan contra PostgreSQL.

| # | Llamada | Se esperaba | Se obtuvo | ¿Cuadra? |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `POST /auth/login` con credenciales válidas | `200 OK` con `token` y perfil | `200 OK`, `application/json`, token JWT y perfil sin `contrasena` (2026-10-25, contenedor Docker) | **Sí** |
| **2** | `POST /auth/login` con contraseña errónea | `401 INVALID_CREDENTIALS`, detail `"Credenciales incorrectas."` | `401`, `application/problem+json`, `INVALID_CREDENTIALS`, `"Credenciales incorrectas."` (2026-10-25) | **Sí** |
| **3** | `GET /habitos` sin cabecera de autenticación | `401 UNAUTHORIZED` | `401` (2026-10-25) | **Sí** |
| **4** | `GET /categorias` con token de usuario | `200 OK` con las 5 categorías de D-11 | `200`, 5 categorías (2026-10-25) | **Sí** |
| **5** | `POST /habitos` con datos válidos | `201 Created` con el hábito creado | `201`, hábito con su meta inicial activa (2026-10-25) | **Sí** |
| **6** | `POST /habitos` sin nombre | `400 VALIDATION_FAILED` con `errors.nombre` | `400`, `errors.nombre` presente (2026-10-25) | **Sí** |
| **7** | `POST /registros` con valor negativo | `400 VALIDATION_FAILED` | `400`, mensaje literal del contrato (2026-10-25) | **Sí** |
| **8** | `POST /registros` con hábito y fecha repetidos | `409 DUPLICATE_DAILY_LOG` | `409 DUPLICATE_DAILY_LOG` (2026-10-25) | **Sí** |
| **9** | `POST /registros` repetido con el mismo `clienteId` y cuerpo | `200 OK` con el registro existente | `200`, mismo `id` que el primer intento (2026-10-25) | **Sí** |
| **10**| `GET /habitos/999` (id inexistente) | `404 HABIT_NOT_FOUND` | `404 HABIT_NOT_FOUND` (2026-10-25) | **Sí** |
| **11**| `POST /metas` para un hábito que ya tiene meta activa | `409 ACTIVE_GOAL_EXISTS` | `409 ACTIVE_GOAL_EXISTS` (2026-10-25) | **Sí** |
| **12**| `DELETE /habitos/:id` de un hábito con registros | `204`, y el hábito queda con `activo: false` | `204`; `GET /habitos?activos=false` lo muestra con `activo: false` (2026-10-25) | **Sí** |
| **13**| `POST /auth/register` con datos válidos | `201 Created` con `token` y perfil | `201`, `application/json` (2026-10-25, contenedor Docker) | **Sí** |
| **14**| `POST /auth/register` con un correo ya registrado (otras mayúsculas) | `409 DUPLICATE_EMAIL` | `409`, `application/problem+json`, `DUPLICATE_EMAIL` con el mensaje literal (2026-10-25) | **Sí** |
| **15**| `POST /auth/login` del paciente y del profesional de prueba | `200` con `rol` correcto | `200`, `rol: "paciente"` y `rol: "profesional"` (2026-10-28, Postman) | **Sí** |
| **16**| `POST /habitos` con el token del profesional | `403 FORBIDDEN_ROLE` | `403 FORBIDDEN_ROLE`, forma RFC 7807 (2026-10-28, Postman) | **Sí** |
| **17**| `GET /usuarios` con el token del paciente | `403 FORBIDDEN_ROLE` | `403 FORBIDDEN_ROLE` (2026-10-28, Postman) | **Sí** |
| **18**| `PUT /registros/:id` bajando el valor por debajo de la meta | `200` con `metaCumplida: false` | `200`, `metaCumplida` recalculado a `false` (2026-10-28, Postman) | **Sí** |
| **19**| `GET /usuarios?rol=paciente` con el profesional | `200` con el paciente de prueba | `200`, incluye a Carlos Gómez (2026-10-28, Postman) | **Sí** |
| **20**| `GET /reportes/progreso` de los últimos 30 días | `200` con la adherencia por hábito | `200`, `habitos` y `totales` con porcentajes entre 0 y 100 (2026-10-28, Postman) | **Sí** |

> Las sondas 15 a 20 forman parte de la colección `postman/habits-tracker.postman_collection.json` del repositorio
> `habits-tracker-api` (18 peticiones, 24 aserciones), que se ejecuta con `npm run test:postman`. Los casos de
> error de E-10b, E-10c, E-12c, E-15 y E-16 están cubiertos por las pruebas e2e `test/roles.e2e-spec.ts`,
> `test/reportes.e2e-spec.ts` y `test/edicion.e2e-spec.ts`.

---

## 11. Huecos declarados

| Hueco | Consecuencia técnica | Estado |
| :--- | :--- | :--- |
| Sin endpoint de renovación de token (`POST /auth/refresh`) | El usuario vuelve a iniciar sesión cuando el token expira (24 h) | **Decisión del MVP**, no un olvido: ver [`authentication.md`](./authentication.md) |
| Sin índice parcial para hábitos archivados | Las consultas de historial recorren también los hábitos inactivos | Aceptable al volumen previsto; se revisa si se mide lentitud |
| Paginación de `GET /registros` sin cursor | Si se insertan registros durante el desplazamiento, una página puede repetir o saltar un elemento | Aceptable en el MVP: un solo usuario escribe sus propios registros |
| Sincronización incremental y concurrencia | Ver secciones 7 y 8 | Aplazado (ADR-008, D-20 y D-21). La cola de registros sin conexión (S-06) sí está implementada |
| `GET /dashboard` (E-13) | Las cifras del inicio se calculan en la app | Mejora futura; no bloquea ninguna pantalla |

---

## 12. Firma

- **Equipo responsable del contrato:** Juan José Horta Vanegas · Daniel Felipe Fernandez Rojas
- **Versión del contrato:** v1, revisada por ADR-008 el 2026-10-25 y ampliada por ADR-011 el 2026-10-28
- **Verificación contra el sistema:** sondas de la sección 10 (2026-10-25 y 2026-10-28), auditoría E2E (2026-10-26) y pruebas e2e de `habits-tracker-api`
