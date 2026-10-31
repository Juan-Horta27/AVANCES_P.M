# Feature — [Feature Name]

> **Copy this file** to `features/<feature>.md` (or your docs location) and fill it in.
> One document per feature. Keep it updated as the feature evolves.

- **Owner:** [name]
- **Status:** Planned | In progress | Shipped
- **Related stories:** [HU-XXX-001, ...]

---

## Purpose

> In one or two sentences: what user problem does this feature solve?

---

## Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| [Screen] | `/route` | [what it does] |

> Spec each screen with [`_template-screen.md`](./_template-screen.md).

---

## State

- **Pattern:** [MVVM / MVI / Store]
- **State object(s):** [name the immutable state model(s)]
- **Key transitions:** [loading → loaded → error, etc.]

---

## Data

- **Use cases:** [PlaceOrder, LoadOrders, ...]
- **Repositories:** [OrderRepository]
- **Remote sources / endpoints:** [method + path — see `03-api-and-data/`]
- **Local persistence:** [entities cached, offline behavior]

---

## Edge cases & states

- [ ] Loading
- [ ] Empty
- [ ] Error / retry
- [ ] Offline
- [ ] Permission denied (if applicable)

---

## Decisions

> Link any ADRs this feature depends on (`decisions/records/ADR-NNN-*.md`).

---

## Tests

- Unit: [use cases / state holder]
- Widget/UI: [key screens]
- Integration/E2E: [critical flow, if any]
