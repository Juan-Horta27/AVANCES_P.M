# Local Entity — [Entity Name]

> **Copy this file** to define a local persistence entity (table/collection).

- **Store:** [SQLite / Room / Drift / Realm / key-value]
- **Table/collection:** `snake_case_plural`
- **Schema version introduced:** [n]

---

## Fields

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | string/int | No | Primary key |
| `created_at` | timestamp | No | Set on insert |
| `updated_at` | timestamp | No | Set on update |
| [field] | [type] | [Y/N] | [notes] |

---

## Indexes

| Index | Columns | Reason |
|-------|---------|--------|
| [name] | [columns] | [query it speeds up] |

---

## Relationships

| Related entity | Key | Cardinality |
|----------------|-----|-------------|
| [entity] | `<entity>_id` | 1:N / N:1 |

---

## Sync

- **Synced?** Yes / No
- **Conflict policy:** [last-write-wins / server-wins / merge]

---

## Migration notes

> What migration adds/changes this entity, and how existing rows are handled.
