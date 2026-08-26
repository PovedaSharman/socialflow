# SocialFlow product specification

Status: working specification  
Last updated: 26 August 2026  
Foundation: Postiz `v2.23.0` (`1e4c8dd5c4f70c4d0abd01e23cc42d5b533d1ab9`)

SocialFlow is a replaceable working name for a public, multi-tenant social-content automation service for creators, businesses and agencies. It retains useful Postiz capabilities and adds the controls, product experience and operating evidence required for a commercial service.

## Product principles

1. Official platform APIs and OAuth flows only. Never scrape a network or ask a customer to paste a platform access token.
2. Every customer-owned object is scoped to an organisation. A user may only act on an organisation through an enabled membership and an authorised role.
3. Publishing is explicit and recoverable. Draft, approval, scheduled, processing, published and failed states are understandable; retries are idempotent.
4. Credentials are secret, encrypted at rest, shown once where appropriate, revocable and never placed in URLs or logs.
5. Expensive AI and video features are opt-in, metered and protected by hard per-organisation budgets.
6. Claims about platform approval, security, retention, privacy or production readiness require evidence.

## Primary journeys and acceptance criteria

### Account and workspace

- A customer can register with email and password, verify email, sign in, sign out and request a single-use, expiring password reset.
- Authentication responses do not reveal whether an email address exists.
- A new user creates or names an organisation during onboarding.
- Owners can invite members as owner, admin, approver, editor or viewer. Invitations expire and can be revoked.
- Disabled or removed memberships immediately lose access.
- Organisation switching cannot select an organisation for which the user lacks an enabled membership.

### Social connections

- Customers connect accounts through the provider's official OAuth flow.
- OAuth state and PKCE are used where supported; callbacks are bound to the initiating organisation and user.
- Access and refresh tokens are encrypted using a separately managed encryption key.
- The product exposes connection health, required action, expiry and reconnect guidance without exposing secrets.
- Provider availability is feature-flagged until its configuration and approval checklist is verified.

### Content workflow

- Customers can create drafts, upload accessible media, customise content per channel, preview, request approval, approve, schedule, publish and inspect results.
- Calendar views remain the primary operational view on desktop and have a usable list alternative on mobile.
- Immediate publication requires an explicit confirmation in the UI and the `posts:publish` scope through APIs. MCP immediate publishing is disabled by default.
- A deterministic idempotency key prevents duplicate publication during retries.
- Failures identify the affected channel, preserve the draft, record retry history and give a useful recovery action.

### Billing and limits

- Stripe operates in test mode until live-mode readiness is explicitly approved.
- Checkout, subscription webhooks and billing portal transitions are verified with Stripe test fixtures.
- Plans are configuration, not conditionals scattered through the codebase.
- Limits cover enabled users, channels, scheduled/published posts, storage bytes, API calls, MCP calls, AI generation units and video spend.
- Limit checks are atomic and server-side. Warnings occur before hard limits, and denied actions explain the next step.

### API, MCP and audit

- API/MCP credentials have a name, organisation, creator, hashed secret, prefix, scopes, creation time, optional expiry, last-used time and revocation time.
- The secret is displayed once. Lists show only the prefix and metadata.
- Streamable HTTP uses `Authorization: Bearer …`; credentials are never accepted in the URL.
- Initial scopes: `audit:read`, `channels:read`, `posts:read`, `posts:draft`, `posts:schedule`, `posts:publish`, `media:generate`. `posts:publish` and `media:generate` are off by default.
- Audit records cover website, API and MCP activity and include actor, organisation, action, target, outcome, source, request ID, safe metadata, IP hash and timestamp.
- Audit storage never includes request credentials, OAuth tokens or full post content.

### Privacy and support

- Customers can export organisation data and request account/organisation deletion, with destructive operations re-authenticated and audited.
- Consent preferences are purpose-specific and versioned.
- Help is searchable and maintained as version-controlled MDX.
- Transactional emails are configurable, branded and written in concise British English.

## Non-functional requirements

- WCAG 2.2 AA for core journeys, keyboard operation, visible focus, labelled validation, reduced motion and non-colour status indicators.
- Responsive support at 360, 768, 1024 and 1440 CSS pixels.
- Structured redacted logs, readiness/liveness checks, error monitoring hooks, metrics hooks and documented backup/restore drills.
- Rate limits by IP for anonymous auth routes and by organisation/credential for authenticated routes.
- Production builds, types, unit/integration tests, accessibility tests and tenant-isolation tests pass in CI.

## Explicitly external or undecided

- Legal entity, controller/processor roles, subprocessors, retention periods, data residency, support service levels and whether customer data may train any model are undecided and must not be claimed.
- Platform app review and production credentials are external launch blockers per provider.
- A production domain, email sending domain, Stripe live account, object storage, monitoring project and infrastructure owner are not yet authorised.
