# Modelo de datos — Healthy Habits Tracker

Fecha: 2026-09-25 · Revisado: 2026-10-25 ([ADR-008](../01-architecture/decisions/records/ADR-008-reconciliacion-contrato-api.md)) y 2026-10-28 ([ADR-011](../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md))  
Verificación contra el motor: **2026-10-28**, PostgreSQL 16 en Docker, migraciones `inicial`, `catalogo_categorias`, `roles_de_usuario` y `datos_semilla_por_rol` (ver sección 11)  
Rige sobre: las migraciones de Prisma en `prisma/migrations/` del repositorio `habits-tracker-api` ([ADR-010](../01-architecture/decisions/records/ADR-010-separacion-en-cuatro-repositorios.md))

> **Cambios de la revisión 2026-10-28 (ADR-011):**
> - `usuario` gana la columna `rol` (tipo enumerado `rol_usuario`: `paciente` o `profesional`, por defecto `paciente`).
> - Una migración de datos crea un usuario de cada rol y un historial de prueba (sección 10).

> **Cambios de la revisión 2026-10-25 (ADR-008):**
> - **Sin tabla `racha`** (D-19): la racha se calcula al consultar, a partir de los registros.
> - `registro_diario` gana `cliente_id` (`uuid`, único, D-17) y `updated_at` (D-21).
> - `registro_diario` **no** tiene `usuario_id`: pertenece al usuario a través del hábito (D-23).
> - `usuario.apellidos` pasa a ser **nulo permitido** (D-13).
> - Catálogo: Hidratación, Ejercicio, Alimentación, Sueño y Meditación, con icono emoji (D-11).
> - Las salidas "literales" de la sección 11 se retiraron: se reemplazarán por la salida real (D-25).

---

## Cómo se lee este documento

Toda regla e invariante del modelo lleva una de las siguientes tres marcas obligatorias:

| Marca | Significa |
| :--- | :--- |
| **`motor`** | Existe en la base de datos ahora mismo como restricción física (`NOT NULL`, `CHECK`, `UNIQUE`, `FOREIGN KEY`). Una inserción manual por consola la respeta o falla. |
| **`solo dominio`** | La garantiza el código del servicio NestJS (`habits-tracker-api`) en sus casos de uso o validadores DTO, y nada más. Una inserción directa por consola la saltaría sin ruido. |
| **`pendiente`** | No existe todavía en la base ni en el servicio. Se declara formalmente con la tarea y responsable que la implementará. |

> **Criterio de asignación:** Si una regla puede expresarse en el motor relacional, **debe** expresarse en el motor. Que el código de NestJS valide con `class-validator` no exime a PostgreSQL de imponer la restricción.

---

## 0. Convención de nombres

| Elemento | Convención | Ejemplo en el proyecto |
| :--- | :--- | :--- |
| **Entidad (clase de dominio)** | PascalCase, inglés/español consistente, singular | `Usuario`, `Habito`, `RegistroDiario`, `Meta`, `CategoriaHabito`, `Racha` |
| **Tabla (base de datos)** | snake_case, español, singular | `usuario`, `categoria_habito`, `habito`, `meta`, `registro_diario` |
| **Atributo / Columna de BD** | snake_case, singular | `usuario_id`, `valor_registrado`, `meta_cumplida`, `created_at` |
| **Clave primaria** | `id` | `id` |
| **Clave foránea** | `<entidad>_id` | `usuario_id`, `habito_id`, `categoria_habito_id` |
| **Campo de JSON (API)** | camelCase | `usuarioId`, `valorRegistrado`, `metaCumplida`, `createdAt` |

### Resolución de palabras reservadas del motor

| Palabra / Tabla en conflicto | Solución adoptada | Justificación técnica |
| :--- | :--- | :--- |
| `user` (reservada en PostgreSQL) | Se nombra la tabla `usuario` en singular en español | Evita tener que entrecomillar `"user"` en consultas SQL nativas o migraciones manuales. |
| `order` (reservada en SQL) | No aplica directamente; las ordenaciones usan `orden` o `posicion` | Previene colisiones con la cláusula `ORDER BY`. |

---

## 1. Glosario del dominio

| Término | Qué es exactamente en este proyecto |
| :--- | :--- |
| **Usuario** | Persona registrada en la plataforma que gestiona y da seguimiento a sus propios hábitos. |
| **Categoría de Hábito** | Clasificación temática fija del sistema (*Hidratación*, *Ejercicio*, *Alimentación*, *Sueño*, *Meditación*) a la que pertenece un hábito. |
| **Hábito** | Comportamiento recurrente que un usuario decide medir en el tiempo (ej. "Beber agua", "Caminar"). |
| **Meta** | Valor cuantitativo objetivo asociado a un hábito que define el umbral de éxito (ej. 2000 ml al día). |
| **Registro Diario** | Medición puntual registrada por el usuario para un hábito en una fecha de calendario específica (`YYYY-MM-DD`). |
| **Meta Cumplida** | Bandera booleana almacenada en el registro diario que indica si el `valorRegistrado` alcanzó o superó el `valorObjetivo` vigente en la fecha del registro. Se congela en la inserción. |
| **Racha** | Valor **calculado** (no almacenado) de días consecutivos cumpliendo la meta de un hábito (`rachaActual` y `rachaMaxima`). |
| **Frecuencia** | Periodicidad con la que se evalúa el hábito (`diaria` o `semanal`). |

---

## 2. Entidades, agregados e invariantes

### 2.1 Usuario — Raíz de agregado

Representa la cuenta de acceso y perfil del usuario en el sistema.

- **Tipo:** Raíz de agregado.
- **Invariantes:**
  - `id` es entero positivo autoincremental — **`motor`**
  - `correo` es único en minúsculas y con formato de email válido — **`motor`**
  - `contrasena` se almacena como hash derivado con bcrypt y sal (mínimo 10 rondas), nunca en texto claro ni reversible — **`solo dominio`**
  - `edad` es entero mayor o igual a 12 y menor o igual a 120, o nulo si no se proporciona — **`solo dominio`**
  - `peso` es número decimal positivo en kilogramos (rango: 20.0 a 350.0), o nulo — **`solo dominio`**
  - `estatura` es número decimal positivo en metros (rango: 0.80 a 2.50), o nulo — **`solo dominio`**
  - `rol` es `paciente` o `profesional`; si no se indica, `paciente` — **`motor`** (tipo enumerado `rol_usuario`)
  - Quien se registra desde la app siempre es `paciente`; solo un `paciente` tiene hábitos — **`solo dominio`** (`RolesGuard`, ADR-011)
  - Todo usuario tiene marcas de tiempo `created_at` y `updated_at` en UTC — **`motor`**
- **Relaciones:**
  - 1 Usuario : N Hábitos (1 a muchos).

### 2.2 CategoriaHabito — Raíz de agregado (Catálogo del Sistema)

Catálogo global de clasificación de hábitos gestionado por la plataforma.

- **Tipo:** Raíz de agregado (catálogo referencial de solo lectura para la app móvil).
- **Invariantes:**
  - `id` es entero autoincremental — **`motor`**
  - `nombre` es texto no vacío, único e irrepetible — **`motor`**
  - `icono` almacena un emoji (por ejemplo `💧`) o nulo — **`solo dominio`** (ADR-008, D-11)
  - No puede eliminarse una categoría si tiene hábitos vinculados — **`motor`**
- **Relaciones:**
  - 1 CategoriaHabito : N Hábitos (1 a muchos).

### 2.3 Habito — Raíz de agregado

Define un hábito personalizado creado por el usuario. Es la raíz del agregado que encapsula sus metas y registros; su racha se calcula a partir de los registros.

- **Tipo:** Raíz de agregado.
- **Invariantes:**
  - `id` es entero positivo autoincremental — **`motor`**
  - `usuario_id` debe existir en la tabla `usuario` — **`motor`**
  - `categoria_habito_id` debe existir en la tabla `categoria_habito` — **`motor`**
  - `nombre` es obligatorio, con longitud entre 2 y 100 caracteres — **`solo dominio`**
  - `unidad_medida` es obligatoria (ej. "vasos", "minutos", "pasos") — **`solo dominio`**
  - `frecuencia` solo admite los valores `'diaria'` o `'semanal'` — **`solo dominio`**
  - `activo` es booleano, por omisión `true` — **`motor`**
  - Un usuario no puede tener dos hábitos activos con el mismo nombre — **`solo dominio`** (**`pendiente`**: el cliente v1.0.0 tampoco la valida; ver sección 13).
- **Relaciones:**
  - N Hábitos : 1 Usuario (muchos a 1).
  - N Hábitos : 1 CategoriaHabito (muchos a 1).
  - 1 Hábito : N Metas (1 a muchos).
  - 1 Hábito : N Registros Diarios (1 a muchos).

### 2.4 Meta — Entidad interna del agregado Hábito

Define el objetivo cuantitativo asignado a un hábito en un intervalo de tiempo.

- **Tipo:** Entidad interna (no se crea sin un Hábito padre).
- **Invariantes:**
  - `id` es entero positivo autoincremental — **`motor`**
  - `habito_id` debe existir y no puede quedar huérfano — **`motor`**
  - `valor_objetivo` es un número decimal estrictamente mayor que 0 — **`motor`**
  - `activa` es booleana; solo puede existir una meta activa por hábito a la vez — **`solo dominio`** (se valida al crear y al reactivar; candidata a índice único parcial `ON meta (habito_id) WHERE activa`, que Prisma no declara en el esquema y exigiría una migración SQL escrita a mano)
- **Relaciones:**
  - N Metas : 1 Hábito (muchos a 1).

### 2.5 RegistroDiario — Entidad interna del agregado Hábito

Registro factual de una ejecución de hábito en una fecha de calendario determinada.

- **Tipo:** Entidad interna.
- **Invariantes:**
  - `id` es entero positivo autoincremental — **`motor`**
  - `habito_id` debe existir en el motor — **`motor`**
  - `fecha` es de tipo fecha pura (`DATE`), sin componente de hora — **`motor`**
  - La combinación `(habito_id, fecha)` es estrictamente única en todo el sistema — **`motor`**
  - `valor_registrado` es número decimal mayor o igual a 0 — **`motor`**
  - `meta_cumplida` es un booleano fijado al guardar el registro y no cambia ante mutaciones posteriores de la meta — **`solo dominio`**
  - `notas` es texto opcional de máximo 500 caracteres — **`motor`** (`varchar(500)`)
  - `cliente_id` es un UUID generado por el cliente, único en todo el sistema; garantiza la idempotencia de `POST /registros` — **`motor`** (ADR-008, D-17)
  - El registro pertenece al usuario **a través de su hábito**: no hay `usuario_id` en esta tabla (D-23)
- **Relaciones:**
  - N RegistrosDiarios : 1 Hábito (muchos a 1).

### 2.6 Racha — valor calculado, no tabla

> **Cambio de ADR-008 (D-19).** En la versión anterior, `Racha` era una tabla 1:1 con `Habito`.
> Ahora es un **valor calculado** al consultar, a partir de los registros con `meta_cumplida = true`,
> con el mismo algoritmo que `src/utils/racha.ts` del cliente (racha actual hasta hoy o ayer, y
> racha máxima histórica). Así no hay un dato derivado que pueda quedar desincronizado.

- `rachaActual >= 0`, `rachaMaxima >= rachaActual` — garantizados por el algoritmo y cubiertos por pruebas.

---

## 3. Modelo físico

Tabla consolidada de todas las columnas de la base de datos relacional PostgreSQL:

| Tabla | Columna | Tipo | Nulo | Por omisión | Qué es |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `usuario` | `id` | `integer` | no | `nextval(...)` | Identificador único autoincremental de la cuenta |
| `usuario` | `nombres` | `varchar(100)` | no | — | Nombres de pila del usuario, recortado de espacios |
| `usuario` | `apellidos` | `varchar(100)` | sí | `NULL` | Apellidos del usuario, recortado de espacios. Opcionales (D-13) |
| `usuario` | `correo` | `varchar(150)` | no | — | Correo electrónico en minúsculas, único en el sistema |
| `usuario` | `contrasena` | `varchar(255)` | no | — | Hash bcrypt con salt de la contraseña |
| `usuario` | `edad` | `integer` | sí | `NULL` | Edad en años. Nulo si el usuario omite su perfil de salud |
| `usuario` | `peso` | `numeric(5,2)` | sí | `NULL` | Peso corporal en kg. Nulo si el usuario no desea registrarlo |
| `usuario` | `estatura` | `numeric(3,2)` | sí | `NULL` | Estatura en metros (ej. 1.75). Nulo si no se registra |
| `usuario` | `rol` | `rol_usuario` (enum) | no | `'paciente'` | `paciente` o `profesional` (ADR-011). Decide qué rutas puede usar la persona |
| `usuario` | `created_at` | `timestamp with time zone` | no | `now()` | Instante UTC de creación de la cuenta |
| `usuario` | `updated_at` | `timestamp with time zone` | no | `now()` | Instante UTC de última actualización de datos |
| `categoria_habito` | `id` | `integer` | no | `nextval(...)` | Identificador único de categoría de catálogo |
| `categoria_habito` | `nombre` | `varchar(60)` | no | — | Nombre único de la categoría (ej. "Hidratación") |
| `categoria_habito` | `descripcion` | `text` | sí | `NULL` | Descripción extendida. Nulo si es autoexplicativa |
| `categoria_habito` | `icono` | `varchar(50)` | sí | `NULL` | Emoji que representa la categoría (D-11) |
| `categoria_habito` | `created_at` | `timestamp with time zone` | no | `now()` | Instante UTC de registro en catálogo |
| `habito` | `id` | `integer` | no | `nextval(...)` | Identificador único autoincremental del hábito |
| `habito` | `usuario_id` | `integer` | no | — | Clave foránea al usuario propietario |
| `habito` | `categoria_habito_id`| `integer` | no | — | Clave foránea a la categoría correspondiente |
| `habito` | `nombre` | `varchar(100)` | no | — | Nombre del hábito (ej. "Beber 2L de agua") |
| `habito` | `descripcion` | `text` | sí | `NULL` | Instrucción o detalle del hábito. Nulo si no tiene |
| `habito` | `unidad_medida` | `varchar(30)` | no | — | Unidad de medida (ej. "vasos", "km", "páginas") |
| `habito` | `frecuencia` | `varchar(20)` | no | `'diaria'` | Periodicidad de medición: 'diaria' o 'semanal' |
| `habito` | `activo` | `boolean` | no | `true` | Indicador de baja lógica. `false` = archivado |
| `habito` | `created_at` | `timestamp with time zone` | no | `now()` | Instante UTC de creación del hábito |
| `habito` | `updated_at` | `timestamp with time zone` | no | `now()` | Instante UTC de última modificación |
| `meta` | `id` | `integer` | no | `nextval(...)` | Identificador único autoincremental de la meta |
| `meta` | `habito_id` | `integer` | no | — | Clave foránea al hábito al que pertenece la meta |
| `meta` | `valor_objetivo` | `numeric(8,2)` | no | — | Cantidad umbral para dar por cumplido el hábito |
| `meta` | `descripcion` | `text` | sí | `NULL` | Resumen de la meta. Nulo si no tiene detalle |
| `meta` | `activa` | `boolean` | no | `true` | Indica si esta meta es la que rige actualmente |
| `meta` | `created_at` | `timestamp with time zone` | no | `now()` | Instante UTC de definición de la meta |
| `meta` | `updated_at` | `timestamp with time zone` | no | `now()` | Instante UTC de modificación de la meta |
| `registro_diario` | `id` | `integer` | no | `nextval(...)` | Identificador único del registro de progreso |
| `registro_diario` | `habito_id` | `integer` | no | — | Clave foránea al hábito evaluado |
| `registro_diario` | `fecha` | `date` | no | — | Fecha calendaria del registro en formato ISO (`YYYY-MM-DD`) |
| `registro_diario` | `valor_registrado` | `numeric(8,2)` | no | — | Cantidad ejecutada por el usuario en esa fecha |
| `registro_diario` | `meta_cumplida` | `boolean` | no | `false` | Veredicto histórico congelado al momento del registro |
| `registro_diario` | `notas` | `varchar(500)` | sí | `NULL` | Bitácora u observaciones personales del usuario |
| `registro_diario` | `cliente_id` | `uuid` | no | — | UUID v4 generado por el cliente; clave de idempotencia (D-17) |
| `registro_diario` | `created_at` | `timestamp with time zone` | no | `now()` | Instante UTC en que el registro ingresó a la base |
| `registro_diario` | `updated_at` | `timestamp with time zone` | no | `now()` | Instante UTC de última modificación; base de la futura sincronización incremental (D-21) |

> Son **42 columnas** en 5 tablas (usuario 11, categoria_habito 5, habito 10, meta 7, registro_diario 9). La tabla `racha` de la versión anterior se eliminó (D-19).

---

## 4. Restricciones

| Nombre real de restricción | Tabla | Tipo | Qué garantiza | Marca |
| :--- | :--- | :--- | :--- | :--- |
| `usuario_pkey` | `usuario` | Primary Key | Unicidad del ID de usuario | **`motor`** |
| `usuario_correo_key` | `usuario` | Unique | Ningún correo puede repetirse en la plataforma | **`motor`** |
| `categoria_habito_pkey` | `categoria_habito` | Primary Key | Unicidad del ID de categoría | **`motor`** |
| `categoria_habito_nombre_key` | `categoria_habito` | Unique | Nombres de categorías únicos en catálogo | **`motor`** |
| `habito_pkey` | `habito` | Primary Key | Unicidad del ID de hábito | **`motor`** |
| `habito_usuario_fkey` | `habito` | Foreign Key | Integridad referencial con usuario existente | **`motor`** |
| `habito_categoria_fkey` | `habito` | Foreign Key | Integridad referencial con categoría de catálogo | **`motor`** |
| `meta_pkey` | `meta` | Primary Key | Unicidad del ID de meta | **`motor`** |
| `meta_habito_fkey` | `meta` | Foreign Key | Integridad referencial con hábito existente | **`motor`** |
| `chk_meta_valor_positivo` | `meta` | Check | `valor_objetivo > 0` | **`motor`** |
| `registro_diario_pkey` | `registro_diario` | Primary Key | Unicidad del ID de registro | **`motor`** |
| `registro_diario_habito_fkey` | `registro_diario` | Foreign Key | Integridad referencial con hábito | **`motor`** |
| `registro_diario_habito_fecha_key` | `registro_diario` | Unique | Solo puede existir un registro por hábito en un mismo día `(habito_id, fecha)` | **`motor`** |
| `chk_registro_valor_no_negativo` | `registro_diario` | Check | `valor_registrado >= 0` | **`motor`** |
| `registro_diario_cliente_id_key` | `registro_diario` | Unique | Un mismo `cliente_id` no puede crear dos registros (idempotencia, D-17) | **`motor`** |

> Los dos `CHECK` (`chk_meta_valor_positivo`, `chk_registro_valor_no_negativo`) no se pueden
> declarar en `schema.prisma`: se añaden con SQL escrito a mano en la migración inicial.

---

## 5. Claves foráneas y política de borrado

| Relación | Al borrar el padre | Por qué técnica y humanamente |
| :--- | :--- | :--- |
| `habito` → `usuario` | **Restringir (`RESTRICT`)** | Un usuario con historial no se elimina en cascada por accidente. Se exige desactivación previa de cuenta para evitar pérdida irreversible de datos de progreso. |
| `habito` → `categoria_habito` | **Restringir (`RESTRICT`)** | Las categorías de catálogo no pueden eliminarse si algún usuario tiene hábitos asignados a ellas. |
| `meta` → `habito` | **Cascada (`CASCADE`)** | Las metas pertenecen exclusivamente al ciclo de vida de su hábito; si el hábito se elimina físicamente, sus metas carecen de significado. |
| `registro_diario` → `habito` | **Restringir (`RESTRICT`)** | Un hábito que ya tiene registros de días pasados tiene valor histórico acumulado. No se borra físicamente: se archiva mediante baja lógica (`activo = false`). |

---

## 6. Baja lógica

La plataforma prohíbe la eliminación destructiva (`DELETE`) de hábitos que ya cuentan con registros de cumplimiento para preservar el historial del usuario.

| Pregunta | Decisión del proyecto |
| :--- | :--- |
| **¿Qué columna lo marca?** | `activo` (`boolean`, en tabla `habito`), donde `true` = activo y `false` = dado de baja/archivado. |
| **¿Qué consultas lo filtran?** | Listado de hábitos vigentes en pantalla principal (`DashboardScreen`, `HabitosScreen`, selector de `NuevoRegistroScreen`). |
| **¿Qué consultas no lo filtran?** | La carga por identificador (`GET /habitos/:id`), consultas de historial de registros pasados (`HistorialScreen`) y cálculos históricos de auditoría. |
| **¿Se puede reactivar?** | Sí, mediante `PUT /habitos/:id` enviando `{ "activo": true }`. |
| **¿La unicidad cuenta a los dados de baja?** | Sí. Si un hábito se desactiva, su nombre no se reutiliza en el mismo usuario para evitar confusiones en reportes históricos. |
| **¿Qué ve la app móvil?** | No aparece en los selectores de nuevos registros diarios; en la pantalla de historial aparece con la etiqueta visual `[Archivado]`. |

---

## 7. Patrones de acceso e índices

### 7.1 Consultas reales del sistema

| # | Consulta | Frecuencia | Índice que la sirve |
| :--- | :--- | :--- | :--- |
| **Q1** | Buscar usuario por correo electrónico para login | Alta — en cada inicio de sesión | `idx_usuario_correo` (creado por constraint unique) |
| **Q2** | Listar hábitos activos de un usuario | Alta — pantalla principal al abrir la app | `idx_habito_usuario_activo` |
| **Q3** | Verificar si ya existe registro de un hábito en una fecha dada | Muy alta — en cada registro diario | `registro_diario_habito_fecha_key` (Unique constraint) |
| **Q4** | Obtener los registros de un usuario en un rango semanal/mensual | Alta — pantalla Historial y Dashboard | `registro_diario_habito_fecha_key` (su primera columna es `habito_id`, así que también sirve para el rango de fechas) |
| **Q5** | Consultar meta activa de un hábito | Alta — al registrar progreso | `idx_meta_habito_activa` |
| **Q6** | Calcular la racha de un hábito | Media — lista de hábitos y dashboard | `registro_diario_habito_fecha_key` (la racha se calcula sobre los registros del hábito, D-19) |
| **Q7** | Descargar registros modificados tras una fecha (`updatedSince`) | Alta — sincronización al recuperar red | `idx_registro_updated_at` — **`pendiente`**, aplazado con la sincronización incremental (D-21) |
| **Q8** | Listar los pacientes del centro (`rol = 'paciente'`) | Baja — al abrir el panel del profesional | Ninguno: la tabla `usuario` es pequeña; recorrido secuencial aceptable |
| **Q9** | Reporte de progreso: registros de los hábitos de un paciente entre dos fechas | Media — al abrir o cambiar el rango del reporte | `idx_habito_usuario_activo` para los hábitos y `registro_diario_habito_fecha_key` para el rango |

### 7.2 Índices de la migración inicial

> Los crea la migración `inicial` y están verificados contra la base (sección 11.3).

| Nombre del índice | Tabla | Columnas | Tipo |
| :--- | :--- | :--- | :--- |
| `usuario_correo_key` | `usuario` | `correo` | B-tree único |
| `categoria_habito_nombre_key` | `categoria_habito` | `nombre` | B-tree único |
| `registro_diario_habito_fecha_key` | `registro_diario` | `habito_id, fecha` | B-tree compuesto único |
| `registro_diario_cliente_id_key` | `registro_diario` | `cliente_id` | B-tree único |
| `idx_habito_usuario_activo` | `habito` | `usuario_id, activo` | B-tree compuesto (Q2) |
| `idx_meta_habito_activa` | `meta` | `habito_id, activa` | B-tree compuesto (Q5) |

### 7.3 Índices aplazados

| Nombre propuesto | Tabla | Columnas | Consulta que acelera | Cuándo |
| :--- | :--- | :--- | :--- | :--- |
| `idx_registro_updated_at` | `registro_diario` | `updated_at` | Q7 (sincronización incremental) | Con la sincronización incremental (D-21); S-06 se resolvió con la cola del cliente y no lo necesita |

### 7.4 Índices descartados y por qué

- **Índice sobre `usuario(nombres, apellidos)` descartado:** La app móvil no incluye búsqueda global de usuarios entre cuentas privadas. Crear este índice penalizaría las escrituras sin beneficio de lectura.
- **Índice sobre `registro_diario(notas)` descartado:** Las notas son un campo descriptivo no estructurado de baja cardinalidad de búsqueda.

---

## 8. Auditoría y marcas de tiempo

- **Columnas de auditoría:** `created_at` y `updated_at` en todas las tablas con mutaciones (`usuario`, `habito`, `meta`, `registro_diario`).
- **Quién las escribe:** El motor relacional mediante `DEFAULT now()` en la creación, y triggers o Prisma ORM en actualización. El cliente móvil **jamás** envía marcas de auditoría; si el cliente las envía, el backend las descarta.
- **Zona horaria:** Almacenamiento estricto en **UTC** (`timestamp with time zone`). La base de datos nunca almacena hora local de Neiva ni desfases no declarados; la conversión a hora local (`America/Bogota`, UTC-5) es responsabilidad exclusiva de la capa de presentación de la aplicación móvil.

---

## 9. Datos personales y retención

| Campo | Para qué se usa | Cuánto tiempo se conserva | Qué pasa si la persona pide borrarlo |
| :--- | :--- | :--- | :--- |
| `usuario.nombres` y `apellidos` | Identificar a la persona en la interfaz y reportes | Mientras la cuenta esté activa | Se anonimiza a "Usuario Dado de Baja" en 48 horas |
| `usuario.correo` | Autenticación y recuperación de credenciales | Mientras la cuenta esté activa | Se sobrescribe con hash irreconocible (`anon_<id>@deleted.local`) |
| `usuario.contrasena` | Verificación de identidad mediante hash bcrypt | Mientras la cuenta esté activa | Se destruye el hash |
| `usuario.edad`, `peso`, `estatura` | Calibración de recomendaciones de salud | Mientras el usuario decida tenerlos | Se establecen a `NULL` inmediatamente |
| `registro_diario.notas` | Bitácora personal subjetiva del usuario | Mientras el hábito exista | Se purgan los textos de notas |

> **Políticas de seguridad obligatorias:**
> 1. Las contraseñas **no se guardan**. Solo se almacena el digest resultado de `bcrypt.hash(password, 10)`.
> 2. Los datos biométricos (`peso`, `estatura`) son datos sensibles de salud: **nunca se guardan en el `AsyncStorage` local del teléfono sin cifrar**; solo residen en la memoria RAM de `AppContext` durante la sesión activa.

---

## 10. Semilla

Qué datos existen en una base de datos recién creada y su medio de ingreso:

1. **Catálogos fijos del sistema (Migración inicial):**
   - Entran por la **migración** `catalogo_categorias` de `prisma/migrations/` (repositorio `habits-tracker-api`), con `ON CONFLICT DO NOTHING`. Va en una migración y no en un script de semilla porque es parte del esquema: toda base recién creada (desarrollo, pruebas, Docker) la recibe al migrar.
   - Incluye las 5 categorías de D-11: *Hidratación* 💧, *Ejercicio* 🏃, *Alimentación* 🥗, *Sueño* 😴, *Meditación* 🧘.
2. **Usuarios de prueba por rol (migración `datos_semilla_por_rol`, ADR-011):**
   - Un `paciente` (Carlos Gómez, `paciente@habitos.test`) y un `profesional` (`profesional@habitos.test`). Las contraseñas de prueba están en el README de `habits-tracker-api`; en la base solo se guarda su hash bcrypt.
   - El paciente trae 3 hábitos (Beber agua, Caminar, Dormir bien) con su meta activa y 27 registros de los días anteriores, **calculados relativos a la fecha de la migración** (`(now() AT TIME ZONE 'America/Bogota')::date - n`), para que el reporte del profesional y el dashboard tengan datos desde el primer arranque. `meta_cumplida` se calcula en la misma inserción con la regla de M-06.
   - Va en una migración (y no en un script aparte) por la misma razón que el catálogo: toda base nueva, incluida la del `docker compose` de `habits-tracker-infra`, queda lista para la demostración sin pasos manuales. Son datos ficticios de prueba, no de personas reales.
   - Las pruebas e2e corren en el esquema `e2e`, aparte, y crean sus propios usuarios: no dependen de esta semilla.
3. **Datos de demostración adicionales:**
   - **Entran por la API REST** (la app o la colección Postman), nunca por inserciones SQL manuales, para que pasen por todas las reglas de negocio del agregado.

---

## 11. Cómo se comprueba que este documento no miente

> **Ejecutado el 2026-10-25** contra `habitos_saludables_db` (PostgreSQL 16, contenedor `habitos-db`),
> tras aplicar las migraciones de `backend/`. **Vuelto a ejecutar el 2026-10-28** contra el contenedor
> `habits-tracker-db` de `habits-tracker-infra`, con las cuatro migraciones aplicadas. Las salidas de abajo son las obtenidas. Una versión
> anterior de esta sección mostraba salidas de una base que entonces no existía (ADR-008, D-25).

Las consultas excluyen `_prisma_migrations`, la tabla de control que crea Prisma.

### 11.1 Columnas — debe devolver 42 filas

```sql
SELECT table_name, ordinal_position, column_name,
       data_type, is_nullable, coalesce(column_default, '(ninguno)') AS valor_defecto
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name <> '_prisma_migrations'
ORDER BY table_name, ordinal_position;
```

**Salida real (2026-10-28):** 42 filas (`SELECT count(*)` sobre la misma condición devolvió `42`: usuario 11, categoria_habito 5, habito 10, meta 7, registro_diario 9). La columna nueva es `usuario.rol`, `USER-DEFINED` (`rol_usuario`), no nula, con valor por defecto `'paciente'::rol_usuario`; `enum_range(NULL::rol_usuario)` devuelve `{paciente,profesional}`.

### 11.2 Restricciones (claves primarias, foráneas y CHECK)

```sql
SELECT conrelid::regclass AS tabla, conname, contype
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid::regclass::text <> '_prisma_migrations'
ORDER BY 1, 3, 2;
```

Debe incluir las 5 claves primarias, las 4 foráneas y los 2 `CHECK` de la sección 4.
Las restricciones `UNIQUE` **no** aparecen aquí, porque Prisma las crea como índices únicos (ver 11.3).

**Salida real (11 filas; igual el 2026-10-28, porque el rol no añade restricciones):**

```text
usuario          | usuario_pkey                   | p
categoria_habito | categoria_habito_pkey          | p
habito           | habito_categoria_fkey          | f
habito           | habito_usuario_fkey            | f
habito           | habito_pkey                    | p
meta             | chk_meta_valor_positivo        | c
meta             | meta_habito_fkey               | f
meta             | meta_pkey                      | p
registro_diario  | chk_registro_valor_no_negativo | c
registro_diario  | registro_diario_habito_fkey    | f
registro_diario  | registro_diario_pkey           | p
```

### 11.3 Índices — debe incluir los 6 de la sección 7.2, más los de las claves primarias

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
ORDER BY tablename, indexname;
```

**Salida real (11 filas, columnas `tablename | indexname`; igual el 2026-10-28):**

```text
categoria_habito | categoria_habito_nombre_key
categoria_habito | categoria_habito_pkey
habito           | habito_pkey
habito           | idx_habito_usuario_activo
meta             | idx_meta_habito_activa
meta             | meta_pkey
registro_diario  | registro_diario_cliente_id_key
registro_diario  | registro_diario_habito_fecha_key
registro_diario  | registro_diario_pkey
usuario          | usuario_correo_key
usuario          | usuario_pkey
```

---

## 12. Firma

- **Responsables de la especificación:** Juan José Horta Vanegas · Daniel Felipe Fernandez Rojas
- **Revisión:** 2026-10-25, por ADR-008; 2026-10-28, por ADR-011 (roles)
- **Verificación contra el motor:** 2026-10-25 y 2026-10-28 (ver sección 11)

---

## 13. Deuda declarada

| Qué prometió el documento | Qué hace hoy el sistema | Cuándo se cierra |
| :--- | :--- | :--- |
| Meta activa única por hábito en el motor | Solo se validará en el servicio | Opcional: índice único parcial con SQL manual (ver 2.4) |
| Unicidad de nombre de hábito activo por usuario | No se valida en ninguna parte (tampoco en el cliente v1.0.0) | Por decidir si se mantiene la regla |
| Índice para la sincronización `updatedSince` | No aplica: S-06 se implementó como cola de registros pendientes en el cliente, sin sincronización incremental | Cuando se implemente `updatedSince` (D-21) |
