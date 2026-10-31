# Screen — [Screen Name]

> **Copy this file** to spec a single screen. Keep it short and visual.

- **Route:** `/route`
- **Feature:** [feature name]
- **Design reference:** [link to mockup]

---

## Purpose

> What can the user do on this screen?

---

## UI regions

| Region | Component | Notes |
|--------|-----------|-------|
| Header | [component] | [title, actions] |
| Body | [component] | [list / form / detail] |
| Footer / CTA | [component] | [primary action] |

---

## States

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Data in flight | [skeleton / spinner] |
| Loaded | Data ready | [content] |
| Empty | No data | [empty state + action] |
| Error | Request failed | [message + retry] |
| Offline | No connectivity | [banner / cached data] |

---

## Actions

| User action | Result | Use case / event |
|-------------|--------|------------------|
| [tap CTA] | [what happens] | [PlaceOrder] |

---

## Accessibility

- [ ] All interactive elements have accessible labels.
- [ ] Touch targets ≥ 44×44 pt / 48×48 dp.
- [ ] Text scales with OS font-size setting.
- [ ] Contrast meets WCAG AA.
