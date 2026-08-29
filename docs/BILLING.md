# Billing and Stripe

Status: **partial** — webhook replay protection and test-mode production gate
are in source. Hard usage-limit enforcement proofs, checkout/portal fixtures and
live-mode approval remain pending.

## Required end state

- Stripe runs in test mode until `ALLOW_STRIPE_LIVE_MODE=true` is explicitly set
  with a `sk_live_` secret on an approved host.
- Checkout, customer portal and subscription lifecycle webhooks are verified
  with Stripe test fixtures.
- Webhook delivery is signature-checked and idempotent by Stripe event id.
- Plan limits for users, channels, posts, storage, API/MCP calls, AI and video
  are enforced server-side with understandable denial messages.

## Current source controls

- `claimStripeWebhookEvent` stores each processed event id in Redis with NX and
  a seven-day TTL so duplicate Stripe deliveries short-circuit safely.
- `isStripeBillingConfigured` accepts only `sk_test_` secrets in production
  unless live mode is attested.
- The `/stripe` webhook controller refuses unconfigured modes with HTTP 503 and
  acknowledges duplicate event ids without re-running handlers.

## Operator notes

Keep `ALLOW_STRIPE_LIVE_MODE` unset. Configure `STRIPE_SECRET_KEY=sk_test_…`,
publishable key and signing secrets from the Stripe test dashboard only.

```bash
pnpm check:billing-safety
```

Checkout, portal, replay/idempotency runtime proofs and hard limit matrix
evidence remain pending on an approved host.
