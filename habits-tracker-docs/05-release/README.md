# 05 — Entrega

> **¿Qué es esto?** Cómo se compila, firma, distribuye y observa la app. Esta sección contiene
> además **el código fuente de la aplicación**.

## Por qué existe esta sección

La entrega es donde una app móvil más se diferencia de un backend: revisión de tienda,
identidades de firma, despliegues escalonados y actualizaciones forzadas. Estas reglas hacen que
publicar sea repetible y reversible.

---

## 📱 El código de la app

| Carpeta | Contenido |
|---------|-----------|
| [`healthy-habits-tracker/`](./healthy-habits-tracker/) | Aplicación React Native + Expo + TypeScript |

```bash
cd 05-release/healthy-habits-tracker
npm install
npm start
```

El último comando abre el panel de Expo: escanea el QR con **Expo Go** para verla en el
teléfono, o pulsa `a` (Android), `i` (iOS, solo en macOS) o `w` (navegador).

> **⚠️ Copia obsoleta.** Esta carpeta conserva la entrega v1.0.0 del 2026-09-17. Desde
> [ADR-010](../01-architecture/decisions/records/ADR-010-separacion-en-cuatro-repositorios.md), el
> código vive en los repositorios `habits-tracker-app`, `habits-tracker-api` y `habits-tracker-infra`.
> No edites esta copia; se conserva como evidencia histórica de la primera entrega.

---

## ⚠️ Estado actual de la entrega

| Aspecto | Estado |
|---------|--------|
| Distribución | Expo Go para la app; `docker compose` (repositorio `habits-tracker-infra`) para API y base de datos |
| Publicación en tiendas | ❌ **Nunca realizada, y bloqueada** por el hallazgo S-01 |
| Pipeline de CI | ⚠️ Solo el workflow de etiqueta de GitHub en este repositorio; los de código no tienen CI |
| Firma | ❌ No configurada |
| Reporte de fallos | ❌ No integrado |
| Analítica | ❌ No integrada |

---

## Documentos de esta sección

| Archivo | Propósito |
|---------|-----------|
| [ci-cd.md](./ci-cd.md) | Etapas del pipeline, entornos, secretos, EAS Build |
| [signing-and-stores.md](./signing-and-stores.md) | Firma, versionado, metadatos pendientes, despliegue escalonado |
| [observability.md](./observability.md) | Reporte de fallos, analítica, banderas, EAS Update |
| [_template-release-checklist.md](./_template-release-checklist.md) | Checklist de decisión por release (no editar) |
| [releases/](./releases/) | Registros de release ya realizadas |

---

## Releases

| Versión | Fecha | Decisión | Registro |
|---------|-------|----------|----------|
| v1.0.0 (primera entrega) | 2026-09-17 | Entrega académica; **no publicada en tiendas**; sin etiqueta de git | [v1.0.0.md](./releases/v1.0.0.md) |
| v1.0.0 (corte 3) | 2026-10-28 (preparada) | Go para la entrega académica; etiqueta `v1.0.0` en `main` de `-app`, `-api` e `-infra` | [v1.0.0-corte-3.md](./releases/v1.0.0-corte-3.md) |

---

## Correlaciones con otras secciones

| Esta sección depende de... | Por qué |
|----------------------------|---------|
| `00-governance/git-conventions.md` | El versionado y las etiquetas disparan la release |
| `04-quality/` | Pruebas, presupuestos y checklist de seguridad son compuertas de la release |
| `03-api-and-data/` | Un cambio incompatible del API obliga a una actualización forzada |

---

## Preguntas que esta sección debe responder

- ¿Cómo se convierte un commit en un build de tienda?
- ¿Dónde viven las credenciales de firma?
- ¿Cómo se escalona y se revierte un despliegue?
- ¿Cómo se observa la salud de la app en producción?
