# ADR-007 — Estructura por rol técnico en lugar de feature-first

- **ID:** ADR-007
- **Fecha:** 2026-09-08
- **Estado:** Aceptado
- **Autores:** Juan José Horta Vanegas, Javier Esteban Ortiz López

---

## Contexto

El marco documental que adoptamos propone organizar el código **por feature**
(`features/<feature>/{presentation,domain,data}`), con una regla estricta: ninguna feature
importa de otra. Antes de escribir la primera pantalla había que decidir si seguir esa
propuesta o desviarse de ella conscientemente.

El modelo de dominio que salió de HU-02 es fuertemente entrelazado:

```
Usuario ──< Habito ──< Meta
                  └──< RegistroDiario ──> (deriva) Racha
```

Ninguna de las cinco áreas funcionales de la app puede trabajar sola:

- La pantalla de **Hábitos** muestra la meta activa y la racha de cada hábito.
- La pantalla de **Metas** muestra a qué hábito pertenece cada meta.
- La pantalla de **Registros** muestra el hábito y su unidad de medida.
- El **Dashboard** y el **Historial** leen hábitos, metas y registros a la vez.

**Restricciones conocidas:**
- 8 pantallas en total, un único modelo de dominio, un único usuario en sesión.
- Equipo de dos personas trabajando sobre las mismas entidades en el mismo sprint.
- Se eligió un único contexto global ([ADR-001](./ADR-001-state-management-pattern.md)), que por
  definición es transversal a cualquier partición por feature.

---

## Decisión

**Decidimos:** organizar `src/` **por rol técnico** (`screens/`, `components/`, `context/`,
`navigation/`, `utils/`, `constants/`, `types/`) y **no** por feature, desviándonos de forma
explícita de la recomendación del marco.

Las tres capas del marco (presentación, dominio, datos) se conservan; lo que cambia es que se
separan por archivo en vez de por carpeta. Ver [`../../layers-and-state.md`](../../layers-and-state.md).

**Justificación:**
La regla "ninguna feature importa de otra" solo aporta valor cuando las features son
razonablemente independientes. Aquí no lo son: partir el código en `features/habitos/`,
`features/metas/` y `features/registros/` habría producido imports cruzados entre features
desde el primer día; es decir, la estructura habría anunciado una separación que el dominio no
tiene. Una arquitectura que miente sobre el acoplamiento real es peor que una plana.

El desempate fue el tamaño: con 8 pantallas y un estado global único, el coste de navegar
entre carpetas por rol es despreciable, mientras que el andamiaje feature-first (tres
subcarpetas por feature, cinco features) habría multiplicado por cuatro el número de
directorios para el mismo código.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **Por rol técnico (elegida)** | Refleja el acoplamiento real del dominio; pocos directorios; encaja con un contexto global único | No escala si la app crece a muchos dominios; `screens/` crece plana | — (elegida) |
| Feature-first, como propone el marco | Aísla features; escala bien en apps grandes; permite equipos en paralelo | Imports cruzados inevitables con este dominio; mucho andamiaje para 8 pantallas; no encaja con un único `AppContext` | Anuncia una separación que el dominio no tiene |
| Híbrido: `core/` + `features/` con dominio compartido | Intermedio entre ambos | El dominio compartido acabaría conteniendo casi todo y las features quedarían casi vacías | El resultado práctico es la estructura elegida, con más ceremonia |

---

## Consecuencias

**Positivas:**
- Encontrar código es predecible: cada carpeta responde a una pregunta.
- Ningún import cruzado artificial, porque no hay fronteras artificiales.
- Encaja de forma natural con el estado global único de [ADR-001](./ADR-001-state-management-pattern.md).

**Negativas / Compromisos:**
- `screens/` y `components/` crecen planos. A partir de cierto tamaño habrá que subdividirlos.
- Si llegara un segundo dominio sin relación con hábitos, esta estructura no lo aislaría.

**Umbral de reevaluación:** si la app supera ~15 pantallas, o si aparece un dominio nuevo
independiente (mensajería con el profesional, facturación), se abre un ADR que supersede a este.

**Impacto en el sistema:**
- Afecta a todo `src/`.
- Documentos a actualizar: [`../../project-structure.md`](../../project-structure.md).

---

## Referencias

- Relacionado con: [ADR-001](./ADR-001-state-management-pattern.md), [`../../project-structure.md`](../../project-structure.md)
