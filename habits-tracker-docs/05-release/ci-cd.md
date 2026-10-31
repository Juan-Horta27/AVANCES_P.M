# CI/CD

> **Estado actual: solo existe el workflow de release de GitHub** (`.github/workflows/release.yml`),
> que crea la publicación de GitHub a partir de una etiqueta `vX.Y.Z`. No hay pipeline de
> verificación ni de build de la app. Este documento define el pipeline objetivo.

---

## Principios

- **Builds reproducibles desde CI.** Ninguna subida a tienda se hace desde el portátil de un
  integrante.
- **Perfiles separados por entorno:** `dev`, `preview` y `production` en `eas.json`.
- Todos los valores de entorno (URL base del API, banderas) se inyectan en tiempo de build.
  Ninguno se escribe en el código.

---

## Herramienta de build: EAS Build

Por [ADR-002](../01-architecture/decisions/records/ADR-002-react-native-expo.md), la app usa el
flujo gestionado de Expo. Los binarios se compilan en **EAS Build**, en la nube.

Esto no es un detalle de comodidad: **ningún integrante del equipo tiene macOS**, y sin EAS no
sería posible generar ni firmar un `.ipa` para iOS.

---

## Etapas del pipeline

| # | Etapa | Cuándo corre | Falla si... |
|---|-------|--------------|-------------|
| 1 | `npm ci` | Siempre | Las dependencias no resuelven |
| 2 | `npx tsc --noEmit` | Siempre | Hay algún error de tipos |
| 3 | `npx eslint .` | Siempre | Hay un error **o una advertencia** |
| 4 | `npm test` | Siempre | Alguna prueba falla o la cobertura baja del mínimo |
| 5 | `npx expo install --check` | Siempre | Alguna dependencia se desalineó del SDK |
| 6 | `npm audit --audit-level=high` | Siempre | Hay una vulnerabilidad alta o crítica |
| 7 | `eas build --profile preview` | Merge a `main` | El build falla |
| 8 | Distribución interna | Merge a `main` | — |
| 9 | Captura del tamaño del bundle | Antes de la release | — |
| 10 | `eas build --profile production` + `eas submit` | Etiqueta `vX.Y.Z`, tras el visto bueno | — |

> **Estado (2026-10-25):** ya existe la suite de pruebas (etapa 4). Siguen sin poder correr la
> etapa 3 en la app (ESLint no está configurado en la app; sí en `habits-tracker-api`) y la 6 (`npm audit`,
> que hoy reporta vulnerabilidades conocidas). El workflow de verificación en cada PR todavía no
> existe: las etapas están enumeradas para que crearlo sea completar, no rediseñar.

---

## Disparadores

| Evento | Etapas |
|--------|--------|
| Pull request | 1-6 |
| Merge a `main` | 1-8 |
| Etiqueta `vX.Y.Z` | 1-10 + publicación de GitHub |

**Nota sobre el repositorio de documentación:** este repo usa una sola rama, `main` (guía del corte 3), y no tiene CI de código
([política de ramas](../00-governance/git-conventions.md)), así que en él solo corre el workflow
de etiqueta. Las etapas 1-8 aplican a los repositorios de código (`habits-tracker-app` y `habits-tracker-api`).

---

## Entornos

| Perfil EAS | `EXPO_PUBLIC_API_URL` | Distribución |
|------------|------------------------|--------------|
| `dev` | IP local del equipo, HTTP permitido | Expo Go / development build |
| `preview` | API de staging, HTTPS | Enlace interno de EAS, APK instalable |
| `production` | API de producción, HTTPS | Google Play y App Store |

**HTTP en claro solo se permite en el perfil `dev`**, y esa restricción es parte de
[`../00-governance/security-rules.md`](../00-governance/security-rules.md).

---

## Secretos

| Secreto | Dónde vive |
|---------|------------|
| Keystore de Android y certificados de iOS | Gestionados por EAS |
| `EXPO_TOKEN` (para que CI invoque EAS) | GitHub Secrets |
| Credenciales de las tiendas | EAS Submit |
| Valores de entorno no sensibles | `eas.json`, por perfil |

**Nada de esto se commitea.** `EXPO_PUBLIC_API_URL` es la excepción y no es un secreto: viaja
legible dentro del bundle, por eso lleva ese prefijo.

---

## Workflow actual

`.github/workflows/release.yml` hace hoy una sola cosa: al empujar una etiqueta `v*.*.*`, crea
la publicación de GitHub con notas generadas automáticamente. Es correcto y se mantiene; lo que
falta es el workflow de verificación que corra en cada PR.

---

## Distribución durante el desarrollo

Mientras el pipeline completo no exista, el mecanismo de distribución del equipo es **Expo Go**:
`npm start` levanta el panel, el teléfono escanea el QR y la app corre al instante. Es suficiente
para las demos de sprint y para la sustentación, y es lo que permite que la revisión de sprint
se haga siempre en dispositivo real
(ver [`../00-governance/agile-conventions.md`](../00-governance/agile-conventions.md)).

> ⚠️ La versión de Expo Go instalada en el teléfono debe coincidir con el SDK del proyecto
> (SDK 57). Si Expo Go se actualiza y la app deja de abrir, hay que subir el proyecto con
> `npm install expo@^<nueva>` y después `npx expo install --fix`.
