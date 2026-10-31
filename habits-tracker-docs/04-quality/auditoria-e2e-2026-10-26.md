# Auditoría E2E de cumplimiento de requisitos — 2026-10-26

> **Qué es:** verificación, requisito por requisito, de que la aplicación de la copia de trabajo
> (`healthy-habits-tracker-claude-trabajo`) hace lo que describe este repositorio de documentación.
> **Quién:** Claude Code, a petición de Juan José Horta Vanegas.
> **Alcance:** app Expo + API NestJS + PostgreSQL en Docker, tal como estaban el 2026-10-26.

---

## A. Resumen ejecutivo

- **Lo obligatorio que existe funciona de punta a punta.** Autenticación, catálogo, hábitos, metas
  (una activa), registro diario único, rachas, archivado, dashboard, historial y lista de registros
  se verificaron **por la interfaz real** (app web) y **por el API real** (Docker), con la base de
  datos consultada directamente. Los cuatro casos de prueba documentados (TC-001 a TC-004) se
  aprobaron.
- **Defectos encontrados y corregidos:** 1 en el backend (un cuerpo de más de 10 MB respondía
  **500** en lugar de **413**, contra el contrato §1 y §3), 4 grupos en la app (texto del botón
  principal, mensajes de validación distintos de los casos de prueba, racha récord ausente en la
  tarjeta de hábito, y controles sin nombre ni rol accesible). Todos se volvieron a probar.
- **La aplicación NO puede considerarse completa respecto de HU-02.** Siguen sin cumplirse dos
  requisitos *Must/Should* documentados: **M-09** (panel del profesional) y **S-06** (registro sin
  conexión). Tampoco **M-04** completo (falta editar desde la app), el límite de intentos de login
  (429), los textos centralizados del DoD ni la verificación en Android/iOS físicos.
- No se da un porcentaje global: varios requisitos no son verificables en este entorno
  (dispositivo físico, lector de pantalla, rendimiento en gama media), y un porcentaje ocultaría eso.

---

## B. Documentación examinada

| Documento | Qué aporta |
|---|---|
| `Project/HU-02.md` | **Fuente principal**: MoSCoW (M-01…M-12, S-01…S-06, C-01…C-05, Won't), wireframes §5, modelo §6, flujos §7 |
| `Project/HU-01.md` | Requerimientos RF/RNF (§3), stack, invariantes (§5.4), verificación práctica (§8) |
| `01-architecture/decisions/records/ADR-008` | Decisiones D-07…D-28 que **prevalecen** sobre HU-02 donde difieran |
| `03-api-and-data/api-contract.md` | **Contrato canónico**: errores, códigos, mensajes literales, E-01…E-14, reintentos |
| `03-api-and-data/{authentication,api-networking,persistence,offline-sync,data-model}.md`, `endpoints/*`, `entities/*` | Sesión, cliente HTTP, caché, modelo |
| `01-architecture/features/*`, `screens/*`, `navigation.md` | Comportamiento esperado por pantalla |
| `04-quality/test-cases/TC-001…TC-004` | **Criterios de aceptación ejecutables** |
| `04-quality/{mobile-security,performance-budgets,testing-strategy}.md`, `00-governance/{security-rules,definition-of-done}.md`, `02-code-and-ui/{accessibility,i18n}.md` | Requisitos no funcionales |

No hay PDF ni imágenes en el repositorio de documentación: los wireframes y diagramas son texto
(ASCII y Mermaid) y se revisaron como tal. Los README del repositorio de código se usaron como
descripción de la implementación, no como fuente de requisitos.

### Contradicciones y ambigüedades encontradas

| # | Fuentes | Conflicto | Tratamiento |
|---|---|---|---|
| C1 | TC-001 paso 6 ↔ `api-contract.md` E-11 | El caso espera "Ya existe un registro de este habito para esa fecha."; el contrato fija "Ya existe un registro para este hábito en la fecha indicada." | ADR-008 declara canónico el contrato. Se verificó el texto del contrato y se anotó en TC-001 |
| C2 | HU-01 §5.4, HU-02 Flujo 3, `03-api-and-data/README.md` ↔ ADR-008 y features actualizadas | Los primeros piden **respuesta optimista** del cliente (replicar invariantes y responder antes del servidor); la implementación hace del servidor la única autoridad y espera su respuesta | **Requiere aclaración** del equipo: no se cambió el comportamiento. **Resuelto el 2026-10-28 por [ADR-012](../01-architecture/decisions/records/ADR-012-sin-respuesta-optimista.md):** se descarta la respuesta optimista |
| C3 | HU-02 Flujo 1 ↔ ADR-008 D-14 | Tras registrarse, "vuelve a Login" ↔ la sesión empieza de inmediato | Manda el ADR (HU-02 lo dice en su nota de revisión) |
| C4 | HU-02 §6 ↔ ADR-008 D-19, D-23 | Tabla `RACHA` y `usuarioId` en el registro ↔ racha calculada, sin `usuario_id` | Manda el ADR |
| C5 | `feature-habitos.md`, `screen-habitos.md`, `feature-autenticacion.md`, `screen-registro.md`, `screen-login.md` ↔ ADR-008 | Siguen describiendo reglas de la v1.0.0 (bloquear el borrado, contraseña de 6, `navigation.replace`) | Documentación desactualizada; manda el ADR. Pendiente de corregir (sección G) |
| C6 | `api-contract.md` §1 | Pide timestamps "con desplazamiento explícito" (ejemplo `-05:00`); el API devuelve ISO 8601 en UTC con `Z` | `Z` es un designador de zona válido: se considera cumplido, con nota |

---

## C. Matriz de trazabilidad

Leyenda de evidencia:
- **API-…**: escenario del script de caja negra `api-e2e.mjs` contra el contenedor (75/75 aprobados).
- **UI-…**: recorrido por la interfaz real (app web de Expo) contra el API en Docker (sección D).
- **BD**: consulta directa a PostgreSQL.
- **U/I**: pruebas unitarias o de integración automatizadas (Jest, Supertest).
- **Insp.**: inspección del código (no es verificación de comportamiento).

| ID | Fuente documental | Requisito y criterio verificable | Implementación | Escenario | Resultado | Evidencia o limitación |
|---|---|---|---|---|---|---|
| REQ-001 | HU-02 M-01; HU-01 RF-01/02; E-01 | Login con bcrypt y JWT HS256 de 24 h; correo normalizado; 400/401 con mensajes literales | `backend/src/auth/*`, `src/services/auth.ts`, `LoginScreen` | API-AUTH-08…10, 14; UI-02, UI-11 | **Cumple verificado** | JWT `alg=HS256`, vigencia 86400 s; BD: hash `$2a$` de 60 caracteres |
| REQ-002 | E-02 | Correo único sin distinguir mayúsculas → 409 `DUPLICATE_EMAIL` | `AuthService.registrar` + `UNIQUE` | API-AUTH-02 | **Cumple verificado** | Mensaje literal del contrato |
| REQ-003 | ADR-008 D-12 | Contraseña de registro: 8+, mayúscula y número; el login no valida fortaleza | `registro.dto.ts`, `login.dto.ts` | API-AUTH-03/04; UI-03 | **Cumple verificado** | La interfaz muestra "La contraseña debe incluir al menos una mayúscula." |
| REQ-004 | HU-02 M-02; E-02 | Perfil con edad, peso y estatura opcionales y en rango; apellidos opcionales (D-13) | `registro.dto.ts`, `RegisterScreen` | API-AUTH-01/05; UI-03 | **Cumple parcialmente** | Captura y rangos verificados ("1,68" se guardó como 1.68). **No hay pantalla para editar el perfil** (HU-02 lo declara pendiente) |
| REQ-005 | `api-contract.md` D-06 | Correo inexistente y contraseña errónea → mismo 401 y mismo mensaje | Hash ficticio en `auth.service.ts` | API-AUTH-09 | **Cumple verificado** | Tiempos de respuesta 75 y 75 ms |
| REQ-006 | HU-02 Flujo 1; E-14 | Con token guardado, la app restaura la sesión sin pedir credenciales | `AppContext` (arranque), `GET /usuarios/me` | API-AUTH-11; U (`AppContext.test.tsx`) | **Cumple parcialmente** | Endpoint verificado E2E; el arranque con token solo por prueba de integración: en la web el token vive en memoria por diseño. **No verificado en teléfono** |
| REQ-007 | `authentication.md`; contrato §2.2 | Sin token o inválido → 401 `UNAUTHORIZED`; vencido → `TOKEN_EXPIRED`; un 401 cierra la sesión y vuelve a Login | `jwt-auth.guard.ts`, `apiFetch` | API-AUTH-12/13; UI-14 | **Cumple parcialmente** | UI-14 usa un 401 simulado en `fetch` (el servidor real ya se probó en API-AUTH-13). "Cancelar peticiones en vuelo" no está implementado: las respuestas se descartan |
| REQ-008 | HU-02 M-03; D-11 | 5 categorías con tilde y emoji; solo lectura para el paciente | Migración de catálogo, `categorias.*` | API-CAT-01/02; UI-04 | **Cumple verificado** | No existe `POST /categorias` |
| REQ-009 | HU-02 M-04; E-04…E-06 | Crear y listar hábitos del usuario con su categoría; detalle; 400/404 con mensajes literales | `habitos.*`, `HabitosScreen` | API-HAB-01…03, 06…08; UI-04, UI-13 | **Cumple verificado** | |
| REQ-010 | E-05 | Meta inicial ≤ 0 → 422 | `HabitosService.crear` | API-HAB-04 | **Cumple verificado** | La app no ofrece meta inicial al crear el hábito (opcional en el contrato) |
| REQ-011 | HU-02 M-04 ("CRUD"); E-07; C-04 | Editar un hábito | `PUT /habitos/:id` | API-HAB-11, 14 | **Cumple parcialmente** | El API permite editar y reactivar; **la app no tiene pantalla de edición** (C-04, *Could*) |
| REQ-012 | HU-02 M-05; E-10, E-10b; TC-004 | Una sola meta activa, validada al crear y al reactivar; desactivar siempre; histórico conservado | `metas.service.ts`, `MetasScreen` | API-MET-01…11; UI-06 (TC-004 1-9 y variantes) | **Cumple verificado** | Limitación conocida: la regla está en el servicio, no en la BD (carrera teórica, `data-model.md` §13) |
| REQ-013 | HU-02 M-06; E-11; TC-001 | Un registro por hábito y fecha → 409 `DUPLICATE_DAILY_LOG`; otra fecha u otro hábito sí | `UNIQUE (habito_id, fecha)`, `registros.service.ts` | API-REG-01/02/06; UI-07 (TC-001 1-9) | **Cumple verificado** | Mensaje: ver C1 |
| REQ-014 | D-02, D-18; TC-004 parte 2 | `metaCumplida` la calcula el servidor (`>=`), queda congelada; sin meta = false | `registros.service.ts` | API-REG-01/06/20/21; UI-08 | **Cumple verificado** | BD: 26 oct Meditar 12 = `t` tras cambiar la meta a 20 |
| REQ-015 | D-17; contrato §6.2 | `clienteId` obligatorio; mismo cuerpo → 200 sin duplicar; cuerpo distinto o ajeno → 409 | `registros.service.ts`, `src/services/registros.ts` | API-REG-03…05, 10 | **Cumple verificado** | BD: todos los registros con `cliente_id` |
| REQ-016 | D-27 | Fecha futura (en Bogotá) → 422; la app no deja avanzar más allá de hoy | `hoyEnZona`, `NuevoRegistroScreen` | API-REG-07; UI-07 | **Cumple verificado** | |
| REQ-017 | E-11 | Valor ≥ 0 y fecha real `YYYY-MM-DD` → si no, 400 con mensaje literal | `registros.dto.ts`, `@EsFechaISO` | API-REG-08/09; UI-07 (variantes) | **Cumple verificado** | |
| REQ-018 | E-12 | Paginación `{items,page,size,total,totalPages}`, `size ≤ 100`, orden fecha DESC, `from` incluido y `to` excluido | `registros.service.ts` | API-REG-14…16 | **Cumple verificado** | |
| REQ-019 | HU-02 M-12; E-12b; Flujo 3b | Lista cronológica con filtro por hábito y borrado individual con confirmación | `RegistrosScreen`, `DELETE /registros/:id` | API-REG-18/19, API-RAC-04; UI-09, UI-10 | **Cumple verificado** | Cancelar no borra; borrar recalcula la racha |
| REQ-020 | HU-02 M-07; D-19; TC-002 | Racha actual (hasta hoy o ayer) y máxima; solo metas cumplidas | `racha.ts` (app y API) | API-RAC-01…05; UI-10; U (`racha.test.ts`, `racha.spec.ts`) | **Cumple verificado** | App y servidor dan los mismos números (3/5, 2/5, 0/5) |
| REQ-021 | D-10; E-08; TC-003 | Con registros → archivar (204) y conservar el historial; sin registros → borrado físico y metas en cascada; reactivar con PUT | `habitos.service.ts`, `HabitosScreen`, `HistorialScreen` | API-HAB-12…16; UI-12 (TC-003 1-10) | **Cumple verificado** | Observación: Metas sigue listando la meta del hábito archivado (ningún documento lo regula) |
| REQ-022 | HU-02 M-08; `screen-dashboard.md` | Métricas del día, gráfica semanal, rachas y registros de hoy; botón "+ Registrar cumplimiento" | `DashboardScreen` | UI-03, UI-11 | **Cumple verificado** | Cifras contrastadas con cálculo independiente. **Corregido** el texto del botón |
| REQ-023 | HU-02 S-01 | Resumen semanal con porcentaje de adherencia | `WeekChart`, `actividadSemanal` | UI-11 | **Cumple verificado** | |
| REQ-024 | HU-02 S-02 | Historial mensual con desglose por hábito (%, promedio) y vista semanal | `HistorialScreen` | UI-11 | **Cumple verificado** | 13 registros / 8 cumplidas / 62 %; promedios 8,3 · 43,6 · 13. Solo el año en curso (deuda declarada) |
| REQ-025 | HU-02 M-09; Flujo 5; §5.8 | Panel del profesional por paciente y rango de fechas | — | — | **No cumple** | No implementado; D-24 deja sin decidir roles y canal |
| REQ-026 | HU-02 M-10; HU-01 RNF-01 | Backend con Docker Compose, reproducible, con healthchecks | `backend/docker-compose.yml`, `Dockerfile` | Todo el plan se ejecutó contra el contenedor | **Cumple parcialmente** | Funciona con `docker compose up -d --build`. Solo la base tiene healthcheck; el contenedor del API no |
| REQ-027 | HU-02 M-11; DoD | App en Android e iOS desde una sola base de código (mínimo: Android físico con Expo Go y web) | Expo SDK 57 | `expo export --platform android` y web | **Cumple parcialmente** | Web verificada E2E; bundle Android compila (2.041.546 bytes). **Android físico e iOS no verificados en esta auditoría** |
| REQ-028 | HU-02 S-05; ADR-004 | Abrir con datos de la caché sin red, con aviso "Sin conexión" y "Reintentar" | `cache.ts`, `AppContext`, `AvisoSinConexion` | U/I (`cache.test.ts`, `AppContext.test.tsx`) | **No verificado (E2E)** | En la web la caché está desactivada por diseño; **requiere teléfono** (modo avión) |
| REQ-029 | HU-02 S-06; `offline-sync.md` | Registrar sin conexión con cola y reenvío | — | UI-15 (sin API) | **No cumple** | Sin red, el registro no se guarda ("No pudimos conectar…"). Declarado pendiente |
| REQ-030 | HU-02 S-03; D-09 | Errores en RFC 7807 (`application/problem+json`, title/status/detail/code) desde un filtro global | `ProblemaFilter` | Todos los API-… con error | **Cumple verificado** | |
| REQ-031 | Contrato §3 | Ningún error documentado es 500; JSON roto, ruta o id inválidos → 4xx | `ProblemaFilter` | API-GEN-01/02/04 | **Cumple verificado** | |
| REQ-032 | HU-02 S-04 | Los DTO rechazan campos no permitidos | `crear-validation-pipe.ts` | API-AUTH-06, API-HAB-05 | **Cumple verificado** | `rol` y `usuarioId` → 400 |
| REQ-033 | D-03; contrato §3 | El usuario sale del token; otro usuario no lee, modifica ni borra lo ajeno (403/404) | Servicios con filtro por `usuarioId` | API-HAB-09/10, API-MET-03/10/11, API-REG-05/12/17/18 | **Cumple verificado** | |
| REQ-034 | E-04; D-28 | `HabitoSummary` con los campos acordados | `habito-respuesta.ts` | API-HAB-06 | **Cumple verificado** | |
| REQ-035 | Contrato §1 | Timestamps ISO 8601 con zona | Serialización de `Date` | API-HAB-07 | **Cumple verificado** | En UTC (`Z`), no `-05:00`: ver C6 |
| REQ-036 | D-05 | Colecciones vacías como `[]` | Controladores | API-HAB-10 | **Cumple verificado** | |
| REQ-037 | Contrato §1 | Cuerpo de más de 10 MB → 413 en problem+json | `configurar-app.ts`, `ProblemaFilter` | API-GEN-03; I (`seguridad.e2e-spec.ts`) | **Cumple verificado — corregido** | Antes respondía **500** (defecto E1) |
| REQ-038 | E-13; D-22 | `GET /dashboard` "si se implementa" | — | API-GEN-05 | **No aplicable** | Opcional según D-22; el cliente calcula el resumen |
| REQ-039 | D-16; `api-networking.md` | Timeout de 10 s; solo los GET se reintentan (0, 1 y 2 s); las mutaciones fallidas se muestran y no se reintentan solas | `apiFetch` | UI-15, UI-16; U (`api.test.ts`) | **Cumple verificado** | GET: intentos a 0/1012/2003 ms; POST: 1 intento. Timeout de 10 s solo por prueba unitaria |
| REQ-040 | `security-rules.md`; `authentication.md`; ADR-004 | Token solo en SecureStore; caché sin datos de salud; cerrar sesión borra token, caché y estado | `seguro.ts`, `cache.ts`, `limpiarSesion` | UI-11; U | **Cumple parcialmente** | Cierre de sesión verificado E2E en web; el almacenamiento en Keychain/Keystore solo por prueba unitaria (requiere teléfono) |
| REQ-041 | `navigation.md`; hallazgo S-02 | Sin sesión, `Tabs` no existe | `AppNavigator` | UI-01, UI-11 | **Cumple verificado** | Abrir `/Tabs/Habitos` sin sesión muestra Login |
| REQ-042 | `performance-budgets.md`; HU-02 §1.3 | Arranque ≤ 2 s; 60 fps; guardar < 100 ms percibido; registrar en < 10 s | — | API-GEN-06 (referencia) | **No verificado** | Solo hay medición de red local (POST 12-50 ms). Los presupuestos exigen gama media Android |
| REQ-043 | `accessibility.md` | Todo control con rol y etiqueta; gráfica con alternativa textual; métricas con una sola etiqueta | Componentes y pantallas | UI (árbol de accesibilidad) | **Cumple parcialmente — corregido** | Corregidas las acciones 1-4 y los controles sin nombre (E5). Sin verificar: TalkBack/VoiceOver, tamaño de fuente grande, foco en modales, estado `disabled`/`selected` en la web |
| REQ-044 | DoD; `i18n.md` | Ningún texto visible escrito dentro de las pantallas | — | Insp. | **No cumple** | Pendiente declarado en el DoD |
| REQ-045 | DoD; `design-system.md` | Ningún color, espaciado, radio ni tamaño escrito a mano | `constants/theme.ts` | Insp. | **Cumple parcialmente** | 0 colores hexadecimales fuera del tema; 42 valores numéricos de estilo sueltos (los mismos 42 de la v1.0.0) |
| REQ-046 | `endpoint-post-auth-login.md`; `authentication.md` | Exceso de intentos de login → 429 | — | — | **No cumple** | Pendiente declarado |
| REQ-047 | `security-rules.md` (transporte) | TLS en release y certificate pinning | — | — | **Bloqueado** | No hay dominio publicado ni build de release |
| REQ-048 | HU-01 §5.4; HU-02 Flujo 3; `03-api-and-data/README.md` | Validación y respuesta optimista en el cliente | — | — | **Requiere aclaración** (resuelto por ADR-012, 2026-10-28) | Contradicción C2 |
| REQ-049 | `security-rules.md`; `api-networking.md` | Sin `console.log` con datos; sin secretos; `EXPO_PUBLIC_` solo para la URL | Código | Insp. | **Cumple verificado (inspección)** | Solo `console.warn` genérico en `cache.ts` |
| REQ-050 | `api-networking.md` | URL base desde `EXPO_PUBLIC_API_URL`, nunca escrita en el código; cabeceras `Accept` y `Content-Type; charset=utf-8` | `api.ts` | Insp. | **Cumple parcialmente** | Cabeceras correctas; queda un valor por omisión `http://localhost:3000/api/v1` escrito en `api.ts` |
| REQ-051 | `security-rules.md`; `mobile-security.md` | Dependencias sin vulnerabilidades conocidas | `package.json` | `npm audit` | **No cumple** | App: 15 (1 crítica, 8 altas); API producción: 9 (4 altas), de la línea NestJS 10 |
| REQ-052 | ADR-006; DoD | Pruebas automatizadas de lógica y reglas | Jest, Supertest | Ejecución | **Cumple verificado** | App 73; API unitarias 29; API e2e 75 (antes 73) |
| REQ-053 | HU-02 Won't Have | Iniciar sesión siempre requiere red | `LoginScreen` | UI-17 | **Cumple verificado** | |
| REQ-054 | HU-02 C-01…C-05 | Exportar PDF, recordatorios, gráficas interactivas, edición, widget | — | — | **No aplicable** | *Could Have*: fuera del MVP |
| REQ-055 | `screen-habitos.md`; HU-02 §5.5 | La tarjeta muestra racha actual, récord y meta activa | `HabitosScreen` | UI-10 | **Cumple verificado — corregido** | Faltaba el récord (E4) |

**Cobertura del inventario:** 55 requisitos, todos con estado: 34 cumplen verificados (REQ-037 y
REQ-055 tras corregirlos; REQ-049 solo por inspección), 10 cumplen parcialmente (REQ-043 mejorado
en esta auditoría), 5 no cumplen, 2 no verificados, 1 bloqueado, 1 requiere aclaración y 2 no
aplican. Ningún requisito se marcó "cumple" solo porque exista el código, salvo REQ-049 (y la
parte de inspección de REQ-045 y REQ-050), que se indican como tales.

---

## D. Pruebas E2E ejecutadas

### D.1 Por el API (caja negra, contenedor real)

`auditoria-e2e/api-e2e.mjs` (fuera de los repositorios, en `PROYECTO\auditoria-e2e\`): 75
escenarios con cuentas `auditoria-e2e-*@prueba.local`.

```powershell
Set-Location "C:\Users\LENOVO\OneDrive\Escritorio\PROYECTO\auditoria-e2e"
node api-e2e.mjs
```

| Ejecución | Resultado |
|---|---|
| Primera | 72/75: 1 defecto real (413), 1 error de conteo del propio script, 1 endpoint opcional (`/dashboard`) |
| Tras corregir el filtro y el script | **75/75** (repetido 3 veces con el contenedor reconstruido) |

Verificación de persistencia en PostgreSQL (solo lectura): hash bcrypt, `cliente_id` en todos los
registros, `meta_cumplida` congelada, hábito archivado con sus registros, meta en cascada,
ninguna tabla `racha` ni columna `usuario_id` en `registro_diario`.

### D.2 Por la interfaz (app web de Expo contra el API en Docker)

Vista de 375×812. `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1` pasado al proceso, sin tocar el `.env`.

| ID | Escenario | Requisitos | Resultado |
|---|---|---|---|
| UI-01 | Abrir sin sesión → Login | REQ-041 | Aprobado |
| UI-02 | Login vacío y con credenciales erróneas | REQ-001 | Aprobado ("Completa todos los campos", "Credenciales incorrectas.") |
| UI-03 | Registro con contraseña débil y luego válida → entra al Dashboard vacío | REQ-003, 004, 022 | Aprobado |
| UI-04 | Crear hábito (variante sin datos y válido) | REQ-008, 009 | Aprobado |
| UI-05 | Cerrar sesión (confirmación), URL directa a `/Tabs/Habitos` sin sesión, volver a entrar | REQ-040, 041 | Aprobado |
| UI-06 | TC-004 pasos 1-9 y 4 variantes | REQ-012 | Aprobado |
| UI-07 | TC-001 pasos 1-9 y 5 variantes | REQ-013, 016, 017 | Aprobado (mensaje del paso 6: C1) |
| UI-08 | TC-004 pasos 10-13 y variante "sin meta activa" | REQ-014 | Aprobado |
| UI-09 | Registros: lista, orden y filtro | REQ-019 | Aprobado |
| UI-10 | TC-002 pasos 7-9 en pantalla; borrar con cancelar y confirmar | REQ-019, 020, 055 | Aprobado |
| UI-11 | Historial mes/semana y métricas del Dashboard contra cálculo independiente | REQ-022…024 | Aprobado |
| UI-12 | TC-003 pasos 1-10 | REQ-021 | Aprobado |
| UI-13 | Fila de datos de la tarjeta cabe en 375 px | REQ-055 | Aprobado (5 × 62 px, sin desborde) |
| UI-14 | 401 `TOKEN_EXPIRED` en una escritura → Login | REQ-007 | Aprobado (401 **simulado** en `fetch`) |
| UI-15 | API detenido (`docker compose stop backend`) al guardar → mensaje, modal abierto, 1 POST; API de vuelta → guardar funciona | REQ-029, 039 | Aprobado |
| UI-16 | Lecturas fallidas al entrar → "Cargando tus hábitos…", 3 intentos (0/1/2 s), pantalla de error, "Reintentar" recupera | REQ-039 | Aprobado (fallo de red **simulado** en `fetch`) |
| UI-17 | Login sin red | REQ-053 | Aprobado (simulado) |

**Limitaciones de fidelidad, declaradas:** el panel del navegador estaba oculto, así que desde
UI-05 las acciones se dispararon con eventos DOM sintéticos (`pointerdown/up` y `click`, más
`input` en los campos), que ejecutan los manejadores reales de la app. Los diálogos
`window.confirm` y `window.alert` se interceptaron para leer su texto y responder. UI-14, UI-16 y
UI-17 simulan la respuesta de red en el navegador; el comportamiento real del servidor en esos
casos está cubierto por API-AUTH-13 y por UI-15, que detuvo el contenedor de verdad.

**No ejecutado de punta a punta:** Android físico, iOS, apertura sin red con caché (S-05),
lector de pantalla y rendimiento en gama media.

### D.3 Regresión automatizada (código final)

| Comando (desde la copia de trabajo) | Resultado |
|---|---|
| `npx tsc --noEmit` | Sin errores |
| `npx jest` | 73/73 |
| `npx expo export --platform android` | Bundle generado (2.041.546 bytes) |
| `backend: npx tsc --noEmit`, `npx eslint "{src,test}/**/*.ts"`, `npx prettier --check …`, `npm run build` | Sin errores |
| `backend: npm test` | 29/29 |
| `backend: npm run test:e2e` | 75/75 (dos pruebas nuevas) |

**Fallo intermitente observado:** la primera ejecución del día de `npm run test:e2e` dio 20
fallidas de 73, justo después de arrancar Docker Desktop. No se guardó su detalle y no se
reprodujo en las 7 ejecuciones siguientes (una de ellas en paralelo con el script contra el API).
**Causa no determinada.**

---

## E. Problemas encontrados y correcciones

| # | Requisito | Síntoma | Causa | Archivos | Corrección | Nueva prueba |
|---|---|---|---|---|---|---|
| E1 | REQ-037, REQ-031 | Un cuerpo de 11 MB respondía `500 INTERNAL_ERROR` | El `PayloadTooLargeError` de body-parser no es un `HttpException`; el filtro lo trataba como fallo inesperado | `backend/src/common/errores/problema.filter.ts` | Reconocer los errores 4xx de `http-errors` (`expose: true`) y responder con el problema genérico de su estado | `seguridad.e2e-spec.ts`: `cuerpoDeMasDe10MB_responde413EnProblemJson` (falla sin la corrección) y `jsonMalFormado_responde400ValidationFailed`; API-GEN-03 75/75 |
| E2 | REQ-022 (TC-001 paso 1) | El botón decía "+ Registrar hoy" | Texto distinto del documentado | `DashboardScreen.tsx` | "+ Registrar cumplimiento" | UI-03, UI-07 |
| E3 | REQ-012, 013, 017, 009 (TC-001, TC-003, TC-004) | Mensajes de validación distintos de los casos de prueba | Textos de la v1.0.0 nunca alineados | `HabitosScreen`, `MetasScreen`, `NuevoRegistroScreen` | Texto de los TC, con tildes (checklist de `i18n.md`) | UI-04, UI-06, UI-07 |
| E4 | REQ-055 | La tarjeta de hábito no mostraba la racha récord | Omitido al implementar | `HabitosScreen.tsx` | Dato "Récord" | UI-10, UI-13 |
| E5 | REQ-043 | Gráfica sin alternativa textual; métricas leídas por separado; campos, chips, pestañas, botones "+", "Salir", "Cerrar", enlaces y meses sin nombre o sin rol | Acciones pendientes de `accessibility.md` y controles hechos con `Text`/`Pressable` sin propiedades de accesibilidad | `WeekChart`, `StatCard`, `Input`, `ChipSelector`, `SegmentedTabs`, `TabNavigator`, 7 pantallas | Etiquetas y roles; `accessibilityState.disabled` en "Día siguiente" | Árbol de accesibilidad en UI (p. ej. "0, Habitos activos", "Lun: 2 de 2 cumplidas, 100%") |

Ningún cambio alteró reglas de negocio ni el contrato. Riesgo residual: `accessibilityState` no se
publica en la web y su efecto en Android/iOS no se pudo comprobar.

---

## F. Requisitos aún incumplidos o sin verificar

- **No cumplen:** M-09 panel del profesional (REQ-025), S-06 registro sin conexión (REQ-029),
  textos centralizados (REQ-044), login 429 (REQ-046), vulnerabilidades de dependencias (REQ-051).
- **Parciales:** edición de hábitos y perfil desde la app (REQ-004, REQ-011), healthcheck del API
  (REQ-026), verificación en dispositivos (REQ-027), restauración de sesión y almacenamiento
  seguro solo probados por unidad (REQ-006, REQ-040), cancelación de peticiones en vuelo
  (REQ-007), literales de estilo (REQ-045), URL por omisión en `api.ts` (REQ-050), accesibilidad
  en dispositivo (REQ-043).
- **No verificados:** S-05 con el teléfono en modo avión (REQ-028), presupuestos de rendimiento
  (REQ-042).
- **Bloqueado:** TLS en release y certificate pinning (REQ-047).
- **Requiere aclaración:** respuesta optimista del cliente (REQ-048, C2; resuelto por ADR-012 el 2026-10-28) y el texto del paso 6 de
  TC-001 (C1).
- **Documentación desactualizada (C5):** `feature-habitos.md` (regla "no se elimina", pruebas
  "Pendiente"), `screen-habitos.md` (invariante de bloqueo), `feature-autenticacion.md`,
  `screen-registro.md` y `screen-login.md` (contraseña de 6, `replace`), `feature-registro-diario.md`
  (rutas `/registro` en singular).

---

## G. Recomendaciones de remediación

**Obligatorias para cumplir HU-02:**
1. **Decidir M-09** (ADR: pestaña, app aparte o vista web) y su modelo de roles (D-24). *Criterio:*
   la profesional elige paciente y rango y ve días evaluados, cumplidos, % y racha máxima
   (Flujo 5). Depende de la decisión de canal.
2. **S-06 cola offline** (`offline-sync.md`). *Criterio:* en modo avión el registro aparece como
   "pendiente de subir" y se envía una sola vez al volver la red (el `clienteId` ya lo garantiza
   en el servidor).
3. **Ejecutar TC-001…TC-004 en Android físico** con Expo Go y registrar el resultado. *Criterio:*
   los mismos resultados que en web, más S-05 en modo avión.

**Recomendadas (calidad y seguridad):**
4. Límite de intentos de login (429) y healthcheck del contenedor del API.
5. Actualizar NestJS a una versión mayor para cerrar las vulnerabilidades (en una rama propia,
   con las 75 pruebas e2e como red de seguridad).
6. Centralizar textos (`i18n.md`) y sustituir los 42 literales de estilo por tokens del tema.
7. Corregir la documentación desactualizada de C5 y resolver C1/C2 con el equipo.
8. Pantallas de edición (C-04) y perfil, cuando el alcance lo permita.

---

## H. Conclusión

- **Verificado de punta a punta (interfaz → API → base de datos):** M-01, M-03, M-05, M-06,
  M-07, M-08, M-12, S-01, S-02, S-03, S-04, D-10 (archivar) y la guardia de sesión, con los cuatro
  casos de prueba documentados aprobados.
- **No se cumplen:** M-09 y S-06 (los dos requisitos documentados de mayor peso que faltan),
  además de los textos centralizados, el 429 y las vulnerabilidades de dependencias.
- **Sin poder comprobar aquí:** comportamiento en Android e iOS físicos, la caché sin red (S-05),
  el lector de pantalla y los presupuestos de rendimiento.
- **Respaldo:** 75 escenarios de API, 17 recorridos de interfaz, consultas a la base, 177 pruebas
  automatizadas (73 + 29 + 75) y `npm audit`.
- **Para afirmar cumplimiento E2E completo falta:** implementar M-09 y S-06, y repetir TC-001 a
  TC-004 más S-05 en un teléfono real.
