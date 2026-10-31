# Release Checklist — v[X.Y.Z] (build [N])

> **Copy this file** to `releases/vX.Y.Z.md`. One per release. This is the go/no-go record.

- **Version:** vX.Y.Z (build N)
- **Date:** YYYY-MM-DD
- **Release owner:** [name]

---

## Go / No-Go

### Code & tests
- [ ] All target stories meet the [Definition of Done](../00-governance/definition-of-done.md).
- [ ] Unit + widget + integration suites green.
- [ ] No open critical/blocker defects.

### Quality gates
- [ ] Startup time within budget (vs. previous release).
- [ ] App size within budget (increase justified).
- [ ] [Mobile security checklist](../04-quality/mobile-security.md) passed.

### Build & signing
- [ ] Built from CI on `main` at tag `vX.Y.Z`.
- [ ] Signed with the correct release identity.
- [ ] Version + build number bumped.

### Store
- [ ] Store metadata updated (changelog, screenshots, privacy labels).
- [ ] Staged rollout percentage set.
- [ ] Minimum-supported-version reviewed (forced update if needed).

### Observability
- [ ] Crash reporting active; symbols uploaded.
- [ ] New feature flags default off; owners assigned.
- [ ] Rollback trigger and owner confirmed.

---

## Decision

- **Go / No-Go:** [decision]
- **Approved by:** [name]
- **Notes:** [anything the next release owner should know]
