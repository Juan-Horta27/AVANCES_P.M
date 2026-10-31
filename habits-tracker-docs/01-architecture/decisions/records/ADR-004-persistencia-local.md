# ADR-004 — Persistencia local: AsyncStorage para datos, expo-secure-store para el token

- **ID:** ADR-004
- **Fecha:** 2026-09-17
- **Estado:** Aceptado — implementado: token (expo-secure-store) y caché de dominio (AsyncStorage), 2026-10-25
- **Autores:** Juan José Horta Vanegas, Javier Esteban Ortiz López

---

## Contexto

Hoy todo el estado vive en memoria: al cerrar la app, el usuario pierde la sesión y cualquier
hábito, meta o registro que haya creado. Es la limitación más visible de la versión actual y
la primera queja previsible en la sustentación.

Hay dos necesidades distintas que a menudo se confunden:

1. **Guardar el token de sesión** para no pedir credenciales en cada arranque. Es un secreto.
2. **Guardar una copia de los datos** (hábitos, metas, registros) para que la app abra con
   contenido aunque no haya red. No es un secreto, pero sí es información de salud.

**Restricciones conocidas:**
- El volumen de datos es pequeño: un usuario con 10 hábitos y un año de registros diarios está
  en el orden de 3.600 filas. Cabe cómodamente en memoria.
- Las consultas que hace la app (filtrar por hábito, agrupar por mes, recorrer días
  consecutivos) ya se resuelven con métodos de arreglo sobre datos en memoria.
- La regla de [`../../../00-governance/security-rules.md`](../../../00-governance/security-rules.md)
  es explícita: el token **solo** puede vivir en almacenamiento seguro de la plataforma.
- Debe funcionar en el flujo gestionado de Expo, sin módulos nativos ajenos al SDK.

---

## Decisión

**Decidimos:** usar **dos almacenes con propósitos separados**:

| Qué | Dónde | Paquete |
|-----|-------|---------|
| Token JWT | Keychain (iOS) / Keystore (Android) | `expo-secure-store` |
| Caché de dominio (hábitos, metas, registros, categorías) | Almacén clave-valor | `@react-native-async-storage/async-storage` |
| Estado de formularios, filtros, pestaña activa | En memoria | — (no se persiste) |

Un único módulo `src/storage/` envuelve ambos; ninguna pantalla los importa directamente.
`AppContext` hidrata su estado desde el caché al montar y lo reescribe tras cada mutación.

**Justificación:**
El dominio es pequeño y ya se consulta íntegramente en memoria, así que una base de datos
relacional local no compraría nada: pagaríamos esquema, migraciones y un lenguaje de consulta
para reemplazar un `Array.filter`. `AsyncStorage` da exactamente lo que falta —que los datos
sobrevivan al cierre de la app— sin añadir ninguna de esas piezas.

La separación en dos almacenes no es un detalle: `AsyncStorage` **no está cifrado** y es
legible en un dispositivo con root o jailbreak, por lo que meter allí el token violaría la
regla de gobernanza.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **AsyncStorage + expo-secure-store (elegida)** | En el ecosistema Expo, sin módulo nativo extra; API mínima; separa secreto de no-secreto | Sin cifrado en AsyncStorage; sin consultas: se carga y filtra todo en memoria; serializar un JSON grande en cada escritura | — (elegida) |
| `expo-sqlite` | SQL real, consultas por índice, escala a muchos registros | Exige esquema y migraciones versionadas; sobredimensionado para 5 entidades que ya se filtran en memoria | Complejidad sin beneficio medido al volumen actual |
| WatermelonDB | Excelente para sincronización offline-first con miles de registros | Requiere *development build*, se sale del flujo gestionado; curva de aprendizaje alta | Rompe [ADR-002](./ADR-002-react-native-expo.md) y su beneficio aparece a un volumen que no tenemos |
| Todo en `expo-secure-store` | Todo cifrado | Pensado para valores pequeños; guardar el dominio completo allí es un abuso de la API y es lento | Uso incorrecto de la herramienta |
| No persistir nada (estado actual) | Cero trabajo | El usuario pierde todo al cerrar; imposible usar la app de verdad | Es justo el problema que este ADR resuelve |

---

## Consecuencias

**Positivas:**
- La sesión sobrevive al cierre de la app y los datos se ven al instante en el arranque.
- El token queda en almacenamiento cifrado por la plataforma, cumpliendo la regla de gobernanza.
- `AppState` no cambia de forma: solo se añade la hidratación inicial.

**Negativas / Compromisos:**
- `AsyncStorage` no está cifrado: **no se guardarán allí** la contraseña ni datos
  antropométricos sensibles; el perfil se re-consulta al API tras iniciar sesión.
- Serializar todo el dominio a JSON en cada mutación es aceptable al volumen actual, pero es
  el primer punto que se degradará. Umbral de reevaluación: por encima de ~5.000 registros o
  si el guardado se nota en la interfaz, se abre un ADR para pasar a `expo-sqlite`.
- Hay que añadir un estado `hidratando` mientras se lee el almacén al arrancar, y una pantalla
  de carga inicial.
- `cerrarSesion()` deja de ser una línea: debe borrar el almacén seguro **y** el caché.

**Impacto en el sistema:**
- Afectados: `AppContext.tsx`, `App.tsx` (pantalla de carga inicial), nueva carpeta `src/storage/`.
- Documentos a actualizar: [`../../../03-api-and-data/persistence.md`](../../../03-api-and-data/persistence.md),
  [`../../../03-api-and-data/offline-sync.md`](../../../03-api-and-data/offline-sync.md),
  [`../../../00-governance/security-rules.md`](../../../00-governance/security-rules.md).

---

## Referencias

- Relacionado con: [ADR-002](./ADR-002-react-native-expo.md), [ADR-005](./ADR-005-cliente-http.md)
