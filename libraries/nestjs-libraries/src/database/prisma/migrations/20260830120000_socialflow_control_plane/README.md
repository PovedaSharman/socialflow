# Rollback / recovery notes

Migration: `20260830120000_socialflow_control_plane`

## Forward apply (approved host only)

```bash
nvm use
pnpm prisma-migrate-deploy
```

Never use `prisma db push --accept-data-loss` in production.

## What this migration does

- Ensures `Media.fileSize` exists (`INTEGER NOT NULL DEFAULT 0`).
- Creates `ApiCredential`, `AuditEvent` and `ConsentPreference` with indexes and
  foreign keys.

## `Media.fileSize = 0` strategy

Rows that already existed (or uploads that failed to record a size) keep
`fileSize = 0`, meaning **unknown**. Quota enforcement must not treat unknown
as free capacity for new writes once billing is enabled: either refuse uploads
without a trusted size, or run an operator backfill from object-storage HEAD
metadata before enabling hard storage limits in production.

## Rollback considerations

Dropping the new tables loses credential hashes, audit history and consent
records. Prefer forward fixes. If a disposable environment must roll back:

```sql
DROP TABLE IF EXISTS "ConsentPreference";
DROP TABLE IF EXISTS "AuditEvent";
DROP TABLE IF EXISTS "ApiCredential";
-- Do not drop Media.fileSize in production if application code already writes it.
```

Retain database backups taken immediately before migrate deploy.
