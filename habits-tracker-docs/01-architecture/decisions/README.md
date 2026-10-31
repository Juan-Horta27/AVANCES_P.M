# ADRs — Registros de Decisiones de Arquitectura

Un ADR documenta una decisión arquitectónica importante. Cada archivo = una decisión.

## Cómo crear un ADR

1. Copia `_template-adr.md` (**nunca lo edites en su lugar**).
2. Nómbralo `records/ADR-NNN-titulo-corto.md`.
3. Llénalo completo, sobre todo **las alternativas evaluadas**: un ADR sin alternativas es
   un acta, no una decisión.
4. Una vez aceptado, el estado es **permanente**: no se borra, se marca como *Superseded* por
   otro ADR.

## Estados posibles

- `Propuesto` — en discusión
- `Aceptado` — aprobado por el equipo
- `Rechazado` — evaluado y descartado (se documenta por qué)
- `Superado` — reemplazado por el ADR-NNN (se indica cuál)

## Cuándo hace falta un ADR

Hace falta cuando la decisión es **difícil de revertir** o **afecta a todo el código**:

- Añadir o cambiar una librería que toque muchos archivos (estado, navegación, red, almacenamiento).
- Elegir cómo se representa un concepto del dominio (por ejemplo, las fechas).
- Cambiar la estructura de carpetas o los límites entre capas.
- Cambiar una regla de negocio que el backend también debe cumplir.

No hace falta para: añadir un componente, una pantalla, un campo a un formulario, o refactorizar
dentro de un archivo.

---

## Registro de ADRs

| # | Título | Estado | Fecha |
|---|--------|--------|-------|
| [ADR-001](./records/ADR-001-state-management-pattern.md) | Patrón de gestión de estado: React Context + useState | Aceptado | 2026-09-08 |
| [ADR-002](./records/ADR-002-react-native-expo.md) | React Native + Expo como plataforma del cliente | Aceptado | 2026-09-08 |
| [ADR-003](./records/ADR-003-fechas-como-texto-iso.md) | Las fechas de registro se manejan como texto `YYYY-MM-DD` | Aceptado | 2026-09-10 |
| [ADR-004](./records/ADR-004-persistencia-local.md) | AsyncStorage para datos y expo-secure-store para el token | Aceptado | 2026-09-17 |
| [ADR-005](./records/ADR-005-cliente-http.md) | `fetch` nativo envuelto en un único `apiFetch` | Aceptado | 2026-09-17 |
| [ADR-006](./records/ADR-006-estrategia-de-pruebas.md) | Jest + React Native Testing Library | Aceptado | 2026-09-17 |
| [ADR-007](./records/ADR-007-estructura-por-rol-tecnico.md) | Estructura por rol técnico en lugar de feature-first | Aceptado | 2026-09-08 |
| [ADR-008](./records/ADR-008-reconciliacion-contrato-api.md) | Reconciliación del contrato de API y del modelo de datos | Propuesto | 2026-10-25 |
| [ADR-009](./records/ADR-009-backend-en-repositorio-de-codigo.md) | El backend vive en `backend/`, dentro del repositorio de código | Reemplazado por ADR-010 | 2026-10-25 |
| [ADR-010](./records/ADR-010-separacion-en-cuatro-repositorios.md) | Separación en cuatro repositorios (`-docs`, `-app`, `-api`, `-infra`) | Aceptado | 2026-10-28 |
| [ADR-011](./records/ADR-011-roles-y-alcance-completo.md) | Roles, panel del profesional y alcance completo del corte 3 | Aceptado | 2026-10-28 |
| [ADR-012](./records/ADR-012-sin-respuesta-optimista.md) | La app espera la respuesta del servidor: se descarta la respuesta optimista | Aceptado | 2026-10-28 |

> Añade una fila aquí en cuanto crees el archivo en `records/`, no después.
