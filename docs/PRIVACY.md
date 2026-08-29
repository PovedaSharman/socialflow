# Privacy decisions and implementation requirements

This document is not a privacy notice or legal advice. It prevents the product from inventing policy while legal and operational decisions are pending.

## Data categories observed in the baseline

Account/profile data, organisation membership, social OAuth credentials, social profile identifiers, post content, media, publish results/errors, billing identifiers, IP/user-agent data, analytics results and support/audit activity.

## Product requirements

- Collect only data required for a disclosed purpose.
- Record versioned consent separately from contractual/operational processing.
- Offer machine-readable export and authenticated deletion request flows.
- Define deletion propagation for primary data, media, logs, backups and processors.
- Keep audit/security retention separate from product-content retention.
- Do not send customer content to an AI provider without an explicit action and disclosed provider/purpose.

## Implemented in source (not production evidence)

- `AuditEvent` and `ConsentPreference` models (require off-host Prisma migrate).
- Admin APIs under `/user/privacy/*` for audit listing, consent record/list, organisation export and password-reauthenticated deletion requests.
- Settings UI tab **Privacy and audit** for organisation admins.
- Audit metadata sanitisation drops secrets and full post content; IP addresses are stored hashed.
- Organisation export excludes OAuth tokens and API secrets.
- Deletion requests are audited as `requested`; automated purge across backups and processors waits on legal retention decisions.

## Decisions required before launch

Controller identity and contact, lawful bases, processor roles, subprocessors, international transfers, retention schedule, cookie categories, data residency, age restrictions, data-subject request verification, backup deletion and AI-training policy.
