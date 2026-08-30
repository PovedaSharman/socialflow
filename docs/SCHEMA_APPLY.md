# Schema apply notes (release host)

Do **not** run Prisma generate or migrations on the development laptop.

## Reviewed migrations

Migrations live under
`libraries/nestjs-libraries/src/database/prisma/migrations/`.

On an approved disposable or production-like host:

```bash
nvm use
pnpm prisma-generate
pnpm prisma-migrate-deploy
pnpm prisma-migrate-status
```

Use `prisma migrate deploy` (or `pnpm prisma-migrate-deploy`) for production.
Do **not** use `prisma db push --accept-data-loss` in production.

Local disposable stacks may still use a non-destructive `pnpm prisma-db-push`
only when explicitly documented for that environment. Prefer migrate deploy
whenever `_prisma_migrations` history must be preserved.

## Clean disposable database bootstrap

This repository does not contain the historical upstream Postiz migrations.
Consequently, the additive control-plane migration cannot create a clean
database by itself. For a new test or staging database only, use the guarded
bootstrap command:

```bash
NODE_ENV=staging \
ALLOW_DISPOSABLE_DATABASE_BOOTSTRAP=true \
DATABASE_URL='postgresql://.../socialflow_staging' \
pnpm prisma-bootstrap-disposable
```

The command refuses database names that do not contain `test` or `staging`. It
applies the complete current schema without destructive flags, records the
reviewed control-plane migration as already represented by that schema, then
runs migrate deploy and status. CI must exercise this path from an empty
PostgreSQL database.

This bootstrap is not an existing-production upgrade procedure. Existing Postiz
databases use the reviewed additive migration and `pnpm prisma-migrate-deploy`.

## New objects

- `ApiCredential`
- `AuditEvent`
- `ConsentPreference`
- `Media.fileSize` (existing rows default to `0` = unknown size)

See
`migrations/20260830120000_socialflow_control_plane/README.md`
for rollback and backfill notes.

Record the host, command, exit code and date in `PROGRESS.md` and
`docs/READINESS.md`. Schema presence in Git is not runtime evidence.
