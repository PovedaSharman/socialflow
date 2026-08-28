# Progress

Last updated: 28 August 2026

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
- Existing social credential rows and pre-boundary Temporal histories may
  contain plaintext tokens until the documented bounded maintenance migration
  and history-retention procedure are executed and verified.
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
| Accessibility automation     | WCAG 2.2 A/AA specification added; post-change execution remains pending             |

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
- Replaced stateless team-invitation JWTs with opaque, high-entropy tokens whose hashes are persisted with the intended email, role, inviter, expiry, acceptance and revocation state. Acceptance is transactional, single-use, email-bound and re-enables an existing disabled membership safely.
- Routed registration, existing-account login, provider authentication and authenticated join flows through the same persisted invitation claim. Invalid, expired, revoked, reused and wrong-email tokens fail closed without exposing invitation contents.
- Added administrator-scoped invitation listing and revocation, required an email for copy-link invitations, escaped invitation-email content, and exposed pending invitations with revocation controls in team settings.
- Expanded the membership schema and invitation controls to owner, admin, approver, editor and viewer. New workspace creators are owners; legacy `SUPERADMIN` and `USER` rows continue to authorise as owner and editor respectively during migration.
- Centralised role normalisation, ranking, team management, editing and approval capabilities. Unknown role values fail closed as viewer; at annotated policy gates, role denials are evaluated before subscription limits and viewer/content or editor/channel denials return 403 rather than billing errors.
- Updated owner-only subscription ownership checks, team-removal hierarchy, public API-key exposure, navigation and team-management UI for the expanded roles. Public API middleware now supplies the direct synthetic owner role expected by the policy guard.
- Added a phased PostgreSQL enum/data migration runbook with compatibility deployment, legacy-row verification and rollback-window requirements in `docs/ROLE_MIGRATION.md`.
- Added pure/unit specifications for active-organisation selection, administrator roles, billing-disabled role enforcement, public auth messages and password-reset fingerprints. They are intentionally unexecuted under the current workstation restriction.
- Added unit specifications for invitation-token entropy/hashing and fail-closed opaque-token resolution. They are intentionally unexecuted under the current workstation restriction.
- Applied explicit role policies to tenant mutations in posts, media, sets, signatures, integrations, third-party connectors, autoposts, webhooks, billing and Copilot. Viewer writes now fail with 403, channel/webhook administration is owner/admin-only, billing is owner-only, and content approval has a distinct policy section.
- Added `scripts/check-tenant-policies.mjs` and a matching Jest regression specification. The bounded 64 MB audit passed across 12 tenant controllers, and `package.json` parsing plus `git diff --check` passed.
- Replaced three potentially unbounded credential-refresh recursions with one-retry guards, bounded integration-function refresh to one retry, and replaced recursive publishing-slot search with an iterative 366-day horizon and understandable errors.
- Added a 64 MB `check:resource-safety` audit covering nine invariants: non-launching root development, serial tests/builds, bounded refresh retries and bounded slot search. Both resource and tenant-policy audits pass.
- Files changed for this slice: the permission enums/service/tests, 12 audited tenant controllers, post and integration services, the billing navigation role filter, the root scripts manifest, and the two bounded audit scripts.
- Targeted Prettier formatting completed under a 256 MB ceiling; `git diff --check` passes.
- A targeted, single-process Jest attempt was deliberately capped at 256 MB and terminated at that heap ceiling before completing. The cap prevented host-level memory growth; the test result is not claimed as passing and the ceiling was not raised.
- The invitation/role schema still requires Prisma generation and reviewed migration validation on a suitable host. No compiler, app process, container, browser, watcher or parallel test worker was started.
- Added durable, tenant-scoped post approval requests with one active request per organisation/post group, retained decision history, requester cancellation, and atomic approve/reject claims.
- Editors can save drafts and request review but cannot schedule or publish; owners, admins and approvers can read the review queue and decide requests; viewers remain read-only. Legacy roles retain their documented compatibility mapping.
- Approval decisions revalidate that every scoped post still exists as a draft and has not changed since submission. Changed or non-draft content is cancelled instead of approved, and editing or deleting a group cancels its pending request.
- Added a bounded reviewer queue that returns an accurate total and at most 50 oldest records. The responsive calendar banner shows loading, failure and empty behaviour without relying on email delivery.
- Added responsive, keyboard-operable composer controls for request, approve, request-changes and requester cancellation, plus visible current/outdated status and understandable network failures.
- Added `docs/APPROVALS.md`, DTO validation, repository specifications for tenant scoping, stale decisions, atomic claims, requester cancellation and the queue bound, and `scripts/check-approval-safety.mjs` with seven low-memory invariants.
- Files changed for the approval slice: the Prisma schema, posts repository/service/controller, permission service/specification, approval DTOs/repository specification, composer and launches UI, approval guide, root scripts manifest, and bounded safety audits.
- Verification for the approval slice: targeted Prettier completed under a 256 MB heap cap; Prisma `format` validated and formatted the schema under 256 MB; the 64 MB approval, resource and tenant-policy audits passed with 7, 10 and 12-controller coverage respectively; `git diff --check` passed.
- Jest, TypeScript, Prisma client generation, database migration execution, application runtime, browser accessibility and production builds were not run after this slice because they exceed the workstation-safe envelope. No result is claimed for those gates.
- Added separately keyed AES-256-GCM envelopes for social access and refresh credentials with random 96-bit IVs, authenticated key IDs, 128-bit tags, multi-key reads and active-key rotation. Missing/malformed keys and plaintext credential reads fail closed in production.
- Integration create, reconnect, page-selection and refresh writes encrypt before persistence. Provider and publishing reads authenticate and decrypt only inside internal services/activities; channel lists, calendar/composer queries and mutation responses now use explicit non-secret projections.
- Tightened the page-selection replacement path so retiring an integration and its posts is organisation-scoped. Removed full integration rows from ordinary list responses and reduced integration mutation responses to IDs.
- Added Temporal patch markers for deterministic compatibility: new post histories use credential-free activity payloads, seal capability-bearing provider pending state, and fetch secrets only inside provider activities; new refresh histories use metadata-only reads, refresh by tenant-scoped ID and continue as new after every cycle. Legacy branches remain only for replay and their retained histories are not claimed clean.
- Added a cursor-based credential migration/rotation utility that captures a finite initial row count, scans at most 100 rows per batch, updates sequentially, verifies with a second scan and logs counts without credential values. Production rollout and key retirement are documented in `docs/SOCIAL_CREDENTIAL_ENCRYPTION.md`.
- Replaced unbounded public-API and MCP integration-trigger refresh loops with a single retry, made public channel post deletion sequential, and expanded the low-memory resource audit to cover these boundaries plus the finite migration and refresh-workflow history.
- Added pure specifications for random authenticated encryption, tamper rejection, old-key rotation and production fail-closed behaviour. They are intentionally unexecuted under the workstation restriction.
- Files changed for the credential slice: the encryption service/specification, database module, integration/post repositories and services, autopost state type, public API and MCP trigger paths, orchestrator activities/current workflows, bounded migration and audit scripts, environment template, deployment/security documentation and the credential runbook.
- Verification for the credential slice: targeted Prettier completed under a 256 MB heap cap; `package.json` parsed under 64 MB; the 64 MB social-credential, resource, approval and tenant-policy audits passed with 10, 15, 7 and 12-controller invariants respectively; `git diff --check` passed. Jest, TypeScript, application/runtime, migration execution and Temporal-history inspection were not run and are not claimed.
- Added an authenticated middleware matrix covering database user re-resolution, forged activation claims, explicit cross-tenant workspace selection, disabled/malformed memberships, password stripping and enabled/disabled support impersonation isolation.
- Expanded account lifecycle specifications for malformed/expired password reset claims, non-local users, stale password fingerprints and a compare-and-swap result that accepts the same reset token only once.
- Added an opt-in PostgreSQL repository suite guarded by `RUN_DATABASE_INTEGRATION_TESTS=true`. It seeds two isolated organisations and verifies cross-tenant post group reads, ID reads, deletion and approval submission return no data and do not mutate the owning tenant.
- Added `docs/ACCOUNT_TENANT_TEST_MATRIX.md` and a 64 MB `check:account-tenant-coverage` audit spanning session, membership, impersonation, password-reset, invitation and database isolation evidence.
- Files changed for this matrix slice: the auth middleware/service specifications, opt-in post repository integration specification, account/tenant matrix guide, root scripts manifest and bounded coverage audit.
- Verification for this matrix slice: targeted Prettier completed under a 256 MB heap cap; the 64 MB account/tenant coverage audit passed eight invariants; `git diff --check` passed. Jest, PostgreSQL setup, Prisma generation, compiler and request-level application tests were not run and are not claimed.
- Closed a cross-tenant social-credential rotation defect: one-time provider token propagation now includes the active organisation predicate, so tenants sharing the same provider account identifier cannot overwrite each other's access or refresh tokens.
- Made channel nickname/profile persistence defence-in-depth tenant-scoped through the controller, service and repository instead of relying only on the preceding scoped lookup.
- Added an opt-in two-tenant integration repository suite covering secret-free channel lists, cross-tenant ID reads and mutations, and same-provider-ID credential rotation isolation. The account/tenant matrix and bounded audit now include this boundary.
- Files changed for the integration isolation slice: the integrations controller/service/repository, opt-in integration repository suite, account/tenant matrix guide, bounded coverage audit and this progress record.
- Verification for the integration isolation slice: targeted Prettier completed under a 128 MB heap cap; the 64 MB account/tenant, social-credential, tenant-policy and resource-safety audits passed with 10, 10, 12-controller and 15-invariant coverage respectively; `git diff --check` passed. Jest, PostgreSQL, Prisma generation, compiler, application runtime and browser checks were not run and are not claimed.
- Closed a cross-tenant media-resolution gap: media lookup now requires the active organisation and excludes soft-deleted rows, and every composer/read/publishing resolution path passes its already authenticated organisation ID.
- Added an opt-in two-tenant media repository suite covering isolated lists, cross-tenant ID lookup, metadata edits and deletion, plus denial of soft-deleted attachment resolution. The account/tenant matrix and bounded audit now cover media ownership.
- Files changed for the media isolation slice: the media repository/service, post service, publishing activity, opt-in media repository suite, account/tenant matrix guide, bounded coverage audit and this progress record.
- Verification for the media isolation slice: targeted Prettier completed under a 128 MB heap cap; the 64 MB account/tenant and resource-safety audits passed with 12 and 15 invariants respectively; `git diff --check` passed. Jest, PostgreSQL, Prisma generation, compiler, application runtime and browser checks were not run and are not claimed.

### Milestone 4 next

- Generate the Prisma client and validate the invitation/role schema migrations and account flows on a suitable explicitly approved host.
- Run the credential dry-run, bounded encryption migration and Temporal legacy-history drain/retention procedure on a suitable explicitly approved host, then exercise test-provider reconnect, refresh and publish paths.
- Extend the opt-in two-tenant database/request matrix to webhooks, sets, signatures, invitations and billing, then execute the complete account lifecycle gate on a suitable host.
