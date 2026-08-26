# Progress

Last updated: 26 August 2026

## Current milestone: 2 — local environment

### Verified

- The starting directory contained no files and no `.git` directory; there was no meaningful application code or Git metadata to preserve.
- Postiz `v2.23.0` at commit `1e4c8dd5c4f70c4d0abd01e23cc42d5b533d1ab9` was imported directly into the project root.
- Work is on `socialflow/main`; `upstream` points to `https://github.com/gitroomhq/postiz-app.git`.
- The baseline is an AGPL-3.0 pnpm monorepo with Next.js, NestJS, Prisma/PostgreSQL, Redis and Temporal.
- Docker 28.1.1 and Compose 2.36.0 are available.

### Audited as present but not yet release-verified

- Local registration, activation email, login and password reset.
- Organisations, team invitations and `SUPERADMIN`/`ADMIN`/`USER` roles.
- Social provider adapters using OAuth or provider-supported authentication.
- Composer, media library, calendar, scheduled publishing, retries and analytics adapters.
- Stripe subscription code and test-listener script.
- Public API, OAuth apps and streamable HTTP/SSE MCP support.
- Basic monitor endpoints and Sentry hooks.

### Gaps discovered

- The login shell still defaults to Node 20.19.2; `.nvmrc` selects the installed compatible Node 22.23.2 runtime.
- Social OAuth tokens and legacy API keys are stored in plaintext fields.
- MCP retains URL-embedded API-key routes and renders legacy URL instructions.
- MCP scopes are coarse and do not default-deny immediate publishing or media generation.
- No purpose-built immutable audit, scoped credential, consent or general usage-ledger models exist.
- Role vocabulary is insufficient for approver/editor/viewer separation.
- The global stylesheet removes visible focus outlines.
- Provider approval, production credentials, Stripe live mode and production infrastructure are not verified.

### Validation log

| Check                        | Result                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| Baseline repository identity | Passed: tag and commit verified against upstream Git refs                                     |
| Node/pnpm                    | Passed: Node 22.23.2 recorded in `.nvmrc`; pnpm 10.6.1                                        |
| Install                      | Passed: `pnpm install --frozen-lockfile`; Prisma client generated                             |
| Type checking                | Passed: frontend, backend and orchestrator `tsc --noEmit`                                     |
| Unit tests                   | Passed: 1 suite, 2 tests; baseline had no tests and its broken Nx Jest reference was replaced |
| Production builds            | Passed: frontend, backend and orchestrator                                                    |
| Formatting                   | Passed for all files changed in milestone 1                                                   |
| Lint                         | Missing upstream script/configuration; must be established in milestone 2                     |
| Accessibility automation     | Missing upstream gate; focus suppression repaired, full checks pending milestone 3            |

### Milestone 1 repairs

- Added a central, validated brand configuration and used it for auth branding, legal links and analytics domain configuration.
- Replaced the auth wordmark with a configurable code-native mark.
- Restored visible keyboard focus and added reduced-motion behaviour.
- Added the first unit tests and a working root Jest configuration.
- Added strict TypeScript annotations required for backend/orchestrator checks to pass.

No production-readiness claim is made.
