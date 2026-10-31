# 📱 Habitos Saludables — App Movil

> React Native + Expo + TypeScript · consume la API de [`habits-tracker-api`](https://github.com/code-corhuila/habits-tracker-api)
> Programacion Movil 2026-B — CORHUILA

Aplicacion movil del **Sistema de Seguimiento de Habitos Saludables**. La app se conecta
al API del repositorio `habits-tracker-api`: las cuentas, habitos, metas y
registros se guardan en PostgreSQL, la sesion se custodia en `expo-secure-store`, una
cache local permite abrir la app con contenido aunque no haya red y los registros hechos sin
conexion esperan en una cola que se sube sola al volver la red. Tiene dos roles: **paciente** y
**profesional** (panel de pacientes y reporte de progreso).

La guia completa (arquitectura, codigo explicado, ejecucion paso a paso y preparacion de la
sustentacion) esta en el repositorio de documentacion: `GUIA_COMPLETA_DEL_PROYECTO.md`.

---

## 🚀 Como ejecutarla

**1. La base de datos y el API** se levantan desde [`habits-tracker-infra`](https://github.com/code-corhuila/habits-tracker-infra)
(necesita Docker Desktop abierto). El manual de implementación completo está en su README.

**2. La app.** Copia `.env.example` como `.env` y pon la URL del API para tu dispositivo:

```powershell
Copy-Item .env.example .env   # edita EXPO_PUBLIC_API_URL
npm install
npm run web                   # se abre en http://localhost:8081
```

Para el teléfono usa `npx expo start --clear` y escanea el QR con Expo Go.

Desde el panel de Expo:

- **Celular** — instala *Expo Go* y escanea el codigo QR (el telefono y el PC en la misma red Wi-Fi).
  La URL del API debe usar la IP del PC (`ipconfig`), no `localhost`.
- **Android (emulador)** — presiona `a`; la URL del API es `http://10.0.2.2:3000/api/v1`.
- **Navegador** — presiona `w`; la URL del API es `http://localhost:3000/api/v1`.

> `--clear` hace falta cada vez que cambias el `.env`: la URL queda dentro del codigo
> empaquetado. La version de Expo Go del celular debe coincidir con el SDK 57.

**Usuarios de prueba** (los crea la API al migrar): paciente `paciente@habitos.test` / `Paciente123`
y profesional `profesional@habitos.test` / `Profesional123`.

### Verificado (2026-10-28)

| Comprobacion | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ sin errores de tipos |
| `npm test` | ✅ 97 pruebas |
| Recorrido por la interfaz en el navegador, contra el API en Docker | ✅ profesional 8/8 y paciente 17/17 comprobaciones (roles, edicion, registro sin conexion) |
| `npx expo export --platform android` y `--platform web` | ✅ bundles generados |
| Flujo completo en navegador contra el API en Docker (2026-10-25) | ✅ login, registro, habitos, metas, registros, cierre de sesion y archivado |
| `npx expo install --check` | ⚠️ `expo` 57.0.20 tiene un parche mas nuevo (57.0.31); ya estaba asi en la v1.0.0 |
| iOS | ❌ no verificado: el equipo no tiene macOS ni iPhone |

---

## 📂 Estructura

```
habits-tracker-app/
├── App.tsx                  # Providers globales
├── index.ts                 # Punto de entrada de Expo
├── app.json                 # Configuracion de la app (nombre, tema, plugins)
├── jest.config.js           # Pruebas (preset jest-expo)
├── .env.example             # URL del API por dispositivo (EXPO_PUBLIC_API_URL)
└── src/
    ├── components/          # Piezas de UI reutilizables, sin acceso al contexto
    │   ├── AppButton.tsx        Boton con 3 variantes y estado "cargando"
    │   ├── AvisoSinConexion.tsx Franja "Sin conexion · Reintentar"
    │   ├── Badge.tsx · Card.tsx · ChipSelector.tsx · EmptyState.tsx · Input.tsx
    │   ├── PantallaEstado.tsx   Pantalla completa de carga o error
    │   ├── ScreenHeader.tsx · SegmentedTabs.tsx · StatCard.tsx · WeekChart.tsx
    │   └── dialogos.ts          Confirmaciones y avisos (Android, iOS y web)
    │
    ├── constants/theme.ts   # Colores, espaciados, radios, tipografia
    ├── context/AppContext.tsx  # Estado global: sesion, datos, acciones, cache
    ├── navigation/          # AppNavigator (stack con guardia de sesion) y TabNavigator
    ├── screens/             # Una pantalla completa por archivo
    ├── services/            # Comunicacion con el API (apiFetch y un modulo por recurso)
    ├── storage/             # Token (expo-secure-store) y cache del dominio (AsyncStorage)
    ├── types/index.ts       # Modelos de dominio y rutas tipadas
    └── utils/               # Funciones puras: fechas, rachas, numeros
```

**Criterio de la estructura:** cada carpeta responde a una pregunta.
`screens` = qué ve el usuario · `components` = con qué está hecho ·
`context` = qué datos hay · `navigation` = cómo se llega ·
`services` = cómo se habla con el servidor · `storage` = qué se guarda en el teléfono ·
`utils` = lógica pura sin UI · `constants` = valores que no cambian ·
`types` = la forma de los datos.

---

## 🗺 Flujo de navegacion

```
Sin sesion:   Login ⇄ Registro
Paciente:     Tabs ────────────────────────────► NuevoRegistro (modal: crear o editar)
                ├── 🏠 Inicio      Dashboard
                ├── 📌 Habitos     Crear · editar · eliminar/archivar
                ├── 🎯 Metas       Crear · editar · activar/desactivar · eliminar
                ├── 📋 Registros   Filtro · pendientes de subir · editar · eliminar
                └── 📊 Historial   Por mes / por semana
Profesional:  Pacientes ──► ProgresoPaciente (rango de fechas)
```

El stack raiz decide que grupo existe segun la sesion y el **rol**: sin sesion la ruta `Tabs` no
existe, y cada rol solo tiene montadas sus pantallas (la API, ademas, responde 403 al otro rol).

---

## ✅ Que funciona

| Pantalla | Interacciones |
|---|---|
| **Login** | Valida campos, autentica contra el API, muestra el error del servidor |
| **Registro** | Crea la cuenta en el API y entra directamente |
| **Dashboard** | 4 metricas, grafica semanal, rachas, registros de hoy, cerrar sesion |
| **Habitos** | Crear y editar (modal; la categoria no se edita); eliminar: se borra o, si tiene registros, se archiva |
| **Metas** | Crear, editar, activar/desactivar y eliminar; una sola meta activa por habito |
| **Registros** | Filtrar por habito, ver los pendientes de subir, editar (✎) y eliminar (✕) con confirmacion |
| **Nuevo registro** | Elegir habito, navegar por fechas; el servidor decide si la meta se cumplio. Con `registroId` edita valor y notas. Sin red, el registro queda pendiente (⏳) |
| **Pacientes** (profesional) | Lista de pacientes del centro; tocar uno abre su progreso |
| **Progreso del paciente** (profesional) | 7 dias / 30 dias / Este mes y flechas Desde/Hasta; adherencia y racha maxima por habito |
| **Historial** | Alternar mes/semana, elegir mes; los habitos archivados aparecen como "[Archivado]" |

Las reglas de negocio las impone el servidor (un registro por habito y fecha, una meta activa
por habito, archivar en vez de borrar un habito con historial, `metaCumplida` calculada al
crear). La app muestra el mensaje que devuelve el API.

## ⏳ Que NO tiene todavia

- Pantalla de perfil para editar edad, peso y estatura despues del alta.
- La cache de lectura (S-05) y la cola sin conexion (S-06) estan cubiertas por pruebas automaticas
  y probadas en el navegador; falta un recorrido en un telefono real con Expo Go.
- Editar o eliminar sin red (solo crear un registro funciona sin conexion).

## 🧪 Pruebas

```powershell
npm test        # 97 pruebas: rachas, fechas, rangos, numeros, cliente HTTP, cache, cola sin conexion y contexto (sesion por rol, edicion, S-06)
```

La API tiene sus propias pruebas unitarias, e2e y colección de Postman (ver `habits-tracker-api`).

---

## 🎨 Diseno

Misma paleta oscura que la version web, centralizada en `constants/theme.ts`:

| Uso | Color |
|---|---|
| Fondo | `#0D1117` |
| Superficie | `#161B22` |
| Borde | `#30363D` |
| Acento | `#2DD4BF` |
| Exito | `#3FB950` |
| Alerta | `#F0883E` |
| Error | `#F85149` |

Ningun color se escribe suelto dentro de una pantalla: todos salen del tema.
