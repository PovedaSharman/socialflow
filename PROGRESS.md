# Progress

Last updated: 27 August 2026

## Current implementation milestone: 4 — authentication and tenancy

Milestone 3 implementation is checkpointed; its automated WCAG and visual gate remains pending on a suitable, explicitly approved host.

### Verified

- The starting directory contained no files and no `.git` directory; there was no meaningful application code or Git metadata to preserve.
- Postiz `v2.23.0` at commit `1e4c8dd5c4f70c4d0abd01e23cc42d5b533d1ab9` was imported directly into the project root.
- Work is on `socialflow/main`; `upstream` points to `https://github.com/gitroomhq/postiz-app.git`.
- The baseline is an AGPL-3.0 pnpm monorepo with Next.js, NestJS, Prisma/PostgreSQL, Redis and Temporal.
- Docker 28.1.1 and Compose 2.36.0 are available.
- The project-scoped PostgreSQL, Redis, Temporal, Temporal persistence/search and Mailpit services start healthy from `docker-compose.dev.yaml`.
- Prisma schema application, frontend login, backend monitor/docs endpoints and Temporal worker registration were exercised against the local stack.
- Local registration, captured verification email, activation, login and an authenticated `/user/self` session pass through `pnpm verify:local` without exposing credentials.
- SMTP works with authenticated production relays and unauthenticated local test transports.
- Root lint, formatting, type-check, unit-test and service-control commands are established.

### Audited as present but not yet release-verified

- Password reset and invitation email flows beyond the verified SMTP transport.
- Organisations, team invitations and `SUPERADMIN`/`ADMIN`/`USER` roles.
- Social provider adapters using OAuth or provider-supported authentication.
- Composer, media library, calendar, scheduled publishing, retries and analytics adapters.
- Stripe subscription code and test-listener script.
- Public API, OAuth apps and streamable HTTP/SSE MCP support.
- Basic monitor endpoints and Sentry hooks.

### Gaps discovered

- The host login shell still defaults to Node 20.19.2; commands must run after `nvm use`, and all recorded milestone gates run on Node 22.23.2.
- Social OAuth tokens and legacy API keys are stored in plaintext fields.
- MCP retains URL-embedded API-key routes and renders legacy URL instructions.
- MCP scopes are coarse and do not default-deny immediate publishing or media generation.
- No purpose-built immutable audit, scoped credential, consent or general usage-ledger models exist.
- Role vocabulary is insufficient for approver/editor/viewer separation.
- Provider approval, production credentials, Stripe live mode and production infrastructure are not verified.

### Validation log

| Check                        | Result                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Baseline repository identity | Passed: tag and commit verified against upstream Git refs                            |
| Node/pnpm                    | Passed: Node 22.23.2 selected from `.nvmrc`; pnpm 10.6.1                             |
| Clean bootstrap              | Passed: isolated clone installed, generated Prisma, migrated, seeded and started     |
| Type checking                | Passed: frontend, backend and orchestrator `tsc --noEmit`                            |
| Local dependencies           | Passed: all six default Compose services report healthy                              |
| Runtime smoke                | Passed: frontend, backend, mail capture, activation, login and authenticated session |
| Unit tests                   | Passed before the latest static fixes: 5 suites, 10 tests                            |
| Production builds            | Passed: frontend, backend and orchestrator                                           |
| Formatting                   | Passed for the complete SocialFlow delta from the pinned upstream tag                |
| Lint                         | Passed: root flat ESLint configuration with actual hook correctness checks retained  |
| Accessibility automation     | WCAG 2.2 A/AA specification added; post-change execution remains pending              |

### Milestone 1 repairs

- Added a central, validated brand configuration and used it for auth branding, legal links and analytics domain configuration.
- Replaced the auth wordmark with a configurable code-native mark.
- Restored visible keyboard focus and added reduced-motion behaviour.
- Added the first unit tests and a working root Jest configuration.
- Added strict TypeScript annotations required for backend/orchestrator checks to pass.

No production-readiness claim is made.

### Milestone 2 completed

- Replaced host-coupled development Compose settings with isolated named volumes, health checks and optional inspection tools.
- Added Mailpit and a credential-optional SMTP configuration for safe local verification mail.
- Added documented Node 22 bootstrap, service lifecycle, schema, verification and quality commands.
- Repaired the upstream lint configuration and the conditional visibility hook it exposed.
- Added a repeatable end-to-end local smoke check and unit coverage for visibility state and SMTP configuration.
- Added a production-disabled simulated social provider that performs no outbound requests.
- Added a guarded, idempotent local seed for a developer account, workspace, subscription and simulated connection.
- Verified the documented workflow from an isolated clone against a fresh disposable database: frozen install, Prisma generation/schema application, seed, application start and full local smoke all passed. The temporary clone and database were removed afterward.

### Milestone 3 next

- Run the bounded WCAG and responsive gate on CI or another explicitly approved suitable host.
- Review the recorded 360, 768, 1024 and 1440 pixel renders in both themes before closing the milestone.
- Keep calendar cells and chart treatments with their content and analytics milestones.

### Milestone 3 implementation completed, verification pending

- Added semantic light/dark colour tokens, Tailwind aliases, typography, selection, focus, reduced-motion and touch-target rules.
- Added accessible button, input, badge, alert, skeleton and empty-state primitives plus a protected `/design-system` reference route.
- Made the application shell responsive with labelled primary navigation, a mobile bottom navigation treatment, compact top bar and semantic landmarks.
- Added labelled theme controls, server-rendered theme selection, language attributes on every HTML root, branded sign-in metadata and password-manager-compatible sign-in fields.
- Replaced blank application loading with an announced loading state and added a recoverable, understandable workspace-load error.
- Added a bounded, single-worker Playwright/Axe specification for WCAG 2.0–2.2 A/AA and the four required widths in both themes. It has not been executed after the latest changes.
- Repaired frontend EventEmitter lifecycle management: subscriptions now remove their exact callback, the support cleanup uses the correct event name, and no frontend component calls `removeAllListeners()`.
- Added unit specifications for status tone treatment, exact navigation matching and isolated theme listener cleanup. The two newest specifications remain unexecuted under the workstation safety restriction.

### Workstation resource safety

- The combined development launcher is disabled; application watchers must be started individually and the browser-extension watcher is opt-in.
- Node quality and application scripts have explicit V8 heap caps, Jest is single-worker, and workspace builds remain serial.
- Every local Compose service has a memory ceiling. These ceilings protect containers, while the documentation correctly notes that a V8 heap cap is not a hard whole-process limit.
- After a frontend-only responsive-review attempt exhausted host resources, all application listeners and all local containers were stopped. No runtime, browser automation, build, or full-stack check should be run on this workstation without explicit user approval.
- Lightweight verification after the milestone 3 changes passed: formatting, lint, frontend type-check, Compose configuration validation, and 5 Jest suites / 10 tests. Runtime WCAG and visual evidence remains unverified and is not claimed.
- Subsequent lightweight-only accessibility and listener-lifecycle fixes passed `git diff --check` and manual source review only; formatting, type-checking and tests were deliberately not rerun after the user prohibited memory-heavy commands.

### Milestone 4 in progress

- Centralised active-organisation selection. Explicit workspace requests now fail closed when the membership is absent, disabled or malformed instead of silently falling back.
- `/user/change-org` validates the current user's active membership before writing the organisation cookie; organisation listings use the same active-membership predicate.
- Disabled memberships can no longer be used through the support impersonation path.
- Separated administrator role checks from subscription entitlements. Disabling Stripe no longer grants ordinary users administrator-only policies, and role denials return 403 rather than a billing error.
- Replaced raw unauthenticated registration and login exceptions with stable public messages that do not disclose whether an account exists. Activation recovery remains available as an unconditional sign-in link.
- Made password-reset tokens atomic and single-use without a schema migration: a signed HMAC fingerprint binds each token to the current password hash, and the update includes that hash in its database predicate.
- Added pure/unit specifications for active-organisation selection, administrator roles, billing-disabled role enforcement, public auth messages and password-reset fingerprints. They are intentionally unexecuted under the current workstation restriction.
- Current static verification: `git diff --check`, package JSON parsing and manual source review. No compiler, test runner, app process, container or browser was started.

### Milestone 4 next

- Replace stateless team invitation JWTs with persisted, expiring and revocable invitations.
- Expand membership roles to owner, admin, approver, editor and viewer while retaining a documented legacy-data migration.
- Introduce separately keyed authenticated encryption for social OAuth access and refresh tokens, with safe key rotation and no plaintext fallback in production.
- Build the cross-tenant access matrix and account-lifecycle integration tests for execution on a suitable host.
