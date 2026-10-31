# Estructura del Proyecto

El proyecto vive en **cuatro repositorios** de la organización `code-corhuila`
([ADR-010](./decisions/records/ADR-010-separacion-en-cuatro-repositorios.md), que reemplaza a ADR-009):

| Repositorio | Qué contiene |
| :--- | :--- |
| `habits-tracker-docs` | Esta documentación (marco SDD, ADR, contrato, modelo de datos, calidad, release) |
| `habits-tracker-app` | App móvil Expo / React Native |
| `habits-tracker-api` | API NestJS + Prisma + PostgreSQL, con sus migraciones, datos semilla, pruebas y colección Postman |
| `habits-tracker-infra` | `docker-compose.yml`, `.env.example` y el manual de implementación (sin DDL) |

> La copia que hay en `05-release/healthy-habits-tracker/` de este repositorio de documentación
> es una entrega anterior y está **obsoleta**: no se edita.

---

## Estructura real de `habits-tracker-app`

```
habits-tracker-app/
├── App.tsx                  Providers globales (SafeArea + AppProvider + navegación)
├── index.ts                 Punto de entrada de Expo (registerRootComponent)
├── app.json                 Configuración de la app (nombre, slug, tema, iconos)
├── .env.example             EXPO_PUBLIC_API_URL (la URL de la API; no es un secreto)
├── tsconfig.json            TypeScript en modo strict
├── jest.config.js           Pruebas con el preset jest-expo (ADR-006)
└── src/
    ├── components/          Piezas de UI reutilizables, sin lógica de negocio
    │                        (AppButton, Card, Input, WeekChart, AvisoSinConexion, PantallaEstado, dialogos…)
    ├── constants/           Valores fijos: theme.ts (tokens y umbrales de cumplimiento)
    ├── context/             Estado global: AppContext.tsx (+ su prueba)
    ├── navigation/          AppNavigator.tsx (stack raíz por rol) y TabNavigator.tsx (pestañas del paciente)
    ├── screens/             Una pantalla completa por archivo (10: 8 del paciente, 2 del profesional)
    ├── services/            Cliente HTTP (api.ts → apiFetch) y un archivo por recurso del contrato
    ├── storage/             seguro.ts (token, expo-secure-store), cache.ts y pendientes.ts (AsyncStorage)
    ├── types/               Modelos de dominio y tipos de rutas
    └── utils/               Funciones puras sin UI: date, numeros, racha, rango (+ sus pruebas)
```

## Estructura real de `habits-tracker-api`

```
habits-tracker-api/
├── Dockerfile               Imagen de la API (la usa el docker-compose de habits-tracker-infra)
├── .env.example             Variables necesarias, con valores de ejemplo
├── prisma/
│   ├── schema.prisma        Modelo: Usuario (con rol), CategoriaHabito, Habito, Meta, RegistroDiario
│   └── migrations/          inicial · catalogo_categorias · roles_de_usuario · datos_semilla_por_rol
├── postman/                 Colección y entorno local (npm run test:postman)
├── src/
│   ├── auth/                Login, registro, JWT, JwtAuthGuard y RolesGuard (@Roles)
│   ├── common/              Errores RFC 7807, validación, fechas
│   ├── config/              Validación de variables de entorno al arrancar
│   ├── categorias/ habitos/ metas/ registros/   Un módulo por recurso del paciente
│   ├── usuarios/            GET /usuarios/me y la lista de pacientes del profesional
│   ├── reportes/            GET /reportes/progreso (panel del profesional)
│   └── prisma/              PrismaService
└── test/                    Pruebas e2e con Supertest contra PostgreSQL (esquema e2e)
```

---

## Por qué esta estructura y no "feature-first"

El marco documental base propone organizar por feature
(`features/<feature>/{presentation,domain,data}`). **Este proyecto no lo hace**, y la razón
está registrada: era una app de 8 pantallas (hoy 10: 8 del paciente y 2 del profesional) con un único modelo de dominio compartido por
todas ellas. Un `HabitosScreen` no puede existir sin `Meta`, ni `Meta` sin `Habito`.
Partir eso en carpetas por feature habría creado imports cruzados entre features desde el
primer día, que es justo lo que la regla feature-first busca evitar.

La estructura elegida organiza por **rol técnico**, y el criterio es que cada carpeta
responde a una pregunta:

| Carpeta | Pregunta que responde |
|---------|------------------------|
| `screens/` | ¿Qué ve el usuario? |
| `components/` | ¿Con qué está hecho? |
| `context/` | ¿Qué datos hay y qué se puede hacer con ellos? |
| `navigation/` | ¿Cómo se llega de una pantalla a otra? |
| `utils/` | ¿Qué lógica pura existe, sin UI? |
| `constants/` | ¿Qué valores no cambian? |
| `types/` | ¿Qué forma tienen los datos? |

> **Umbral de revisión:** si la app supera ~15 pantallas o aparece un segundo dominio sin
> relación con hábitos (por ejemplo, mensajería con el profesional), esta decisión se
> reevalúa con un ADR nuevo que supersede a
> [ADR-007](./decisions/records/ADR-007-estructura-por-rol-tecnico.md).

---

## Reglas

- **Un archivo declara un tipo principal** y el nombre del archivo lo refleja
  (`AppButton.tsx` exporta `AppButton`).
- **Las pantallas no calculan reglas de negocio.** Una pantalla lee del contexto, valida el
  formulario y muestra el resultado. Toda invariante del dominio vive en `AppContext.tsx` o
  en `utils/`.
- **Los componentes de `components/` no conocen el contexto.** Reciben todo por props. Si un
  componente necesita llamar a `useApp()`, es una pantalla disfrazada.
- **`utils/` no importa nada de React ni de React Native.** Son funciones puras, y esa
  pureza es lo que las hace probables sin renderizar nada.
- **Ninguna pantalla llama al API ni al almacenamiento directamente.** Solo `AppContext.tsx` usa
  `services/` y `storage/`. Por eso `mockData.ts` se pudo borrar sin romper ninguna pantalla.
- **Nada fuera de `constants/theme.ts` define un color, un espaciado, un radio o un tamaño de
  fuente.**

---

## Convenciones de nombres

| Cosa | Convención | Ejemplo |
|------|------------|---------|
| Componente / pantalla | `PascalCase.tsx` | `WeekChart.tsx`, `DashboardScreen.tsx` |
| Módulo de utilidades | `camelCase.ts` | `date.ts`, `racha.ts` |
| Tipo / interfaz | `PascalCase` | `RegistroDiario`, `AppState` |
| Función y variable | `camelCase`, **en español** | `metaActivaDe`, `registrosDeHoy` |
| Constante de módulo | `UPPER_SNAKE_CASE` | `SEMILLA`, `FORMULARIO_VACIO`, `ALTURA_MAXIMA` |
| Booleano | prefijo `es` / `tiene` / `hay` | `esContrasena`, `metaCumplida` |

> El código de dominio se nombra **en español** a propósito: `RegistroDiario`, `rachaMaxima`,
> `valorObjetivo`. Coincide con el lenguaje del negocio, con las HU y con el `schema.prisma`
> del backend, y evita traducciones mentales en la revisión. Los nombres de la plataforma
> (`onPress`, `useState`, `style`) se mantienen en inglés porque son de la librería.

---

## Carpetas añadidas en la integración con el backend (2026-10-25)

| Carpeta | Contiene | Documentada en |
|---------|----------|----------------|
| `src/services/` | `api.ts` con el `apiFetch` único y un módulo por recurso (`auth`, `habitos`, `metas`, `registros`) | [`03-api-and-data/api-networking.md`](../03-api-and-data/api-networking.md) |
| `src/storage/` | `seguro.ts` (token en `expo-secure-store`) y `cache.ts` (caché del dominio en `AsyncStorage`) | [`03-api-and-data/persistence.md`](../03-api-and-data/persistence.md) |
| `*.test.ts(x)` junto al archivo | Pruebas de Jest | [`04-quality/testing-strategy.md`](../04-quality/testing-strategy.md) |

Sigue reservada, sin usar todavía: `src/hooks/` (hooks compartidos entre pantallas).
