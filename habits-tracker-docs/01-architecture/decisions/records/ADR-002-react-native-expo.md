# ADR-002 — React Native + Expo como plataforma del cliente

- **ID:** ADR-002
- **Fecha:** 2026-09-08
- **Estado:** Aceptado
- **Autores:** Juan José Horta Vanegas, Javier Esteban Ortiz López

---

## Contexto

HU-01 cerró el stack del servidor (NestJS + Prisma + PostgreSQL) y, en su primera redacción,
asumió un cliente **web** con Next.js. Al aterrizar el alcance real de la asignatura
(Programación Móvil, 2026-B) el cliente pasó a ser una **aplicación móvil**, y hubo que decidir
con qué tecnología construirla.

**Restricciones conocidas:**
- Equipo de dos personas, sin experiencia previa en desarrollo nativo (Swift/Kotlin).
- **Ninguno de los dos tiene macOS**, lo que impide compilar y firmar para iOS localmente.
- El backend y sus tipos de dominio están en TypeScript; mantener un solo lenguaje ahorra
  traducciones entre contratos.
- La sustentación se hace en un teléfono físico del equipo, delante del tutor: el ciclo
  "cambio → ver el cambio en el teléfono" tiene que ser de segundos, no de minutos.
- Hay una versión web previa del producto cuya paleta e interacciones queremos conservar.

---

## Decisión

**Decidimos:** construir el cliente con **React Native 0.86 sobre Expo SDK 57**, en
TypeScript, usando el flujo gestionado de Expo (sin carpetas `android/` ni `ios/` en el repo).

**Justificación:**
Expo elimina exactamente los dos obstáculos que nos bloqueaban: la necesidad de macOS (los
builds de iOS se hacen en la nube con EAS) y el tiempo de configuración del entorno nativo.
Expo Go permite abrir la app en el teléfono del equipo escaneando un QR, lo que convierte la
demo de sprint en algo que efectivamente se hace en cada revisión, y no en capturas de
pantalla.

El desempate frente a React Native puro fue el coste de mantenimiento: con Expo, `npx expo
install --fix` alinea todas las dependencias con el SDK, mientras que en RN puro cada
actualización obliga a tocar Gradle y CocoaPods a mano. En un equipo de dos con fecha de corte,
ese tiempo sale directamente de las features.

Continuar en TypeScript mantiene la sinergia que HU-01 justificó: `src/types/index.ts` es un
espejo del `schema.prisma` del backend.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **React Native + Expo (elegida)** | Un solo código para Android/iOS/web; builds de iOS sin Mac vía EAS; Expo Go para demo inmediata; mismo lenguaje que el backend | Dependencia del ciclo de versiones del SDK; las librerías nativas fuera del ecosistema requieren *development build* | — (elegida) |
| React Native puro (CLI) | Control total sobre el código nativo; sin capa intermedia | Requiere macOS para iOS; configuración de Gradle y CocoaPods a mano; actualizaciones costosas | Nos bloquea iOS y consume tiempo de sprint en infraestructura |
| Flutter | Excelente rendimiento; UI muy consistente entre plataformas; herramientas maduras | Dart: segundo lenguaje que aprender, y se pierde el tipado compartido con NestJS; también necesita macOS para iOS | Rompe la homogeneidad lingüística que justificó todo el stack en HU-01 |
| Nativo Android (Kotlin) + nativo iOS (Swift) | Máximo rendimiento y acceso total a la plataforma | Dos bases de código para un equipo de dos; iOS inviable sin Mac | Inviable con los recursos del equipo |
| PWA responsiva sobre la web Next.js | Reutiliza el código web existente; despliegue trivial | No es una app móvil real: no se instala desde tienda, sin acceso nativo. No cumple el objetivo de la asignatura | No satisface el requisito |

---

## Consecuencias

**Positivas:**
- Una sola base de código cubre Android, iOS y web (`expo start --web`).
- Se puede compilar y firmar para iOS sin que nadie del equipo tenga un Mac.
- Ciclo de retroalimentación de segundos en dispositivo real con Expo Go.
- El modelo de dominio se comparte textualmente con el backend TypeScript.

**Negativas / Compromisos:**
- Quedamos atados al calendario de versiones de Expo: la versión de Expo Go del teléfono debe
  coincidir con el SDK del proyecto, o la app no abre.
- Cualquier módulo nativo fuera del ecosistema Expo obliga a pasar a *development build*, lo
  que añade un paso de compilación.
- El bundle de una app Expo es más pesado que su equivalente en RN puro.

**Impacto en el sistema:**
- Afecta a todo el cliente.
- Documentos a actualizar: [`../../project-structure.md`](../../project-structure.md),
  [`../../../05-release/ci-cd.md`](../../../05-release/ci-cd.md),
  [`../../../Project/HU-01.md`](../../../Project/HU-01.md).

---

## Verificación

Sobre Expo SDK 57 (React Native 0.86, React 19.2):

| Comprobación | Resultado |
|--------------|-----------|
| `npm install` | Sin errores |
| `npx tsc --noEmit` | Sin errores de tipos |
| `npx expo install --check` | Dependencias alineadas con el SDK |
| `npx expo export --platform android` | Bundle generado (2 MB) |

---

## Referencias

- Relacionado con: [ADR-001](./ADR-001-state-management-pattern.md), [`../../../Project/HU-01.md`](../../../Project/HU-01.md)
