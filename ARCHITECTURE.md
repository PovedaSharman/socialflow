# Architecture

## Baseline

This repository is based on Postiz `v2.23.0`, an AGPL-3.0 TypeScript/pnpm monorepo.

| Area              | Location                                                | Responsibility                                                                          |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Web               | `apps/frontend`                                         | Next.js 16 / React 19 UI, App Router, responsive product journeys                       |
| API               | `apps/backend`                                          | NestJS HTTP API, authentication, OAuth callbacks, webhooks, public API and MCP mounting |
| Orchestration     | `apps/orchestrator`                                     | Temporal workers and durable publishing/refresh/email workflows                         |
| Browser extension | `apps/extension`                                        | Optional extension; not a substitute for official OAuth in the public SaaS              |
| SDK/CLI support   | `apps/sdk`, `apps/commands`                             | External API tooling                                                                    |
| Domain services   | `libraries/nestjs-libraries`                            | Prisma repositories, integrations, billing, mail, MCP tools and shared services         |
| Shared UI/helpers | `libraries/react-shared-libraries`, `libraries/helpers` | Form components, contexts, fetching and common utilities                                |

Runtime dependencies are PostgreSQL, Redis, Temporal and local or S3-compatible object storage. Optional external systems include Stripe, Resend, Sentry and approved social provider APIs.

## Request and tenant boundary

The selected organisation is derived from an authenticated request and checked against current `UserOrganization` membership before controllers run. Repositories must accept the authorised organisation ID and include it in every customer-data predicate. Resource IDs alone are not authorisation.

Public API and MCP credentials resolve directly to one organisation and a scope set. Background jobs carry the organisation ID and immutable actor/request metadata. Administrative cross-tenant actions require explicit super-admin authorisation, a reason and an audit event.

## Security changes required from upstream

- Replace plaintext `Integration.token`, `Integration.refreshToken`, `Organization.apiKey` and GitHub tokens with encrypted or hashed credential records and a rotation path.
- Remove MCP `/mcp/:id`, `/sse/:id` and `/message/:id` URL-secret routes after a compatibility window; never render URL credentials in new instructions.
- Replace `mcp:read`/`mcp:write` with tool-level granular scopes and deny immediate publishing/media generation by default.
- Add immutable audit, usage ledger, idempotency and consent models.
- Add database constraints and tests that bind related records to the same organisation.
- Redact secrets and content from logs; request IDs must not be credentials.

## Publishing reliability

The API stores the desired post and an outbox/idempotency record in one transaction. Temporal starts a workflow keyed by publication ID. Provider calls use the idempotency key where supported; otherwise the workflow records an attempt before the call and reconciles ambiguous results. Retries are bounded and classify permanent versus transient failures. A terminal event updates the post, usage ledger, audit log and customer notification.

## Deployment topology

Run frontend, backend and orchestrator as separate processes from the same immutable release. PostgreSQL, Redis, Temporal and object storage are private services. Only the web/API ingress is public. Health endpoints distinguish liveness from dependency readiness. Database migrations run once as a release job; application startup must not use destructive schema push.

## AGPL boundary

The combined modified service remains subject to AGPL-3.0 unless qualified legal advice establishes otherwise. Users interacting with the deployed service over a network must be offered the corresponding source for the running version. Preserve `LICENSE`, upstream notices and change history. See `docs/LICENSING.md`; it records operational obligations, not legal advice.
