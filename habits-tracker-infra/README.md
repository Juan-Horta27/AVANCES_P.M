# habits-tracker-infra — Manual de implementación

Orquestación de **Healthy Habits Tracker**: levanta la base de datos (PostgreSQL 16) y la API
(NestJS) con Docker Compose. La app móvil (Expo) se arranca aparte con un solo comando.

> **Estado del manual (2026-10-28):** todos los pasos están probados, incluido un arranque desde una
> copia limpia de los repositorios (paso 4) con base de datos nueva.

| Repositorio | Qué contiene |
|---|---|
| [`habits-tracker-docs`](https://github.com/code-corhuila/habits-tracker-docs) | Especificación, modelo de datos, contrato de la API, ADR |
| `habits-tracker-app` | App móvil (React Native + Expo) |
| `habits-tracker-api` | API NestJS, reglas de negocio, migraciones y datos semilla |
| `habits-tracker-infra` | Este repositorio: `docker-compose.yml`, `.env.example` y este manual |

---

## 1. Requisitos

| Programa | Versión | Para qué |
|---|---|---|
| **Docker Desktop** | 4.x o superior (motor 29, Compose v2 o superior; probado con Compose 5.6.1) | Base de datos y API |
| **Git** | 2.40 o superior (probado con 2.53) | Clonar los repositorios |
| **Node.js** | 20.19.4+ · 22.13+ · 24.3+ (probado con 24.15.0) | Ejecutar la app |
| **Expo Go** (opcional) | Compatible con Expo SDK 57 | Abrir la app en un teléfono |

No se necesitan Java ni Android Studio para la entrega en navegador.

## 2. Clonar en la estructura que espera `docker-compose.yml`

Los tres repositorios de código van **en la misma carpeta**, uno al lado del otro:

```powershell
New-Item -ItemType Directory -Force "$HOME\habits-tracker"
Set-Location "$HOME\habits-tracker"
git clone https://github.com/code-corhuila/habits-tracker-infra.git
git clone https://github.com/code-corhuila/habits-tracker-api.git
git clone https://github.com/code-corhuila/habits-tracker-app.git
```

Resultado:

```
habits-tracker/
├── habits-tracker-infra/   ← aquí se ejecuta docker compose
├── habits-tracker-api/     ← Compose construye la API desde aquí (../habits-tracker-api)
└── habits-tracker-app/
```

## 3. Crear los archivos `.env`

```powershell
# Infraestructura (base de datos y API)
Set-Location "$HOME\habits-tracker\habits-tracker-infra"
Copy-Item .env.example .env

# App
Set-Location "$HOME\habits-tracker\habits-tracker-app"
Copy-Item .env.example .env
```

- En `habits-tracker-infra\.env` los valores de ejemplo funcionan tal cual para una prueba local.
  En cualquier otro entorno cambia `POSTGRES_PASSWORD` y `JWT_SECRET` (mínimo 32 caracteres).
- En `habits-tracker-app\.env`, `EXPO_PUBLIC_API_URL` debe apuntar a la API:

| Dónde abres la app | Valor |
|---|---|
| Navegador del mismo PC | `http://localhost:3000/api/v1` |
| Teléfono con Expo Go (misma Wi-Fi) | `http://<IP-de-tu-PC>:3000/api/v1` (la IP sale de `ipconfig`) |
| Emulador de Android | `http://10.0.2.2:3000/api/v1` |

## 4. Levantar la base de datos y la API

Con Docker Desktop abierto:

```powershell
Set-Location "$HOME\habits-tracker\habits-tracker-infra"
docker compose up -d --build
```

**Cuándo está lista:** ambos servicios tienen *healthcheck*. Están listos cuando `docker compose ps`
muestra `(healthy)` en los dos:

```powershell
docker compose ps
curl.exe http://localhost:3000/api/v1/categorias
```

La segunda línea debe responder un JSON con `"code":"UNAUTHORIZED"`: la API está viva y exige token.

**Tiempos medidos (2026-10-28, Windows 11 con Docker Desktop):**

| Situación | Tiempo hasta que los dos servicios están `(healthy)` |
|---|---|
| Copia limpia de `-infra` y `-api` (sin `node_modules`, sin `.env`), `.env` copiado de `.env.example`, imagen construida **sin caché** y base de datos nueva | **73 s** (60 s de construcción + 13 s de arranque) |
| Imagen ya construida, base existente | **21 s** |

Las imágenes base `postgres:16-alpine` y `node:20-alpine` ya estaban descargadas en ambas mediciones;
en un equipo que nunca las bajó, súmale el tiempo de descarga (depende de la conexión).

Al arrancar, la API aplica sola las migraciones: tablas, catálogo de categorías, roles y **datos
semilla** (los usuarios del paso 6). En la medición con base nueva se comprobó que los dos usuarios
de prueba inician sesión y que el reporte del profesional devuelve las cifras de la semilla.

## 5. Arrancar la app

```powershell
Set-Location "$HOME\habits-tracker\habits-tracker-app"
npm install
npm run web
```

Se abre en **http://localhost:8081**. Para el teléfono usa `npx expo start` y escanea el QR con Expo Go.

> Cada vez que cambies el `.env` de la app, reinicia con `npx expo start --clear`: la URL de la API
> queda dentro del código empaquetado.

## 6. Usuarios de prueba por rol

La migración `datos_semilla_por_rol` de la API crea un usuario de cada rol. **Son datos ficticios
de prueba**; en la base solo queda el hash de la contraseña:

| Rol | Correo | Contraseña de prueba | Qué puede hacer |
|---|---|---|---|
| `paciente` | `paciente@habitos.test` | `Paciente123` | Es Carlos Gómez, con 3 hábitos (Beber agua, Caminar, Dormir bien), su meta activa y 27 registros de los días anteriores. Gestiona sus hábitos, metas y registros; ve su inicio, historial y rachas; registra sin conexión |
| `profesional` | `profesional@habitos.test` | `Profesional123` | Ve la lista de pacientes y el progreso de cada uno por rango de fechas. No crea ni cambia datos de pacientes |

- Cada rol recibe `403 FORBIDDEN_ROLE` en las rutas del otro, y sin token, `401`.
- Una cuenta creada desde "Crear cuenta" siempre es `paciente`.
- Los registros de la semilla se fechan **respecto al día en que se aplicó la migración**: con una base
  recién creada, en "Progreso del paciente" (30 días) se ve Beber agua 10 de 12 (83 %), Caminar 6 de 8
  (75 %) y Dormir bien 5 de 7 (71 %).

> Son credenciales de **prueba** para la demostración local. No uses estos usuarios en un entorno
> público; ahí se crean cuentas nuevas.

## 7. Probar el almacenamiento local

La app guarda en el dispositivo (`AsyncStorage`; en el navegador, `localStorage`) los registros
hechos **sin conexión** y los sube solos cuando vuelve la red (S-06). Para verlo en el navegador:

1. Abre la app en Chrome (`npm run web`) e inicia sesión como `paciente@habitos.test`.
2. Abre las herramientas de desarrollo (`F12`) → pestaña **Network** → cambia *No throttling* por **Offline**.
3. Inicio → "+ Registrar cumplimiento" → elige un hábito **sin registro hoy** (con la semilla, "Caminar"),
   escribe un valor → "Guardar registro".
   Verás *"⏳ Sin conexión: el registro quedó pendiente y se subirá solo al recuperar la conexión."*
4. Arriba aparece la franja **"📡 Sin conexión · … · ⏳ 1 registro pendiente"**; en la pestaña
   Registros, el registro sale con borde punteado y "Pendiente de subir".
5. (Opcional) En **Application → Local Storage → http://localhost:8081** está la clave
   `hst:v1:pendientes` con el registro y su `clienteId`.
6. Vuelve a poner **No throttling** y pulsa **Reintentar** en la franja (o espera hasta 15 s): el registro
   se sube, deja de estar punteado y la franja desaparece.

En el teléfono (Expo Go) es igual, activando el modo avión. Ahí además la app guarda una **caché** de
los datos para abrirla sin red (S-05); en el navegador esa caché está desactivada a propósito, porque
`localStorage` no está cifrado. El caso completo, con el conflicto "gana el servidor", es
[TC-006](https://github.com/code-corhuila/habits-tracker-docs/blob/main/04-quality/test-cases/TC-006-registro-sin-conexion.md).

## 8. Ejecutar las pruebas

```powershell
# API: unitarias y de punta a punta (las segundas necesitan la base de datos encendida)
Set-Location "$HOME\habits-tracker\habits-tracker-api"
npm install
npm test
npm run test:e2e

# App
Set-Location "$HOME\habits-tracker\habits-tracker-app"
npm test
```

**Colección de Postman** (en `habits-tracker-api/postman/`), con la API encendida:

```powershell
Set-Location "$HOME\habits-tracker\habits-tracker-api"
npm run test:postman
```

Ejecuta las 18 peticiones con Newman (se descarga con `npx` la primera vez; no se instala en el proyecto)
y debe terminar con **24 aserciones y 0 fallos**: login de los dos roles, 401 sin token, 403 con el rol
equivocado, CRUD de hábito, registro duplicado (409), edición de registro, lista de pacientes y reporte de
progreso. Deja la base como estaba. También se puede importar en Postman los dos archivos
(`habits-tracker.postman_collection.json` y `local.postman_environment.json`) y pulsar *Run collection*.

**Resultado de referencia (2026-10-28):** API 35 unitarias y 113 e2e, app 97, Postman 24/24.

## 9. Detener y borrar

```powershell
Set-Location "$HOME\habits-tracker\habits-tracker-infra"
docker compose stop        # detiene los contenedores; los datos se conservan
docker compose down        # elimina los contenedores; los datos se conservan en el volumen
```

⚠️ **Destructivo:** el siguiente comando borra también la base de datos (usuarios, hábitos y
registros). Úsalo solo para empezar de cero:

```powershell
docker compose down -v
```

La app se detiene con `Ctrl + C` en su terminal.

## 10. Problemas frecuentes

Errores reales que el equipo encontró y resolvió:

| Síntoma | Causa | Solución |
|---|---|---|
| `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine` | Docker Desktop no estaba abierto | Abrir Docker Desktop, esperar a que diga *Engine running* y repetir `docker compose up -d --build` |
| En el teléfono, toda acción muestra "No pudimos conectar. Revisa tu conexión…" | `EXPO_PUBLIC_API_URL` tenía una IP que no era la del PC | Poner la IP real (`ipconfig`, "Dirección IPv4" de la Wi-Fi) y reiniciar con `npx expo start --clear`. Para comprobar, abrir `http://<IP>:3000/api/v1/categorias` en el navegador del teléfono |
| En PowerShell, `curl http://localhost:3000/...` muestra un error rojo aunque la API funciona | En PowerShell `curl` es un alias de `Invoke-WebRequest`, que trata un 401 como excepción | Usar `curl.exe` |
| `Port 8081 is being used by another process` al arrancar la app | Quedó abierto un servidor de Expo anterior | Cerrarlo en su terminal con `Ctrl + C`, o ver el proceso con `Get-NetTCPConnection -LocalPort 8081 -State Listen` y terminarlo |
