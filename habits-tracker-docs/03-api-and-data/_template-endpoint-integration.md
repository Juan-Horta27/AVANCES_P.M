# Endpoint Integration — [Name]

> **Copy this file** to document how the app consumes one backend endpoint.

- **Feature:** [feature name]
- **Method + path:** `GET /v1/orders/{id}`
- **Auth required:** Yes / No

---

## Request

| Param | In | Type | Required | Notes |
|-------|----|------|----------|-------|
| `id` | path | string | Yes | Order identifier |

**Body (if any):**
```json
{ }
```

---

## Response

**Success (2xx):**
```json
{ "id": "...", "status": "..." }
```

**DTO → domain mapping:**
| DTO field | Domain field | Transform |
|-----------|--------------|-----------|
| `status` | `OrderStatus` | map string → enum |

---

## Errors

| Status | Meaning | App behavior |
|--------|---------|--------------|
| 401 | Unauthenticated | Refresh token / sign out |
| 404 | Not found | Show empty/not-found state |
| 5xx | Transient | Backoff + retry, then error |

---

## Caching / offline

- **Strategy:** [online-only / read-through / offline-first]
- **Cached entity:** [entity name — see `_template-entity.md`]
- **TTL / invalidation:** [when cache is refreshed]
