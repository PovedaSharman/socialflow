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
- Audit metadata sanitisation drops secrets, prompts and full post content.
- Client IPs are stored only as HMAC-SHA256 digests using `AUDIT_IP_HMAC_KEY`.
  Without that key, `ipHash` is left null (never unsalted SHA-256).
- Organisation export excludes OAuth tokens and API secrets.
- Deletion requests are audited as `requested`; automated purge across backups and processors waits on legal retention decisions.
- Central activity coverage (sanitised allow/deny/fail):
  - credential create / use / revoke
  - public API scope decisions
  - MCP channel reads, post writes, image/video generation and audit reads
  - website privacy actions and team invitation revocation
- Audit persistence is best-effort: a failed `AuditEvent` write must not flip the
  primary allow/deny/fail outcome. Operators should alert on
  `audit_event_write_failed` log lines separately.

## IP HMAC key rotation and retention

1. Generate a high-entropy secret and set `AUDIT_IP_HMAC_KEY` in the secret manager.
2. On rotation, replace the key. New events use the new digest; historical rows
   keep the old digest and generally cannot be re-linked to the same IP.
3. If a temporary dual-key correlation window is required for investigations,
   keep the previous key offline under break-glass procedures only — do not
   store both keys in application config long-term.
4. Retain audit rows per the (still undecided) security retention schedule;
   hashed IPs follow the same retention as other `AuditEvent` fields.

## Decisions required before launch

Controller identity and contact, lawful bases, processor roles, subprocessors, international transfers, retention schedule, cookie categories, data residency, age restrictions, data-subject request verification, backup deletion and AI-training policy.
