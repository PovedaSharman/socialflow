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
