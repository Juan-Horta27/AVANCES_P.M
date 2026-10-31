# API — Hábitos Saludables

API REST del Sistema de Seguimiento de Hábitos Saludables: **NestJS 10 + Prisma 5 + PostgreSQL 16**,
empaquetada en una imagen de Docker. Contrato: `03-api-and-data/api-contract.md` del repositorio
[`habits-tracker-docs`](https://github.com/code-corhuila/habits-tracker-docs) (decisiones en ADR-008, ADR-010 y ADR-011).

| Repositorio | Papel |
|---|---|
| `habits-tracker-api` | Este: reglas de negocio, API, esquema (migraciones) y datos semilla |
| [`habits-tracker-infra`](https://github.com/code-corhuila/habits-tracker-infra) | `docker-compose.yml` que levanta PostgreSQL y esta API; **manual de implementación** |
| [`habits-tracker-app`](https://github.com/code-corhuila/habits-tracker-app) | App móvil que consume esta API |

## Requisitos

- Node.js 20 o superior y npm.
- Docker Desktop en ejecución.

## Puesta en marcha

**Para usar la aplicación** (base de datos + API en contenedores) sigue el manual de
implementación del README de `habits-tracker-infra`: `docker compose up -d --build`.

**Para desarrollar la API** con recarga automática, con este repositorio clonado al lado de
`habits-tracker-infra`:

```powershell
Copy-Item .env.example .env          # mismas credenciales que el .env de habits-tracker-infra
npm install
Set-Location ..habits-tracker-infra
docker compose up -d database        # solo PostgreSQL
Set-Location ..habits-tracker-api
npm run db:migrar                    # tablas, catálogo y datos semilla
npm run start:dev                    # API en http://localhost:3000/api/v1
```

Si el contenedor de la API de `-infra` está encendido, ocupa el puerto 3000: deténlo con
`docker compose stop api` o arranca en otro puerto con `$env:PORT=3001; npm run start:dev`.

> Desde el teléfono con Expo Go, `localhost` es el propio teléfono: usa la IP de tu PC
> (`http://192.168.x.x:3000/api/v1`). En el emulador de Android: `http://10.0.2.2:3000/api/v1`.

## Roles y usuarios de prueba

Dos roles (ADR-011). Un rol que llama a un endpoint del otro recibe `403 FORBIDDEN_ROLE`.

| Rol | Qué puede hacer | Usuario semilla (contraseña **de prueba**) |
|---|---|---|
| `paciente` | Sus hábitos, metas y registros; dashboard e historial | `paciente@habitos.test` / `Paciente123` |
| `profesional` | Lista de pacientes y su progreso por rango de fechas | `profesional@habitos.test` / `Profesional123` |

Los crea la migración `20261029050000_datos_semilla_por_rol` (solo con el hash bcrypt), junto con
hábitos y registros de demostración del paciente. `POST /auth/register` crea siempre pacientes.

## Endpoints

Prefijo `/api/v1`. **P** = paciente · **Pr** = profesional.

| Método y ruta | Rol | Qué hace | Respuestas |
|---|---|---|---|
| `POST /auth/register` | público | Crea una cuenta de paciente y devuelve una sesión | `201` · `400` · `409 DUPLICATE_EMAIL` |
| `POST /auth/login` | público | Valida credenciales y devuelve una sesión | `200` · `400` · `401 INVALID_CREDENTIALS` |
| `GET /usuarios/me` | P, Pr | Perfil del dueño del token | `200` · `401` |
| `GET /categorias` | P, Pr | Catálogo de categorías | `200` |
| `GET /habitos?activos=` | P | Hábitos propios con racha y meta activa (`activos=false` incluye archivados) | `200` |
| `GET /habitos/:id` | P | Detalle con categoría e historial de metas | `200` · `403` · `404` |
| `POST /habitos` | P | Crea un hábito, con meta inicial opcional | `201` · `400` · `404 CATEGORY_NOT_FOUND` · `422` |
| `PUT /habitos/:id` | P | Edita nombre, descripción, unidad o frecuencia; `activo: true` reactiva | `200` · `400` · `403` · `404` |
| `DELETE /habitos/:id` | P | Borra (sin registros) o archiva (con registros) | `204` · `403` · `404` |
| `GET /metas?habitoId=&activas=` | P | Metas de los hábitos propios | `200` |
| `POST /metas` | P | Crea una meta activa | `201` · `404` · `409 ACTIVE_GOAL_EXISTS` · `422` |
| `PATCH /metas/:id` | P | Activa o desactiva; edita valor objetivo y descripción | `200` · `400` · `404 GOAL_NOT_FOUND` · `409` · `422` |
| `DELETE /metas/:id` | P | Elimina una meta (los registros conservan su evaluación) | `204` · `404 GOAL_NOT_FOUND` |
| `POST /registros` | P | Registra el cumplimiento de un día (idempotente por `clienteId`) | `201` · `200` (reintento) · `400` · `403` · `404` · `409` · `422` |
| `GET /registros?habitoId=&page=&size=&from=&to=` | P | Registros paginados, del más reciente al más antiguo | `200` |
| `PUT /registros/:id` | P | Edita valor y notas; recalcula `metaCumplida` si cambia el valor | `200` · `400` · `404 DAILY_LOG_NOT_FOUND` |
| `DELETE /registros/:id` | P | Elimina un registro | `204` · `404 DAILY_LOG_NOT_FOUND` |
| `GET /usuarios?rol=paciente` | Pr | Pacientes del centro | `200` · `400` |
| `GET /reportes/progreso?usuarioId=&fechaInicio=&fechaFin=` | Pr | Por hábito: días evaluados, cumplidos, % de adherencia y racha máxima del rango | `200` · `400` · `404 PATIENT_NOT_FOUND` · `422` |

Todo, salvo login y registro, exige `Authorization: Bearer <token>`: sin él, `401 UNAUTHORIZED`
(`401 TOKEN_EXPIRED` si venció). Con el rol equivocado, `403 FORBIDDEN_ROLE`.

Una sesión es `{ "token": "<JWT>", "usuario": { id, nombres, apellidos, correo, edad, peso, estatura, rol } }`.
Todos los errores siguen RFC 7807 (`application/problem+json`): `title`, `status`, `detail`, `code` y,
en validaciones, `errors` por campo.

## Pruebas

```powershell
npm test               # unitarias (sin base de datos): autenticación, reportes, rachas, fechas, entorno
npm run test:e2e       # de punta a punta contra PostgreSQL (docker compose up -d database en -infra), esquema aislado "e2e"
npm run test:postman   # colección de Postman contra la API en marcha (docker compose up -d en -infra)
npm run lint
```

La colección está en `postman/habits-tracker.postman_collection.json` (con el entorno
`postman/local.postman_environment.json`). También se puede importar en Postman y ejecutarla con
*Run collection*. Prueba los dos logins, el 401 sin token, el 403 con el rol equivocado, el CRUD
completo de un hábito, la regla de un registro por hábito y día (409) y el reporte del profesional;
cada corrida crea su propio hábito y lo elimina al final, así que se puede repetir.

## Estructura

```
habits-tracker-api/
├── Dockerfile                Imagen de producción (la usa habits-tracker-infra)
├── prisma/
│   ├── schema.prisma         Modelo de datos (data-model.md)
│   └── migrations/           Migraciones SQL versionadas, incluido el catálogo de categorías
├── src/
│   ├── main.ts               Arranque
│   ├── configurar-app.ts     Prefijo /api/v1, validación, errores y CORS (lo comparten main y las pruebas)
│   ├── app.module.ts         Módulo raíz
│   ├── config/               Validación de variables de entorno
│   ├── prisma/               Acceso a la base de datos (PrismaService)
│   ├── common/
│   │   ├── errores/          ProblemaException, fábricas de errores y el filtro global RFC 7807
│   │   ├── validacion/       ValidationPipe global, validador de fechas y normalizaciones
│   │   └── fechas.ts         Fechas 'YYYY-MM-DD' (ADR-003) y "hoy" en la zona del centro
│   ├── auth/                 Registro, login, JWT, guardia global (@Publico, @UsuarioActual) y roles (@Roles)
│   ├── categorias/           Catálogo (solo lectura)
│   ├── habitos/              CRUD, archivado y rachas calculadas
│   ├── metas/                Metas con la regla de una sola activa por hábito
│   ├── registros/            Registros diarios, edición, idempotencia y cálculo de racha (racha.ts)
│   ├── reportes/             Progreso del paciente para el profesional (M-09)
│   └── usuarios/             Perfil propio y lista de pacientes
├── postman/                  Colección y entorno de Postman
└── test/                     Pruebas e2e con Supertest
```
