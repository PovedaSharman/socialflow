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

- Webhook idempotency uses a Redis state machine: a short `processing:` lease
  claims the event, `completed` is written only after the handler finishes, and
  failures release the lease so Stripe retries can run again. Concurrent
  deliveries while a lease is active are acknowledged as in-progress duplicates.
- `isStripeBillingConfigured` accepts only `sk_test_` secrets unless
  `ALLOW_STRIPE_LIVE_MODE=true` is set (every environment).
- The `/stripe` webhook controller refuses unconfigured modes with HTTP 503,
  awaits handlers inside a try/catch, and never logs event payloads or secrets.
- `usage.limit.ts` resolves channel allowance from plan configuration and
  purchased allotments, enforces hard comparisons, and supplies British-English
  denial messages with an explicit next step. `SubscriptionException` (HTTP 402)
  returns `message` and `nextStep` for clients.
- Channel, webhook and monthly post checks use the same hard-limit helper. Video
  generation continues to use credit balances and raises the same exception shape.
- Plan configuration now includes `mcp_calls_per_month`, `api_calls_per_month`
  and `storage_bytes`. MCP HTTP sessions increment a Redis monthly counter and
  return HTTP 402 with `message`/`nextStep` when over budget. Media uploads
  require a trusted positive byte length (multer size, buffered download length,
  or object-store `ContentLength` via HEAD). Redis soft-reserves capacity;
  PostgreSQL re-checks under a per-organisation advisory lock before insert.
  Failures release the reservation and best-effort remove the uploaded object.
  Existing `Media.fileSize = 0` rows mean unknown size — not free capacity —
  and should be backfilled before production hard limits.
- Public API mutations (non-GET) increment a Redis monthly API counter via
  `PublicAuthMiddleware` and return HTTP 402 with the same denial shape when
  over budget. Auth mutations and `/public/v1/*` writes remain rate-limited by
  the Nest throttler.

## Operator notes

Keep `ALLOW_STRIPE_LIVE_MODE` unset. Configure `STRIPE_SECRET_KEY=sk_test_…`,
publishable key and signing secrets from the Stripe test dashboard only.

```bash
pnpm check:billing-safety
pnpm check:storage-quota
```

Checkout, portal, replay/idempotency runtime proofs and the full limit matrix
against Stripe test fixtures remain pending on an approved host.
