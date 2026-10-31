# Caso de prueba — TC-006

- **ID:** TC-006
- **Historia relacionada:** HU-02 (S-06); [ADR-011](../../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md)
- **Feature / pantalla:** [Registro diario](../../01-architecture/features/feature-registro-diario.md) · `NuevoRegistroScreen`, `RegistrosScreen`, `TabNavigator`
- **Plataformas:** Android, iOS y web
- **Tipo:** Funcional (sin conexión)
- **Invariante que protege:** un registro hecho sin red no se pierde ni se duplica; ante un conflicto gana el servidor

---

## Precondiciones

- Sesión iniciada como `paciente@habitos.test`.
- "Caminar" **no** tiene registro hoy; "Beber agua" **sí** tiene registro ayer (datos semilla).
- Una forma de cortar la red: modo avión en el teléfono, o en Chrome DevTools → Network → **Offline**.

---

## Pasos — el registro queda pendiente y se sube solo

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Cortar la red | — |
| 2 | Inicio → "+ Registrar cumplimiento" → "Caminar", valor `40` → "Guardar registro" | **"⏳ Sin conexión: el registro quedó pendiente y se subirá solo al recuperar la conexión."** y el modal se cierra |
| 3 | Mirar la franja superior | "Sin conexión" con **"1 registro pendiente"** y el botón "Reintentar conexión" |
| 4 | Abrir la pestaña Registros | Arriba, una tarjeta punteada: ⏳ Caminar · *<fecha>* · **Pendiente de subir** · 40 minutos |
| 5 | Intentar registrar otra vez "Caminar" hoy, sin red | *"Ya tienes un registro pendiente de subir para este hábito en esa fecha."* (no se duplica) |
| 6 | Devolver la red y pulsar "Reintentar conexión" (o esperar hasta 15 s) | La tarjeta punteada desaparece, el registro aparece como normal (✅ si cumple la meta) y se va la franja |

## Pasos — conflicto: gana el servidor

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 7 | Cortar la red y registrar "Beber agua" **ayer** (flecha "Día anterior"), valor `7` | Queda pendiente (⏳) |
| 8 | Devolver la red y pulsar "Reintentar conexión" | Aviso: **"Ya existía un registro sincronizado para este hábito en esa fecha. Se mantuvo el registro del servidor."**; el pendiente se descarta y el registro de ayer conserva su valor original |

## Pasos — salir con pendientes

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 9 | Sin red, registrar "Dormir bien" hoy, `8` | Queda pendiente |
| 10 | Inicio → "Salir" | **"Tienes 1 registro(s) sin subir. Si sales ahora se perderán. ¿Salir de todas formas?"**; pulsar Cancelar |
| 11 | Devolver la red y "Reintentar conexión" | El pendiente se sube y desaparece el aviso |

---

## Resultado

- **Estado:** Aprobado (pasos 1 a 4 y 6 a 11). El paso 5 está automatizado en `crearRegistro_sinRedDosVecesElMismoDia_noDuplicaElPendiente`.
- **Build:** copia de trabajo de `habits-tracker-app` (2026-10-28) contra la API en Docker.
- **Dispositivo / SO:** app web de Expo en Chrome sin ventana (390×844); la red se cortó con la emulación de red de Chrome (equivale a DevTools → Offline). **No ejecutado en Android ni iOS físicos.**
- **Evidencia:** recorrido automatizado del paciente del 2026-10-28 (17/17 comprobaciones, con capturas "pendiente sin red" y "sincronizado"); pruebas unitarias del bloque S-06 de `AppContext.test.tsx` y `pendientes.test.ts`.
- **Notas / defectos:** en la web la caché de datos está desactivada (por seguridad), pero la cola sí funciona; en Android e iOS, además, los datos ya descargados se ven sin red.
