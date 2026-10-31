# Convenciones de Git

## Cuatro repositorios, dos políticas

Desde [ADR-010](../01-architecture/decisions/records/ADR-010-separacion-en-cuatro-repositorios.md) el proyecto
vive en cuatro repositorios de `code-corhuila`. La guía del corte 3 (sección "Ramas") fija la política:

| Repositorio | Política de ramas | Motivo |
|-------------|-------------------|--------|
| **`habits-tracker-docs`** (este repo) | **Una sola rama, `main`**, con commits directos | Política del curso para el repositorio de documentación. La revisión cruzada se hace leyendo el commit del otro integrante. |
| **`habits-tracker-app`**, **`habits-tracker-api`**, **`habits-tracker-infra`** | Ramas cortas `feat/` o `fix/` desde `main` + Pull Request revisado | Ningún cambio de código entra sin revisión de la otra persona. Se evalúa la etiqueta `v1.0.0` sobre `main` de cada uno. |

> Hasta el 2026-10-28 este repositorio usaba ramas `docs/<sección>` y PR; se pasó a una sola rama
> para cumplir la guía del corte 3. El historial anterior se conserva tal cual.
> Las secciones de ramas, Pull Requests y releases que siguen son propias de los **repositorios de código**.

---

## Ramas

- Desarrollo basado en tronco (`main`) con ramas de vida corta.
- Nombres de rama: `feat/<alcance>` y `fix/<alcance>` (los que pide la guía); `chore/<alcance>` para mantenimiento.
  - Ejemplos reales del proyecto: `feat/racha-calculo`, `feat/pantalla-historial`,
    `fix/fecha-desfase-zona-horaria`, `chore/expo-sdk-57`.
- Una rama vive a lo sumo unos pocos días. Se rebasa sobre `main` antes de abrir el PR.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/): `tipo(alcance): resumen`.
- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.
- Modo imperativo, máximo 72 caracteres en la línea de resumen. El resumen va **en español**.

**Alcances (`scope`) válidos en este proyecto**, alineados con la estructura de `src/`:

| Alcance | Cubre |
|---------|-------|
| `auth` | `LoginScreen`, `RegisterScreen`, acciones de sesión del contexto |
| `habitos` | `HabitosScreen` y las acciones de hábitos |
| `metas` | `MetasScreen` y las acciones de metas |
| `registros` | `RegistrosScreen`, `NuevoRegistroScreen` |
| `dashboard` | `DashboardScreen` y sus métricas derivadas |
| `historial` | `HistorialScreen` |
| `racha` | `utils/racha.ts` |
| `ui` | Componentes de `src/components/` |
| `tema` | `constants/theme.ts` |
| `nav` | `src/navigation/` |
| `estado` | `context/AppContext.tsx` |

Ejemplos:

```
feat(registros): impedir dos registros del mismo habito en la misma fecha
fix(racha): no romper la racha cuando aun no hay registro de hoy
refactor(estado): extraer consultas derivadas a useMemo
docs(adr): registrar ADR-003 sobre fechas como texto ISO
```

## Pull Requests

- Un PR = una historia o un arreglo. Mantenerlo revisable (menos de ~400 líneas cuando se pueda).
- La descripción del PR enlaza la historia y **lista qué probar en el dispositivo**.
- CI en verde (tipos + pruebas) antes de la revisión.
- Una aprobación, del otro integrante. Se integra con **"Create a merge commit"** (no *squash*):
  así cada commit conserva su autor y su fecha, que es la evidencia de aporte individual que revisa el curso.

Plantilla mínima de descripción de PR:

```
Historia: HU-XX
Qué cambia: ...
Cómo probarlo en el teléfono:
  1. ...
  2. ...
Estados cubiertos: cargando / vacío / error / sin conexión
Documentos actualizados: ...
```

## Releases

- La versión de la app sigue [SemVer](https://semver.org/): `MAJOR.MINOR.PATCH`, declarada en
  `app.json` (`expo.version`) y en `package.json`.
- El número de build es un entero monótono que se incrementa en cada subida a tienda; nunca se reutiliza.
- Las releases se etiquetan `vX.Y.Z` sobre `main`. En este repositorio, la etiqueta dispara
  [`.github/workflows/release.yml`](../.github/workflows/release.yml).
- **Entrega del corte 3:** la etiqueta `v1.0.0` se crea sobre `main` de `habits-tracker-app`,
  `habits-tracker-api` y `habits-tracker-infra`, con fecha anterior al cierre. Ver
  [`05-release/releases/v1.0.0.md`](../05-release/releases/v1.0.0.md) para la aclaración sobre la
  `v1.0.0` anterior de este repositorio.
- Cada release deja su registro de decisión en `05-release/releases/vX.Y.Z.md`.
