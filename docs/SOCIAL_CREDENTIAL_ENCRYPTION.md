# Social credential encryption

SocialFlow stores social access and refresh credentials in authenticated
AES-256-GCM envelopes. The encryption key ring is separate from the database,
session signing keys and provider client secrets.

## Configuration

Set both variables through the production secret manager:

```text
SOCIAL_CREDENTIAL_ENCRYPTION_ACTIVE_KEY_ID=2026-08
SOCIAL_CREDENTIAL_ENCRYPTION_KEYS={"2026-08":"<base64-encoded 32-byte key>"}
```

Key IDs may contain letters, numbers, dots, underscores and hyphens. Generate
each key from a cryptographically secure source, for example `openssl rand
-base64 32`, and never commit or print the result. Production startup fails if
the key ring is missing, malformed, does not contain the active key or contains
a key that is not exactly 32 bytes.

Each stored value contains only a version, key ID, random 96-bit IV, ciphertext
and 128-bit authentication tag. The key is never stored in PostgreSQL. Modified
ciphertext, an unknown key ID and plaintext rows all fail closed in production.
Empty refresh-token values are permitted because some providers do not issue a
refresh token.

## Encrypt existing rows

Do this as a maintenance operation before deploying code that refuses
plaintext credentials:

1. Back up PostgreSQL and record the restore point.
2. Stop or drain every process that can create, refresh or use social
   connections.
3. Provide the complete key ring and active key to the one-off migration job.
4. Run `pnpm credentials:migrate:dry-run` and record the reported row count.
5. Run `pnpm credentials:migrate` once.
6. Confirm its second scan reports zero rows requiring encryption or rotation.
7. Deploy backend and orchestrator with the same key ring, then exercise a test
   provider connection before restoring traffic.

The utility reads at most 100 rows at a time, updates them sequentially and
stops after the table size captured at the start of each scan. It logs counts
only, never credential values. Do not run it concurrently with connection
writes; concurrent inserts are deliberately outside that finite scan.

## Rotate keys

Add the new key to the existing JSON ring, change the active key ID, and repeat
the dry-run and migration steps. Reads continue to accept envelopes made with
any key still in the ring; new and refreshed credentials use the active key.
The migration authenticates old envelopes before re-encrypting them.

Keep the previous key through the deployment rollback window and until backups
encrypted with that key have expired or are covered by the protected recovery
procedure. Remove it only after another dry run reports zero rows requiring
rotation and rollback no longer depends on it. Losing a key makes its
credentials unrecoverable; reconnecting the affected social accounts is the
only application-level recovery.

## Exposure boundaries

Repository writes encrypt access and refresh credentials before persistence.
Only internal publishing, refresh and provider-operation reads decrypt them in
memory. Channel lists, calendar/composer records and integration mutation
responses use explicit non-secret projections. Credentials must never be added
to logs, errors, audit metadata, Temporal workflow inputs or API responses.

Current publishing and refresh workflows use Temporal patch markers so new
executions receive metadata-only activity results. Publishing activities fetch
credentials internally by organisation and integration ID, and refresh
workflows continue as new after each cycle to bound history growth. Legacy
workflow branches remain in code only for deterministic replay; histories
created before this boundary may already contain plaintext tokens. Before a
production-readiness claim, drain or safely complete those executions and use
the approved Temporal retention or namespace replacement procedure so legacy
history is no longer retained. This repository does not claim that external
Temporal history has been purged.

Development may run without a key ring so the simulated provider remains easy
to use. That compatibility path is unavailable when `NODE_ENV=production` and
must never be used with real provider credentials.
