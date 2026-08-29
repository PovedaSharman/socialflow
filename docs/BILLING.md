# Billing and Stripe

Status: **partial** — webhook replay protection, test-mode production gate and
hard usage-limit denials with next-step guidance are in source. Checkout/portal
fixtures and live Stripe proofs remain pending on an approved host.

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
- `usage.limit.ts` resolves channel allowance from plan configuration and
  purchased allotments, enforces hard comparisons, and supplies British-English
  denial messages with an explicit next step. `SubscriptionException` (HTTP 402)
  returns `message` and `nextStep` for clients.
- Channel, webhook and monthly post checks use the same hard-limit helper. Video
  generation continues to use credit balances and raises the same exception shape.
- Plan configuration now includes `mcp_calls_per_month`, `api_calls_per_month`
  and `storage_bytes`. MCP HTTP sessions increment a Redis monthly counter and
  return HTTP 402 with `message`/`nextStep` when over budget. Media uploads
  aggregate `fileSize` and refuse new files that would exceed storage.
- Public API mutations (non-GET) increment a Redis monthly API counter via
  `PublicAuthMiddleware` and return HTTP 402 with the same denial shape when
  over budget. Auth mutations and `/public/v1/*` writes remain rate-limited by
  the Nest throttler.

## Operator notes

Keep `ALLOW_STRIPE_LIVE_MODE` unset. Configure `STRIPE_SECRET_KEY=sk_test_…`,
publishable key and signing secrets from the Stripe test dashboard only.

```bash
pnpm check:billing-safety
```

Checkout, portal, replay/idempotency runtime proofs and the full limit matrix
against Stripe test fixtures remain pending on an approved host.
