# Caso de prueba — TC-005

- **ID:** TC-005
- **Historia relacionada:** HU-02 (Flujo 5, M-09); [ADR-011](../../01-architecture/decisions/records/ADR-011-roles-y-alcance-completo.md)
- **Feature / pantalla:** [Autenticación](../../01-architecture/features/feature-autenticacion.md) y [panel del profesional](../../01-architecture/features/feature-panel-profesional.md) · `LoginScreen`, `PacientesScreen`
- **Plataformas:** Android, iOS y web
- **Tipo:** Funcional y de seguridad
- **Invariante que protege:** cada rol solo ve y usa lo suyo; el servidor lo impone aunque la app fallara

---

## Precondiciones

- API, base de datos y app levantadas con `habits-tracker-infra` (manual de implementación).
- Existen los usuarios de prueba de la semilla: `paciente@habitos.test` y `profesional@habitos.test`
  (contraseñas en el README de `habits-tracker-api`).
- Para los pasos 6 a 9: Postman (o `npm run test:postman`) con la colección del repositorio de la API.

---

## Pasos — en la app

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Iniciar sesión como **profesional** | Se abre "🩺 Pacientes" con Carlos Gómez. **No** aparecen las pestañas Inicio, Hábitos, Metas, Registros ni Historial |
| 2 | (Web) Cambiar la dirección a `/Tabs/Habitos` sin recargar | Se sigue viendo "🩺 Pacientes": la ruta del paciente no existe para este rol |
| 3 | Pulsar **Salir** y confirmar | Vuelve a "Iniciar sesión" |
| 4 | Iniciar sesión como **paciente** | Se abre "Hola, Carlos 👋" con las cinco pestañas. No existe la pantalla Pacientes |
| 5 | Crear una cuenta nueva desde "Registrate aqui" | La cuenta entra como paciente (ve las pestañas), nunca como profesional |

## Pasos — contra la API (lo que la app no deja hacer)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 6 | `POST /habitos` con el token del profesional | **`403`**, `code: "FORBIDDEN_ROLE"`, *"No tienes permiso para realizar esta acción con tu rol."* |
| 7 | `GET /usuarios?rol=paciente` con el token del paciente | **`403 FORBIDDEN_ROLE`** |
| 8 | `GET /habitos` sin cabecera `Authorization` | **`401 UNAUTHORIZED`** |
| 9 | `POST /auth/register` con `"rol": "profesional"` en el cuerpo | **`400 VALIDATION_FAILED`**, `errors.rol: ["Este campo no está permitido."]`; no se crea la cuenta |

---

## Resultado

- **Estado:** Aprobado (pasos 1 a 4 y 6 a 9). Paso 5 cubierto por la prueba e2e `registro_siempre_creaUnPaciente`.
- **Build:** copias de trabajo de `habits-tracker-app` y `habits-tracker-api` (2026-10-28).
- **Dispositivo / SO:** app web de Expo en Chrome sin ventana (390×844), contra la API en Docker. **No ejecutado en Android ni iOS físicos.**
- **Evidencia:**
  - Pasos 1 a 4: recorrido automatizado por la interfaz real del profesional (8/8 comprobaciones) y del paciente (17/17), 2026-10-28.
  - Pasos 6 a 8: colección Postman ejecutada con Newman (carpeta "2. Seguridad"), 0 fallos.
  - Paso 9: petición manual con `curl` el 2026-10-28 (respuesta literal arriba).
  - Automatizado además en `habits-tracker-api/test/roles.e2e-spec.ts`.
- **Notas / defectos:** ninguno.
