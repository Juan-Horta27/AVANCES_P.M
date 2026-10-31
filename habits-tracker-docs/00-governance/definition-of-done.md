# Definición de Terminado (DoD)

Una historia de usuario está **terminada solo cuando todo esto es cierto**:

- [ ] Criterios de aceptación cumplidos y verificados.
- [ ] Código integrado a `main` mediante un PR revisado y aprobado por el otro integrante.
- [ ] `npx tsc --noEmit` pasa sin errores de tipos.
- [ ] Pruebas unitarias añadidas y en verde para lógica pura y reglas de negocio (ver [`04-quality/testing-strategy.md`](../04-quality/testing-strategy.md)).
- [ ] Corre en Android e iOS sin regresiones (mínimo exigible: Android físico vía Expo Go, más la vista web).
- [ ] No introduce advertencias nuevas de linter, de tipos ni de accesibilidad.
- [ ] Estados de carga, vacío, error y sin conexión resueltos en la UI.
- [ ] Ningún color, espaciado, radio ni tamaño de fuente escrito a mano: todo sale de `constants/theme.ts`.
- [ ] Ningún texto visible al usuario escrito directamente en la pantalla (ver [`02-code-and-ui/i18n.md`](../02-code-and-ui/i18n.md)).
- [ ] Documentación actualizada: documento de feature o de pantalla, y ADR si se tomó una decisión arquitectónica.

> Una historia que no cumple el DoD completo **no está terminada**: queda abierta. El trabajo
> parcial no se cierra "para terminarlo después".

---

## Estado real del DoD (actualizado el 2026-10-28, entrega del corte 3)

Este proyecto es honesto sobre su deuda. Estos puntos del DoD **no se cumplen todavía**:

| Punto del DoD | Estado | Dónde se resuelve |
|---------------|--------|-------------------|
| Linter configurado en la app | Pendiente en `habits-tracker-app`: solo se corre `tsc --noEmit` (la API sí tiene ESLint + Prettier) | [`02-code-and-ui/coding-standards.md`](../02-code-and-ui/coding-standards.md) |
| Textos centralizados | Pendiente: hay copias literales dentro de las pantallas | [`02-code-and-ui/i18n.md`](../02-code-and-ui/i18n.md) |
| Verificación en iOS | Parcial: verificado en Android y web | [`04-quality/testing-strategy.md`](../04-quality/testing-strategy.md) |

> Esta tabla es un contrato con el tutor y con el equipo: **se vacía, no se amplía**. Cada
> fila que se resuelve se borra de aquí.
