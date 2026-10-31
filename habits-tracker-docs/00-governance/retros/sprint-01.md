# Retrospectiva de Sprint — Sprint 1

- **Sprint:** 1 (descubrimiento, decisión de stack y primer cliente móvil)
- **Fecha:** 2026-09-17
- **Participantes:** Juan José Horta Vanegas · Javier Esteban Ortiz López
- **Nota posterior:** Esteban se retiró del proyecto; sus acciones pendientes pasaron a Daniel Felipe Fernandez Rojas (ver [`../README.md`](../README.md#integrantes-y-cambios-en-el-equipo)).

---

## Foto del sprint

| Métrica | Valor |
|---------|-------|
| Puntos comprometidos | 34 |
| Puntos completados | 29 |
| Arrastrados al Sprint 2 | 5 (suite de pruebas) |
| Tasa libre de fallos (release) | No medida todavía — no hay crash reporting |

**Entregado:** HU-01 (selección de stack), HU-02 (discovery), y la primera versión del cliente
móvil con 8 pantallas, 10 componentes compartidos y las reglas de negocio replicadas en el
`AppContext`.

---

## Qué salió bien

- Decidir el stack **antes** de codificar evitó reescrituras: el modelo de dominio de HU-02
  pasó tal cual a `src/types/index.ts`.
- Centralizar la paleta en `constants/theme.ts` desde el primer día. Ninguna pantalla tiene
  colores sueltos, y eso hizo trivial mantener el look consistente en 8 pantallas.
- Aislar el estado global en un solo archivo (`AppContext.tsx`) hizo que las pantallas no
  sepan de dónde vienen los datos. Cuando entre el backend, las pantallas no se tocan.
- Tratar las fechas como texto `YYYY-MM-DD` resolvió de raíz el desfase de un día que
  arrastrábamos de la versión web.

## Qué no salió bien

- **No escribimos ni una prueba.** `utils/racha.ts` es la lógica más delicada del producto y
  hoy solo está validada a ojo.
- Los textos de la interfaz quedaron incrustados en las pantallas; hay que deshacer eso antes
  de que crezcan.
- Subimos el código de la app dentro de `05-release/`, que es una sección de documentación.
  Funciona, pero confunde a quien llega nuevo.
- Las HU-01 y HU-02 se escribieron describiendo una app web y quedaron desalineadas con lo
  que terminamos construyendo. Se corrigieron después, no durante.
- Sin linter configurado, las advertencias de estilo solo se detectan en revisión manual.

## Qué vamos a cambiar (acciones)

| Acción | Responsable | Para |
|--------|-------------|------|
| Configurar Jest + React Native Testing Library y cubrir `utils/racha.ts` y `utils/date.ts` | Juan José Horta | Sprint 2 |
| Añadir ESLint + Prettier con `eslint-config-expo` y hacer que el PR falle con advertencias | Daniel Felipe Fernandez (antes: Javier Esteban Ortiz) | Sprint 2 |
| Extraer todos los textos de pantalla a `src/constants/textos.ts` | Daniel Felipe Fernandez (antes: Javier Esteban Ortiz) | Sprint 2 |
| Actualizar la HU afectada **en el mismo PR** que cambia el alcance, no después | Ambos | Permanente |
| Decidir y documentar dónde vive el código de la app (repo aparte o carpeta raíz) | Ambos | Sprint 2 |

---

> Revisar estas acciones al inicio de la retrospectiva del Sprint 2. Las acciones sin
> terminar se arrastran con un motivo explícito o se descartan de forma explícita.
