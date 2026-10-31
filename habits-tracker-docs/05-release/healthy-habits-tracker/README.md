# 📱 Habitos Saludables — App Movil

> Version inicial · React Native + Expo + TypeScript
> Programacion Movil 2026-B · Grupo 1 — CORHUILA

Aplicacion movil del **Sistema de Seguimiento de Habitos Saludables**. Esta primera
version cubre **la interfaz y la interaccion**: todos los botones funcionan y el
estado cambia de verdad, pero los datos viven en memoria (aun **no hay conexion al
backend NestJS**).

---

## 🚀 Como ejecutarla

```bash
cd 05-release/healthy-habits-tracker
npm install
npm start
```

El ultimo comando abre el panel de Expo. Desde ahi:

- **Celular** — instala *Expo Go* y escanea el codigo QR (el telefono y el PC deben estar en la misma red Wi-Fi).
- **Android** — presiona `a` para abrir el emulador.
- **iOS** — presiona `i` (solo en macOS).
- **Navegador** — presiona `w`.

> Las versiones del `package.json` ya estan alineadas con el SDK de Expo y hay
> `package-lock.json`, asi que `npm install` basta. Si algun dia actualizas el SDK
> y algo deja de arrancar, `npx expo install --fix` vuelve a alinear todo.

### Verificado

Sobre **Expo SDK 57** (React Native 0.86, React 19.2):

| Comprobacion | Resultado |
|---|---|
| `npm install` | ✅ sin errores |
| `npx tsc --noEmit` | ✅ sin errores de tipos |
| `npx expo install --check` | ✅ dependencias alineadas con el SDK |
| `npx expo export --platform android` | ✅ bundle generado (2 MB) |

> La version de Expo Go del celular debe coincidir con el SDK del proyecto.
> Si actualizas Expo Go y deja de abrir, sube el proyecto con
> `npm install expo@^<nueva>` y luego `npx expo install --fix`.

---

## 📂 Estructura

```
healthy-habits-tracker/
├── App.tsx                  # Providers globales
├── index.ts                 # Punto de entrada de Expo
├── app.json                 # Configuracion de la app (nombre, tema, iconos)
└── src/
    ├── components/          # Piezas de UI reutilizables
    │   ├── AppButton.tsx        Boton con 3 variantes
    │   ├── Badge.tsx            Etiqueta de estado
    │   ├── Card.tsx             Contenedor base
    │   ├── ChipSelector.tsx     Selector horizontal (reemplaza al <select>)
    │   ├── EmptyState.tsx       Estado vacio de las listas
    │   ├── Input.tsx            Campo de texto con etiqueta
    │   ├── ScreenHeader.tsx     Encabezado de pantalla
    │   ├── SegmentedTabs.tsx    Alternador de vistas
    │   ├── StatCard.tsx         Tarjeta de metrica
    │   └── WeekChart.tsx        Grafica semanal de barras
    │
    ├── constants/           # Valores fijos de la app
    │   ├── theme.ts             Colores, espaciados, radios, tipografia
    │   └── mockData.ts          Datos de ejemplo
    │
    ├── context/             # Estado global
    │   └── AppContext.tsx       Estado + acciones (login, CRUD, rachas)
    │
    ├── navigation/          # Rutas
    │   ├── AppNavigator.tsx     Stack raiz
    │   └── TabNavigator.tsx     Pestanas inferiores
    │
    ├── screens/             # Pantallas completas
    │   ├── LoginScreen.tsx
    │   ├── RegisterScreen.tsx
    │   ├── DashboardScreen.tsx
    │   ├── HabitosScreen.tsx
    │   ├── MetasScreen.tsx
    │   ├── RegistrosScreen.tsx
    │   ├── NuevoRegistroScreen.tsx
    │   └── HistorialScreen.tsx
    │
    ├── types/               # Modelos TypeScript
    │   └── index.ts
    │
    └── utils/               # Funciones puras
        ├── date.ts              Manejo de fechas 'YYYY-MM-DD'
        └── racha.ts             Calculo de racha actual y maxima
```

**Criterio de la estructura:** cada carpeta responde a una pregunta.
`screens` = qué ve el usuario · `components` = con qué está hecho ·
`context` = qué datos hay · `navigation` = cómo se llega ·
`utils` = lógica pura sin UI · `constants` = valores que no cambian ·
`types` = la forma de los datos.

---

## 🗺 Flujo de navegacion

```
Login ──► Tabs ──────────────────────────────► NuevoRegistro (modal)
  │        ├── 🏠 Inicio      Dashboard
  ▼        ├── 📌 Habitos     Lista + crear + eliminar
Registro   ├── 🎯 Metas       Lista + crear + activar/desactivar
           ├── 📋 Registros   Lista + filtro + eliminar
           └── 📊 Historial   Por mes / por semana
```

---

## ✅ Que funciona en esta version

| Pantalla | Interacciones |
|---|---|
| **Login** | Valida campos, muestra error, entra a la app |
| **Registro** | Valida obligatorios y longitud de contrasena, crea la cuenta |
| **Dashboard** | 4 metricas en vivo, grafica semanal, rachas, registros de hoy, cerrar sesion |
| **Habitos** | Crear (modal con categoria y unidad), eliminar con confirmacion |
| **Metas** | Crear meta, activar/desactivar, valida una sola meta activa por habito |
| **Registros** | Filtrar por habito, eliminar con confirmacion |
| **Nuevo registro** | Elegir habito, navegar por fechas, calcular si la meta se cumplio |
| **Historial** | Alternar mes/semana, elegir mes, barras de cumplimiento |

Las reglas de negocio del backend estan replicadas en el cliente:

- Un unico registro por habito y fecha.
- Una sola meta activa por habito.
- No se puede eliminar un habito que ya tiene registros.
- `metaCumplida` se calcula comparando el valor registrado con la meta activa.

## ⏳ Que NO tiene todavia (siguiente iteracion)

- Conexion real al backend (`services/` con `fetch` y JWT).
- Persistencia entre sesiones (`AsyncStorage`).
- Edicion de habitos, metas y registros.
- Pantalla de perfil y de categorias.
- Tests.

---

## 🔌 Como conectarla al backend despues

El estado global ya esta aislado, asi que la migracion no toca las pantallas:

1. Crear `src/services/api.ts` con un `apiFetch` que inyecte el token JWT.
2. Reemplazar el cuerpo de las acciones de `AppContext.tsx` por llamadas al API.
3. Guardar el token con `expo-secure-store`.
4. Borrar `constants/mockData.ts`.

> ⚠️ En Android, `localhost` apunta al propio emulador. Para llegar al backend
> del PC hay que usar la IP de la maquina (ej. `http://192.168.1.10:3001`) o
> `http://10.0.2.2:3001` en el emulador de Android Studio.

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

---

## 📚 Documentacion del proyecto

Este codigo es el cliente movil del **Sistema de Seguimiento de Habitos Saludables**. Toda la
documentacion de diseno, arquitectura y gobernanza vive en la raiz de este repositorio:

| Que buscas | Donde esta |
|---|---|
| Por que se eligio este stack | [`Project/HU-01.md`](../../Project/HU-01.md) |
| Que problema resuelve y para quien | [`Project/HU-02.md`](../../Project/HU-02.md) |
| Por que la estructura de `src/` es asi | [`01-architecture/project-structure.md`](../../01-architecture/project-structure.md) |
| Como funciona el estado global | [`01-architecture/layers-and-state.md`](../../01-architecture/layers-and-state.md) |
| Las decisiones tecnicas y sus alternativas | [`01-architecture/decisions/`](../../01-architecture/decisions/) |
| Reglas de codigo, tema y accesibilidad | [`02-code-and-ui/`](../../02-code-and-ui/) |
| Contrato del API y persistencia (por implementar) | [`03-api-and-data/`](../../03-api-and-data/) |
| Estrategia de pruebas y casos manuales | [`04-quality/`](../../04-quality/) |
| Como se publica y se observa | [`05-release/`](../) |

**Antes de tu primer commit**, lee [`00-governance/`](../../00-governance/): convenciones de git,
definicion de listo y terminado, y reglas de seguridad.
