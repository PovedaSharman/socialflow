# Progress

Last updated: 29 August 2026

## Current implementation milestone: 5 — content and OAuth

Milestone 3 implementation is checkpointed; its automated WCAG and visual gate remains pending on a suitable, explicitly approved host. Milestone 4's source matrix is assembled, while its PostgreSQL/Jest execution gate remains pending on that host.

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
- Closed a cross-tenant webhook association gap: create/update now de-duplicates channel IDs, validates every channel is active and owned by the selected organisation, and replaces relationships in the same database transaction as the webhook write.
- Bounded webhook channel submissions to 100 entries and enabled nested DTO validation, preventing an unbounded relationship fan-out from reaching repository work.
- Added an opt-in two-tenant webhook suite covering foreign-channel rejection without partial writes, cross-tenant webhook update/delete denial and de-duplicated owned relationships. The account/tenant matrix and bounded audit now cover webhook ownership.
- Files changed for the webhook isolation slice: the webhook repository/DTO, opt-in webhook repository suite, account/tenant matrix guide, bounded coverage audit and this progress record.
- Verification for the webhook isolation slice: targeted Prettier completed under a 128 MB heap cap; the 64 MB account/tenant and resource-safety audits passed with 14 and 15 invariants respectively; `git diff --check` passed. Jest, PostgreSQL, Prisma generation, compiler, application runtime and browser checks were not run and are not claimed.
- Verified reusable content-set list, count, update and deletion predicates against an opt-in two-tenant PostgreSQL suite. Cross-tenant IDs fail without changing the owning tenant, while new records remain bound to the selected organisation.
- Stabilised generated set IDs so the upsert selector and create payload use one value, and bounded IDs, names and content to 128, 120 and 100,000 characters before repository work.
- Files changed for the set isolation slice: the set repository/DTO, opt-in set repository suite, account/tenant matrix guide, bounded coverage audit and this progress record.
- Verification for the set isolation slice: targeted Prettier completed under a 128 MB heap cap; the 64 MB account/tenant and resource-safety audits passed with 16 and 15 invariants respectively; `git diff --check` passed. Jest, PostgreSQL, Prisma generation, compiler, application runtime and browser checks were not run and are not claimed.
- Verified signature listing, default lookup, update and deletion predicates against an opt-in two-tenant PostgreSQL suite, including proof that choosing a new default does not clear another tenant's default.
- Stabilised generated signature IDs across upsert selection and creation, and bounded signature content to 10,000 characters before repository work.
- Files changed for the signature isolation slice: the signature repository/DTO, opt-in signature repository suite, account/tenant matrix guide, bounded coverage audit and this progress record.
- Verification for the signature isolation slice: targeted Prettier completed under a 128 MB heap cap; the 64 MB account/tenant and resource-safety audits passed with 18 and 15 invariants respectively; `git diff --check` passed. Jest, PostgreSQL, Prisma generation, compiler, application runtime and browser checks were not run and are not claimed.
- Added an opt-in two-tenant invitation persistence suite covering organisation-scoped listing and revocation, same-email supersession without cross-tenant revocation, wrong-email denial and membership creation only in the invited organisation.
- The existing hashed-token, expiry and atomic-claim implementation required no behavioural rewrite; the account/tenant matrix now links its source-level invitation checks to database evidence prepared for the release host.
- Files changed for the invitation isolation slice: the opt-in organisation repository invitation suite, account/tenant matrix guide, bounded coverage audit and this progress record.
- Verification for the invitation isolation slice: targeted Prettier completed under a 128 MB heap cap; the 64 MB account/tenant and resource-safety audits passed with 19 and 15 invariants respectively; `git diff --check` passed. Jest, PostgreSQL, Prisma generation, compiler, application runtime and browser checks were not run and are not claimed.
- Made Stripe customer IDs and subscription identifiers unique nullable tenant-routing keys in the Prisma schema, with duplicate-detection queries, migration sequencing and signed-fixture replay requirements documented in `docs/BILLING_TENANT_KEYS.md`.
- Replaced month-by-month credit-cycle iteration with constant-time month arithmetic and added pure boundary specifications, including a ten-year interval, so corrupt or ancient dates cannot multiply work.
- Added an opt-in two-tenant billing repository suite covering customer/subscription lookup, duplicate customer rejection, customer-routed webhook updates, credit aggregation and subscription deletion isolation.
- Files changed for the billing isolation slice: the Prisma schema, subscription service and cycle specification, opt-in subscription repository suite, billing-key runbook, account/tenant matrix guide, account/tenant and resource audits, and this progress record.
- Verification for the billing isolation slice: targeted Prettier completed under a 128 MB heap cap; Prisma `format` completed under 128 MB; the 64 MB account/tenant and resource-safety audits passed with 21 and 16 invariants respectively; `git diff --check` passed. Jest, PostgreSQL migration/application, Prisma client generation, compiler, Stripe fixtures, application runtime and browser checks were not run and are not claimed.
- Added a fixed 18-file release-host account/tenant runner. It refuses to start without three explicit test/disposable-database flags, requires a database name containing `test`, launches one non-shell Jest child with `--runInBand` and caps that child at a 1 GB heap.
- Added a cancel-in-progress, 20-minute GitHub Actions gate with disposable PostgreSQL, schema application and a retained 14-day log artifact. The workflow definition prepares evidence collection but is not itself passing evidence.
- Files changed for the release-host gate slice: the fixed runner, package script, account/tenant CI workflow, matrix guide, account/tenant and resource-safety audits, and this progress record.
- Verification for the release-host gate slice: targeted Prettier completed under a 128 MB heap cap; the runner's fail-closed guard was exercised under 64 MB and exited before Jest; `package.json` parsed under 64 MB; the 64 MB account/tenant and resource-safety audits passed with 22 and 17 invariants respectively; `git diff --check` passed. The 18-file Jest/PostgreSQL gate and GitHub Actions workflow were not executed and are not claimed.

### Milestone 4 next

- Generate the Prisma client and validate the invitation/role schema migrations and account flows on a suitable explicitly approved host.
- Run the credential dry-run, bounded encryption migration and Temporal legacy-history drain/retention procedure on a suitable explicitly approved host, then exercise test-provider reconnect, refresh and publish paths.
- Execute the assembled account lifecycle and two-tenant database matrix on a suitable host, retain its output, repair any failures and update the release-readiness evidence.

### Milestone 5 in progress

- Added deterministic `sfpub:v1:` SHA-256 keys derived from organisation, channel, post, scheduled time and previous release ID. Keys exclude content and credentials, remain stable for the same logical attempt, change on reschedule/repeat and are passed to both main-post and comment providers.
- Updated the local-only SocialFlow test provider to derive its simulated platform ID from that key; its specification calls the provider twice with the same attempt and expects one identical result.
- Removed manual retries for unknown irreversible provider-mutation failures. Unknown outcomes and timeouts now stop, mark the post unconfirmed and tell the user to check the platform; only an explicit pre-publication credential-refresh classification can retry.
- Bounded the overdue missing-post recovery query to the oldest 100 root posts per sweep, which the activity already signals sequentially.
- Added `docs/PUBLISHING_RETRIES.md`, pure publication-key specifications and a 64 MB `check:publish-safety` audit covering seven key, provider, workflow and recovery invariants.
- Files changed for this slice: publication-key helper/specification, social provider contract, posting activity and workflow, local test provider/specification, posts repository, publishing retry guide, root scripts manifest, publish/resource audits, implementation plan and this progress record.
- Verification for this slice: targeted Prettier completed under a 128 MB heap cap; `package.json` parsed under 64 MB; the 64 MB publish-safety and resource-safety audits passed with 7 and 18 invariants respectively; `git diff --check` passed. Jest, TypeScript, Temporal, database, provider runtime and the end-to-end test-provider journey were not run and are not claimed.
- Made automatic publication retry an explicit provider capability. Only adapters declaring `publicationRetry = 'idempotency-key'` after applying the supplied key may retry an irreversible publish following credential refresh; unaudited providers refresh for future use but stop the current attempt.
- Added a posting activity capability check and applied it only to the main/comment mutation retry path. Read-only pending-status checks and downstream plug handling retain their separate retry rules.
- Enabled the capability for the local SocialFlow test provider and asserted it alongside the same-key/same-result behaviour. No external provider is enabled without adapter-specific evidence.
- Files changed for this retry-contract slice: the provider interface, local test provider/specification, posting activity/workflow, publishing retry guide, bounded publish audit and this progress record.
- Verification for this retry-contract slice: targeted Prettier completed under a 128 MB heap cap; the 64 MB publish-safety and resource-safety audits passed with 8 and 18 invariants respectively; `git diff --check` passed. Jest, TypeScript, Temporal and provider runtime checks were not run and are not claimed.
- Added an opt-in real-Temporal workflow suite that runs one worker and three sequential scenarios: a safe credential refresh, an unknown failure after simulated provider acceptance, and a 500 ms mutation timeout. Each scenario asserts one accepted mutation and exports its Temporal history.
- Added a fail-closed release-host runner requiring explicit test/history flags, a Temporal namespace containing `test` and an in-repository artifact path. It starts one non-shell Jest child with a 1 GB heap and a hard 90-second process timeout; generated histories are Git-ignored.
- Made the mutation start-to-close timeout an optional workflow argument with the unchanged ten-minute default, allowing fast timeout evidence in new test histories without changing existing workflow behaviour.
- Files changed for the Temporal evidence slice: the current post workflow, opt-in workflow integration suite, guarded release runner/package script, publishing retry guide, Git ignore rules, publish/resource audits and this progress record.
- Verification for the Temporal evidence slice: targeted Prettier completed under a 128 MB heap cap; the runner's fail-closed guard was exercised under 64 MB and exited before Jest or Temporal; `package.json` parsed under 64 MB; the 64 MB publish-safety and resource-safety audits passed with 10 and 19 invariants respectively; `git diff --check` passed. The Temporal worker, scenarios and exported histories were not executed and are not claimed.
- Added a secret-free connection-health contract with healthy, connecting, expiring, action-required and disabled states; it prioritises required actions, exposes only a valid ISO expiry and fails malformed expiry closed to reconnect.
- Added token expiry to the existing explicit non-secret integration-list projection and derives health in the tenant-scoped controller response. Access and refresh credentials remain excluded.
- Replaced the mouse-only reconnect overlay with a labelled 44×44 button, visible focus ring, non-colour status marker and visible explanatory text in the expanded channel sidebar. Continue and proactive expiring-token reconnect use the same keyboard-operable path.
- Added pure health classification specifications, `docs/CONNECTION_HEALTH.md` and a 64 MB five-invariant connection-health audit covering state logic, secret projection, keyboard/touch affordances and responsive release checks.
- Files changed for the connection-health slice: health helper/specification, integration repository/controller, calendar integration type, channel sidebar UI, connection-health guide, root scripts manifest, bounded health audit and this progress record.
- Verification for the connection-health slice: targeted Prettier completed under a 128 MB heap cap; `package.json` parsed under 64 MB; the 64 MB connection-health, social-credential, account/tenant and resource-safety audits passed with 5, 10, 22 and 19 invariants respectively; `git diff --check` passed. Jest, TypeScript, runtime, keyboard, contrast and responsive visual checks were not run and are not claimed.
- Replaced fragmented OAuth callback keys with one provider-scoped, ten-minute transaction that cannot overwrite an outstanding state and is atomically consumed before credential exchange or integration mutation.
- Bound authenticated initiation to the exact organisation and user, and recheck that the initiating membership remains active at callback time. Enterprise initiation is explicitly distinguished and remains bound to the organisation authorised by its signed request.
- Hardened ordinary OAuth query/fragment state and custom-form nonces to 256-bit randomness at the initiation boundary while preserving platform-issued OAuth 1.0 request tokens. The local-only test provider now follows the same nonce contract.
- Removed reusable OAuth state from the public page/company selection path. Enterprise two-step connections now use a separate random, tenant/provider/integration-bound continuation token that is consumed once after tenant-scoped metadata validation.
- Added pure transaction specifications, `docs/OAUTH_CONNECTION_SECURITY.md` and a 64 MB OAuth connection audit covering transaction expiry/collision/replay, state hardening, tenant/user/provider binding and client continuation handling.
- Files changed for the OAuth binding slice: authenticated/enterprise initiation routes, public callback and two-step route, frontend continuation client, OAuth transaction helper/specification, active-membership repository/service check, Redis test double, local test provider, OAuth security guide, root scripts manifest, bounded audit and this progress record.
- Verification for the OAuth binding slice: targeted Prettier completed under a 128 MB heap cap; `package.json` parsed under 64 MB; the 64 MB OAuth, social-credential, account/tenant and resource-safety audits passed with 18, 10, 22 and 19 invariants respectively; `git diff --check` passed. Jest, TypeScript, Redis runtime, browser flows and live provider OAuth exchanges were not run and are not claimed.

### Milestone 5 next

- Execute the guarded Temporal workflow, connection-health responsive gate and OAuth transaction unit/provider sandbox matrix on the approved host, retain their evidence, then feature-gate every provider whose configuration, scopes, PKCE support or approval status has not been verified.
