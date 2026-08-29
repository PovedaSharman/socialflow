# Release readiness report

Status: **not production-ready**  
Assessment date: 29 August 2026

## Verified (source / laptop-safe)

- Empty starting directory and absence of prior Git metadata.
- Exact import of upstream Postiz `v2.23.0` into the root.
- Presence of the documented monorepo components and baseline feature code.
- Source-level audits under bounded Node heaps (account/tenant, OAuth, publish,
  provider gates, calendar, media accessibility/alt-text, MCP credentials,
  billing safety, onboarding/help, privacy/ops). See `PROGRESS.md`.
- Fail-closed release-host runners and CI workflow definitions for account/
  tenant and Temporal publish gates. Definitions are not passing evidence.
- Privacy/ops source controls: audit sanitisation, consent/export/deletion
  request APIs, settings UI, `/monitor/live` + `/monitor/ready`, auth IP
  throttling, backup/monitoring runbook (`docs/OPS_BACKUP_MONITORING.md`).

## Not yet verified (requires approved release host or external systems)

- Milestone 4/5 runtime gates (`docs/RELEASE_HOST_EVIDENCE.md`).
- Compatible full-service startup, registration-to-onboarding and email
  delivery on the current release candidate.
- Provider OAuth sandboxes, alt-text transport proofs and production allowlist
  population.
- Temporal publish histories for refresh, unknown and timeout outcomes.
- Prisma migrate for `ApiCredential`, `AuditEvent` and `ConsentPreference`.
- Scoped MCP create/use/revoke with hashed secrets and client connection proofs.
- Stripe test checkout, portal, webhook replay/idempotency and hard usage
  limit matrix.
- GDPR export/deletion browser proof, audit completeness under load, recorded
  restore drill and monitoring destinations.
- WCAG AA automation, keyboard review, responsive visual review and current
  production builds.

## External blockers

Production domains/infrastructure, social platform apps and approvals, email
domain, Stripe account/mode decision, object storage, monitoring destinations,
legal/privacy decisions and operational ownership.

This report must be updated with commands, test artefacts and dates; code
presence alone is not evidence. Do not mark the project production-ready until
every Definition-of-Done item above is verified or explicitly waived with an
owner.
