# Release readiness report

Status: **not production-ready**  
Assessment date: 4 September 2026

## Definition of Done (must all be evidenced)

| Journey / gate                                 | Status                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| Register → verify email → onboard              | Source/local smoke historically recorded; re-verify on current RC off-host |
| Connect channel → schedule/publish             | Temporal CI passed at `3d430cda`; OAuth/browser proof pending                         |
| MCP scoped credentials                         | Source done; Prisma migrate + live proofs pending                          |
| Stripe test billing + hard limits              | Source done; fixture matrix pending                                        |
| Privacy export/deletion + audit                | Source done; browser + migrate pending                                     |
| WCAG AA / responsive / production builds       | Builds passed at `3d430cda`; WCAG/responsive pending                         |
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
- Privacy/ops source controls: HMAC IP hashing (`AUDIT_IP_HMAC_KEY`), sanitised
  metadata, best-effort audit writes, credential/API/MCP/website coverage,
  consent/export/deletion request APIs, settings UI, `/monitor/live` +
  `/monitor/ready`, auth IP throttling, backup/monitoring runbook
  (`docs/OPS_BACKUP_MONITORING.md`).
- Storage quota source controls: trusted sizes, Redis reservation, advisory-lock
  insert checks and `check:storage-quota` (runtime concurrency pending).
- Restored design-system documentation covering interaction, keyboard, forms,
  charts, motion, responsive shell, showcase route and WCAG/viewport matrix
  (runtime axe/Playwright still pending).

## Remote CI evidence checked on 4 September 2026

These results apply to committed revision `3d430cda2186d6b454a27c8d73fb419a5cac5cc8`,
not subsequent local edits. GitHub reports successful completion on 31 August:

- [Build](https://github.com/PovedaSharman/socialflow/actions/runs/33385424830):
  serial frontend, backend and orchestrator production builds on Node 22.12.0.
- [Account and tenant gate](https://github.com/PovedaSharman/socialflow/actions/runs/33385424824):
  disposable schema bootstrap and tenant gate; retained `account-tenant-gate-33385424824`.
- [Staging release](https://github.com/PovedaSharman/socialflow/actions/runs/33385424782):
  static audits, focused regressions, all three type-checks, disposable schema
  bootstrap, tenant gate and Temporal publish gate passed. Artifact
  `release-evidence-33385424782` was listed as unexpired when checked.
  The ARM64 image job was skipped; no deployment is evidenced by this run.

Job/step conclusions and artifact metadata were verified through the GitHub API;
artifact contents have not been inspected. Production database migration,
provider sandbox and browser journeys remain separate requirements.

## Not yet verified (requires approved release host or external systems)

See `docs/RELEASE_HOST_EVIDENCE.md` for commands and recording rules. Summary:

- Inspection of retained Temporal histories and provider/browser proofs beyond the passing automated gates.
- Full-service startup and registration-to-onboarding on the current RC.
- Provider OAuth sandboxes and production allowlist population.
- `pnpm prisma-migrate-deploy` for migration
  `20260830120000_socialflow_control_plane` (`ApiCredential`, `AuditEvent`,
  `ConsentPreference`, `Media.fileSize`). Migration SQL is in source; apply is
  pending off-host.
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
