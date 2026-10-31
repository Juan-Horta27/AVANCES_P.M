# Estándares de Código

Aplican a todo el código de `05-release/healthy-habits-tracker/`.

---

## Principios

- **Inmutabilidad primero** — nunca se muta un arreglo ni un objeto de estado. Se crea uno nuevo.
- **Unidades pequeñas** — una función hace una cosa; un archivo declara un tipo principal.
- **Sin valores mágicos** — todo color, espaciado, radio o tamaño sale de `constants/theme.ts`;
  los umbrales con significado se extraen a una constante con nombre (`ALTURA_MAXIMA`, `TODOS`).
- **Fallar pronto** — validar en la frontera (el formulario, la acción del contexto) y devolver
  un resultado explícito, nunca tragarse un error en silencio.

---

## TypeScript

- `strict: true` está activado en `tsconfig.json`. **No se desactiva.**
- Prohibido `any`. Si un tipo no se conoce, es `unknown` y se estrecha.
- Prohibido el operador `!` de aserción no nula. Se comprueba y se maneja el caso nulo.
- Se prefiere `interface` para la forma de los datos y `type` para uniones y alias
  (`type Frecuencia = 'diaria' | 'semanal'`).
- Los objetos de configuración que no cambian se marcan `as const` (así están `colors`,
  `spacing`, `radius`, `fontSize`).
- Los props de los componentes se declaran en una `interface Props` local al archivo.
- `npx tsc --noEmit` debe pasar sin errores antes de abrir un PR. Es parte del DoD.

---

## Nombres

| Tipo de cosa | Convención | Ejemplo real |
|--------------|------------|--------------|
| Componente / pantalla | `PascalCase` | `WeekChart`, `DashboardScreen` |
| Tipo / interfaz | `PascalCase` | `RegistroDiario`, `AppState`, `Props` |
| Función / variable | `camelCase`, **en español** | `metaActivaDe`, `registrosDeHoy`, `confirmarEliminar` |
| Constante de módulo | `UPPER_SNAKE_CASE` | `SEMILLA`, `FORMULARIO_VACIO`, `DIAS_CORTOS`, `TODOS` |
| Booleano | prefijo `es` / `tiene` / `hay` / `activo` | `esContrasena`, `metaCumplida`, `deshabilitado` |
| Manejador de evento | `verbo` + sustantivo | `manejarIngreso`, `guardar`, `cerrarModal`, `alternarMeta` |

**El dominio se nombra en español.** `RegistroDiario`, `valorObjetivo`, `rachaMaxima`. Coincide
con las HU y con el `schema.prisma` del backend, y evita traducir mentalmente en cada revisión.
Lo que viene de la plataforma (`onPress`, `useState`, `style`, `children`) se queda en inglés.

> **Nota sobre acentos:** el código no lleva tildes en identificadores ni en literales
> (`contrasena`, `Habitos`). Es una decisión deliberada para evitar problemas de codificación
> entre Windows, Android e iOS. **Los textos que el usuario lee sí deben llevar tilde**, y esa
> corrección se hará al centralizarlos (ver [i18n.md](./i18n.md)).

---

## Estructura de un componente

Orden fijo dentro de cada archivo `.tsx`:

1. Imports: primero librerías, después módulos propios (`../constants`, `../context`, `../utils`).
2. Tipos locales (`interface Props`).
3. Constantes del módulo.
4. El componente exportado por defecto.
5. Funciones auxiliares privadas del archivo.
6. `const styles = StyleSheet.create({ ... })` **al final**.

Este orden ya lo siguen todos los archivos existentes; mantenerlo hace que cualquiera encuentre
lo que busca sin leer el archivo entero.

---

## Estilos

- Siempre `StyleSheet.create`, nunca objetos de estilo en línea dentro del JSX.
- La única excepción admitida es un valor calculado en tiempo de render (la altura de una barra
  en `WeekChart`, el color de un `Badge`), y va combinado en un arreglo:
  `style={[styles.barra, { height: altura }]}`.
- **Ningún valor literal de color, espaciado, radio o tamaño de fuente fuera de `theme.ts`.**
- Las variantes de un componente se declaran como un mapa de `StyleSheet` (patrón de
  `AppButton`), no como cadenas de condicionales dentro del JSX.

---

## Manejo de errores

- Las acciones del contexto que pueden fallar devuelven `{ ok: boolean; mensaje?: string }`.
  **No lanzan excepciones y no muestran alertas**: quién y cómo se comunica el error lo decide
  la pantalla.
- Los errores de validación de formulario se muestran **dentro** de la pantalla, en el bloque de
  alerta en rojo.
- Los errores de una acción destructiva o de negocio se muestran con `Alert.alert` nativo.
- Toda falla visible al usuario tiene un mensaje **y** una salida (reintentar, cerrar, corregir).

---

## Asincronía

> Hoy no hay nada asíncrono. Estas reglas entran en vigor con
> [ADR-005](../01-architecture/decisions/records/ADR-005-cliente-http.md).

- Toda llamada asíncrona maneja su rama de error.
- Todo trabajo en vuelo se cancela al desmontar la pantalla (`AbortController` en `apiFetch`).
- Todo `setTimeout` se limpia en el retorno del `useEffect`.
  **Deuda actual:** `NuevoRegistroScreen` usa `setTimeout(..., 900)` sin limpiarlo.
- Nada bloquea el hilo de la interfaz.

---

## Linter

> **Estado: pendiente.** Hoy la única verificación automática es `npx tsc --noEmit`.

Plan acordado en la retrospectiva del Sprint 1:

```bash
npx expo install eslint eslint-config-expo prettier --dev
```

- `eslint-config-expo` como base, más `plugin:@typescript-eslint/recommended`.
- **El CI falla ante una advertencia**, no solo ante un error.
- Ninguna regla se desactiva en línea sin un comentario que explique por qué.
