# Release readiness report

Status: **not production-ready**  
Assessment date: 29 August 2026

## Verified

- Empty starting directory and absence of prior Git metadata.
- Exact import of upstream Postiz `v2.23.0` into the root.
- Presence of the documented monorepo components and baseline feature code.
- Source-level account/tenant matrix, OAuth connection safety, publish-safety,
  provider release-gate, mobile calendar, media accessibility and media
  alternative-text audits under bounded Node heaps (see `PROGRESS.md`).
- Fail-closed release-host runners and CI workflow definitions for account/
  tenant and Temporal publish gates. Definitions are not passing evidence.

## Not yet verified

- Milestone 4/5 runtime gates on an approved disposable host
  (`docs/RELEASE_HOST_EVIDENCE.md`).
- Compatible full-service startup, registration-to-onboarding and email
  delivery on the current release candidate.
- Provider OAuth sandboxes, alt-text transport proofs and production allowlist
  population.
- Temporal publish histories for refresh, unknown and timeout outcomes.
- Scoped MCP creation/use/revocation and immediate-publish default denial.
- Stripe test checkout, portal, webhook replay/idempotency and hard usage
  limits.
- GDPR export/deletion, audit completeness, backup restore and monitoring.
- WCAG AA automation, keyboard review, responsive visual review and current
  production builds.

## External blockers

Production domains/infrastructure, social platform apps and approvals, email
domain, Stripe account/mode decision, object storage, monitoring destinations,
legal/privacy decisions and operational ownership.

This report must be updated with commands, test artefacts and dates; code
presence alone is not evidence.
