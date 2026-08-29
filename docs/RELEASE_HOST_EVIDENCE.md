# Milestone 4/5 release-host evidence

Status: **not collected on the development laptop**  
Last updated: 29 August 2026

This workstation must not run Jest, TypeScript builds, Temporal workers,
Compose stacks, browsers or disposable databases. The commands below are for a
suitably provisioned disposable host or CI runner only. Source-level audits and
fail-closed runner guards already exist in-repository; they are not substitutes
for the runtime evidence listed here.

## Required commands

Retain logs, exit codes and dates. Do not paste secrets into the repository.

```bash
pnpm test:account-tenant:release
pnpm test:publish-workflow:release
```

Both runners are fail-closed: they require explicit disposable-test flags, a
database or Temporal namespace containing `test`, a single `--runInBand` Jest
process and a hard memory ceiling. Do not remove those guards to make a run
pass.

## Milestone 4 — account and tenant isolation

Evidence is complete only when all of the following are true:

1. `pnpm test:account-tenant:release` exits 0 on a disposable PostgreSQL
   instance after schema application.
2. The fixed 23-file manifest runs as one sequential Jest process.
3. The retained gate log covers auth middleware, organisation selection,
   invitation lifecycle, content sets, signatures, media resolution, webhook
   channels, social connection mutations, billing tenant routing, OAuth
   transaction units, provider availability, publish-error history, media
   accessibility and media alternative-text disclosure.
4. Adversarial cross-tenant cases in
   `docs/ACCOUNT_TENANT_TEST_MATRIX.md` are marked verified with the host,
   date and artefact path — not merely present in source.

## Milestone 5 — scheduling, OAuth and publishing

Evidence is complete only when all of the following are true:

1. `pnpm test:publish-workflow:release` exits 0 with Temporal histories retained
   under the in-repository ignored artefact path.
2. Histories cover credential refresh, unknown outcome and timeout paths for the
   current publish workflow version without mutating workflows already on
   `origin/main`.
3. OAuth sandbox matrix for each production-candidate provider records connect,
   callback binding, refresh/reconnect, unsafe return rejection and disconnect.
4. Alternative-text transport is sandbox-proven before an adapter declares
   `mediaAlternativeText = 'official-api'` and before its identifier is added to
   `SOCIAL_PROVIDER_ALLOWLIST`.
5. Immediate publish confirmation, failed-post recovery, mobile calendar and
   connection-health behaviour are checked at desktop, tablet and mobile widths
   with keyboard-only and screen-reader notes.
6. Browser accessibility and visual checks for the design-system and composer
   surfaces are retained separately from the source audits.

## Explicitly out of scope on the laptop

Do not attempt the following here:

- Full-repository lint, format, type-check or production builds
- Unbounded Jest or database suites
- Live Compose/Temporal/PostgreSQL/Redis stacks
- Provider sandbox browsers or Stripe live/test dashboards
- Any command that removes disposable-database or Temporal test guards

## Recording results

When a release host completes a gate, update `PROGRESS.md` and
`docs/READINESS.md` with:

- host class (CI job or disposable VM), date and Node version
- exact command and exit code
- artefact path or CI run URL without secrets
- remaining failures, skipped suites and external blockers

Until those updates exist, Milestone 4/5 runtime evidence remains pending.
