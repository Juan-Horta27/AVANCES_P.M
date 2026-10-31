# ADR-010 — Separación en cuatro repositorios (`-docs`, `-app`, `-api`, `-infra`)

- **ID:** ADR-010
- **Fecha:** 2026-10-28
- **Estado:** Aceptado (2026-10-28: el equipo creó los cuatro repositorios en `code-corhuila`, como pide la aclaración de repositorios del corte 3)
- **Reemplaza a:** [ADR-009](./ADR-009-backend-en-repositorio-de-codigo.md)
- **Autores:** Juan José Horta Vanegas, Daniel Felipe Fernandez Rojas — redactado con asistencia de Claude Code

---

## Contexto

ADR-009 ubicó el backend en `backend/`, dentro del repositorio de código `healthy-habits-tracker`.
La guía del proyecto de aula del corte 3 (§2) y la aclaración del docente del 2026-10-26 exigen
otra topología: cuatro repositorios obligatorios con el prefijo del equipo (`habits-tracker`), y
señalan que "un repositorio de código único con todo dentro no cumple la separación obligatoria".
En la verificación del docente el proyecto figura como **NO CUMPLE** por faltar `-app`, `-api` e `-infra`.

**Restricciones conocidas:**
- El historial de `healthy-habits-tracker` debe conservarse al repartir el código (guía §2), para
  que el trabajo previo de cada integrante siga contando.
- `-infra` no puede contener DDL: el esquema vive en las migraciones de la API.
- La app solo habla con la API y no guarda datos autoritativos.

---

## Decisión

**Decidimos:** repartir el código en tres repositorios nuevos de `code-corhuila`, además de
`habits-tracker-docs`:

| Repositorio | Contenido | Origen |
|---|---|---|
| `habits-tracker-app` | App Expo: `App.tsx`, `index.ts`, `app.json`, `src/`, `.env.example`, pruebas de la app | Raíz de `healthy-habits-tracker` **sin** `backend/` (historial conservado con `git filter-repo`) |
| `habits-tracker-api` | API NestJS, `prisma/` (esquema, migraciones y datos semilla), `Dockerfile`, pruebas | Carpeta `backend/` (historial conservado con `git subtree split`) |
| `habits-tracker-infra` | `docker-compose.yml`, `.env.example`, manual de implementación | Nuevo. El compose de `backend/` se traslada aquí y construye la API desde `../habits-tracker-api` |

`healthy-habits-tracker` queda como referencia, sin cambios nuevos. No se crean los repositorios
opcionales `-db` ni `-tools`: las migraciones y los datos semilla siguen en la API, como permite la guía.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **Cuatro repositorios, con historial conservado (elegida)** | Cumple la guía; conserva la autoría | Un cambio de contrato exige PR coordinados en `-api` y `-app` | — (elegida) |
| Mantener ADR-009 (un repositorio de código) | Un PR por cambio de contrato | Incumple la separación obligatoria | Requisito del curso |
| Repositorios nuevos copiando los archivos sin historial | Más sencillo | Se pierde la autoría; la separación aparece como un solo commit | Prohibido por la guía §2 |
| Añadir `-db` con migraciones y semillas | Separa el esquema | Un repositorio más para dos personas; Prisma genera el cliente desde el esquema de la API | Opcional en la guía y sin beneficio aquí |

---

## Consecuencias

**Positivas:**
- Se cumple la topología obligatoria del curso.
- Arranque reproducible desde `-infra` con `docker compose up`.

**Negativas / Compromisos:**
- Los cambios de contrato se coordinan entre `-api` y `-app` (dos PR que se revisan juntos).
- `tsconfig.json` y `jest.config.js` de la app ya no necesitan excluir `backend/`.
- El `docker-compose.yml` de `backend/` se retira de la API en su primer cambio en el repositorio nuevo.

**Impacto en el sistema:**
- Documentos a actualizar: [`../../project-structure.md`](../../project-structure.md), el README raíz (ficha) y `05-release/README.md`.

---

## Referencias

- Guía del proyecto de aula del corte 3, §2, §4 y §11 (ítem 5).
- Relacionado con: [ADR-009](./ADR-009-backend-en-repositorio-de-codigo.md), [ADR-011](./ADR-011-roles-y-alcance-completo.md).
