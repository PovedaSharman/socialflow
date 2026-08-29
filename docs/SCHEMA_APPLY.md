# Schema apply notes (release host)

Do **not** run Prisma generate or `db push` on the development laptop.

New models since the SocialFlow control work:

- `ApiCredential`
- `AuditEvent`
- `ConsentPreference`

On an approved disposable host:

```bash
nvm use
pnpm exec prisma generate --schema libraries/nestjs-libraries/src/database/prisma/schema.prisma
# Prefer a reviewed migration on production-like hosts.
# Local disposable stacks may use the project's documented schema-apply command.
```

Record the host, command, exit code and date in `PROGRESS.md` and
`docs/READINESS.md`. Schema presence in Git is not runtime evidence.
