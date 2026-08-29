# Release readiness report

Status: **not production-ready**  
Assessment date: 29 August 2026

## Definition of Done (must all be evidenced)

| Journey / gate                                 | Status                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| Register → verify email → onboard              | Source/local smoke historically recorded; re-verify on current RC off-host |
| Connect channel → schedule/publish             | Source audits only; Temporal/OAuth runtime pending                         |
| MCP scoped credentials                         | Source done; Prisma migrate + live proofs pending                          |
| Stripe test billing + hard limits              | Source done; fixture matrix pending                                        |
| Privacy export/deletion + audit                | Source done; browser + migrate pending                                     |
| WCAG AA / responsive / production builds       | Pending off-host                                                           |
| Backup restore drill + monitoring destinations | Runbook only; drill not recorded                                           |
| Legal/infrastructure decisions                 | External blockers                                                          |

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
  request APIs, credential create/revoke audits, settings UI, `/monitor/live` +
  `/monitor/ready`, auth IP throttling, backup/monitoring runbook
  (`docs/OPS_BACKUP_MONITORING.md`).

## Not yet verified (requires approved release host or external systems)

See `docs/RELEASE_HOST_EVIDENCE.md` for commands and recording rules. Summary:

- Milestone 4/5 runtime gates and Temporal publish histories.
- Full-service startup and registration-to-onboarding on the current RC.
- Provider OAuth sandboxes and production allowlist population.
- Prisma migrate for `ApiCredential`, `AuditEvent` and `ConsentPreference`.
- Live MCP and Stripe test matrices.
- GDPR browser proof, restore drill record and monitoring destinations.
- WCAG AA automation, keyboard/responsive review and current production builds.

## External blockers

Production domains/infrastructure, social platform apps and approvals, email
domain, Stripe account/mode decision, object storage, monitoring destinations,
legal/privacy decisions and operational ownership.

This report must be updated with commands, test artefacts and dates; code
presence alone is not evidence. Do not mark the project production-ready until
every Definition-of-Done row is verified or explicitly waived with an owner.
