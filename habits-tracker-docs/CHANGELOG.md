# Changelog
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) | [SemVer](https://semver.org/)
## [Unreleased]
### Added
- Corte 3 (2026-10-28): ADR-010 (cuatro repositorios), ADR-011 (roles, panel del profesional, edición completa y S-06) y ADR-012 (sin respuesta optimista).
- Contrato: roles y `FORBIDDEN_ROLE`, `PATIENT_NOT_FOUND`; E-10b ampliado (editar meta), E-10c `DELETE /metas/:id`, E-12c `PUT /registros/:id`, E-15 `GET /usuarios`, E-16 `GET /reportes/progreso`; sondas 15 a 20 con la colección Postman.
- Fichas de integración de los 16 endpoints que faltaban y entidades locales `usuario`, `categorias`, `habitos`, `metas` y `pendientes`.
- Feature y pantallas del panel del profesional (`Pacientes`, `Progreso del paciente`); componentes `AvisoSinConexion`, `PantallaEstado` y `dialogos`.
- Casos de prueba TC-005 a TC-008, con resultados del 2026-10-28; registro de release `v1.0.0-corte-3.md`.
- ADR-008: reconciliación del contrato de API y del modelo de datos (decisiones D-07 a D-28).
- ADR-009: el backend vive en `backend/` del repositorio de código.
- `GUIA_COMPLETA_DEL_PROYECTO.md`: guía de estudio del proyecto (arquitectura, código explicado, ejecución en Windows y preparación de la sustentación).
- Contrato: `PATCH /metas/:id`, `DELETE /registros/:id` y códigos `ACTIVE_GOAL_EXISTS`, `IDEMPOTENCY_CONFLICT`.
- Gobernanza: tabla de integrantes y cambio de equipo (Daniel Felipe Fernandez Rojas asume el rol de Javier Esteban Ortiz López).
### Changed
- Corte 3 (2026-10-28): `offline-sync.md` describe la cola S-06 implementada; `authentication.md` añade los roles; `data-model.md` con `usuario.rol` (42 columnas) y la migración de datos semilla, verificado contra la base.
- Pantallas, features, navegación y capas actualizadas a la edición completa y a la navegación por rol; se retiran deudas ya resueltas (temporizador del modal, etiquetas de las flechas de fecha).
- Política de ramas de este repositorio: una sola rama `main` (guía del corte 3); los repositorios de código usan `feat/`/`fix/` + PR con *merge commit*.
- Rutas `backend/` actualizadas a los repositorios `habits-tracker-api` y `habits-tracker-infra`.
- Revisión de coherencia docs ↔ código (2026-10-29): ficha de `POST /auth/register`; códigos `PAYLOAD_TOO_LARGE`, `INTERNAL_ERROR`, `HTTP_ERROR` y mensaje de `TOKEN_EXPIRED` en el contrato; props reales de `AppButton`, `Badge`, `Input` y `StatCard`; catálogo del design system enlazado; matriz de trazabilidad de `Project/README.md` y brechas de HU-02 al día; checklist de seguridad con la sección del servidor; «Overview & tech» con roles y cola sin conexión; índices Q8 y Q9 del modelo de datos.
- Caché local (S-05, 2026-10-25): la app abre con los datos guardados aunque no haya red y muestra el aviso "Sin conexión" con "Reintentar". ADR-004 completamente implementado; fila de pruebas unitarias retirada de la deuda del DoD.
- Integración app ↔ API (2026-10-25): ADR-004 (token), ADR-005 y ADR-006 pasan a Aceptado; hallazgos S-01 a S-04 resueltos; TC-003 describe el archivado; contrato con E-14 `GET /usuarios/me`.
- La ejecución en navegador que HU-01 daba por verificada no funcionaba: faltaban `react-dom` y `react-native-web`, y `Alert.alert` con botones no hace nada en la web. Ambos corregidos en el código.
- `api-contract.md` y `data-model.md` alineados con ADR-008: sin tabla `racha`, `registro_diario` con `cliente_id` y `updated_at`, apellidos opcionales, catálogo de HU-02, reintentos solo en `GET`.
- Puerto y prefijo unificados en `:3000/api/v1` (HU-01, `security-rules.md`); ruta `POST /registros` en plural.
- Las sondas y salidas de verificación del modelo de datos se ejecutaron contra la base real (2026-10-25): 41 columnas, 11 restricciones, 11 índices.
- README: política de ramas actualizada a la vigente (ramas cortas y PR en ambos repositorios).
- Responsables vigentes (roles, features de hábitos y metas, acciones del Sprint 1) pasan a Daniel.
## [1.0.0] - 2026-08-28
### Added
- Manual-style governance scaffold for mobile apps: numbered sections, each with a README and copy-and-fill templates
- `00-sdd-guide.md` — methodology and fill-in order
- 00-governance: agile, git, DoR/DoD, security rules + sprint-retro template
- 01-architecture: structure, layers & state, navigation, ADRs (with example ADR-001) + feature/screen templates
- 02-code-and-ui: coding standards, design system, accessibility, i18n + component template
- 03-api-and-data: networking, auth, persistence, offline-sync + endpoint/entity templates
- 04-quality: testing strategy, performance budgets, mobile security + test-case template
- 05-release: CI/CD, signing & stores, observability + release-checklist template
