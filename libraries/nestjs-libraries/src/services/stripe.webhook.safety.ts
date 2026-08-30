import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';
import { randomUUID } from 'node:crypto';

const KEY_PREFIX = 'stripe:webhook:event:';
const COMPLETED_TTL_SECONDS = 60 * 60 * 24 * 7; // seven days
const PROCESSING_LEASE_SECONDS = 120;

export type StripeWebhookClaim =
  | { status: 'claimed'; token: string }
  | { status: 'duplicate_completed' }
  | { status: 'in_progress' };

export function stripeWebhookEventKey(eventId: string) {
  return `${KEY_PREFIX}${eventId}`;
}

function parseState(raw: string | null) {
  if (!raw) {
    return null;
  }
  if (raw === 'completed' || raw.startsWith('completed:')) {
    return { kind: 'completed' as const };
  }
  if (raw.startsWith('processing:')) {
    return { kind: 'processing' as const };
  }
  // Legacy NX marker treated as completed so prior successful claims stay idempotent.
  return { kind: 'completed' as const };
}

/**
 * Atomically claims a Stripe event for processing with a short lease.
 * Completed events stay marked for seven days. Failed handlers must release
 * the claim so Stripe retries can run again.
 */
export async function beginStripeWebhookProcessing(
  eventId: string,
  _nowMs = Date.now(),
  leaseSeconds = PROCESSING_LEASE_SECONDS,
  ownerToken = randomUUID()
): Promise<StripeWebhookClaim> {
  const id = String(eventId || '').trim();
  if (!id) {
    return { status: 'duplicate_completed' };
  }

  const key = stripeWebhookEventKey(id);
  const processingValue = `processing:${ownerToken}`;

  // Pure SET NX first — fastest path for a never-seen event.
  const created = await ioRedis.set(
    key,
    processingValue,
    'EX',
    leaseSeconds,
    'NX'
  );
  if (created === 'OK') {
    return { status: 'claimed', token: ownerToken };
  }

  const existing = parseState(await ioRedis.get(key));
  if (!existing) {
    const retry = await ioRedis.set(
      key,
      processingValue,
      'EX',
      leaseSeconds,
      'NX'
    );
    return retry === 'OK'
      ? { status: 'claimed', token: ownerToken }
      : { status: 'in_progress' };
  }

  if (existing.kind === 'completed') {
    return { status: 'duplicate_completed' };
  }

  // Redis expires the processing key atomically. Never delete a claim here:
  // doing so after GET would allow an expired worker to remove a newer owner.
  return { status: 'in_progress' };
}

export async function completeStripeWebhookProcessing(
  eventId: string,
  ownerToken: string
) {
  const id = String(eventId || '').trim();
  if (!id) {
    return;
  }
  const key = stripeWebhookEventKey(id);
  return Number(
    await ioRedis.eval(
      `if redis.call('GET', KEYS[1]) == ARGV[1] then
         redis.call('SET', KEYS[1], 'completed', 'EX', ARGV[2])
         return 1
       end
       return 0`,
      1,
      key,
      `processing:${ownerToken}`,
      COMPLETED_TTL_SECONDS
    )
  );
}

export async function releaseStripeWebhookProcessing(
  eventId: string,
  ownerToken: string
) {
  const id = String(eventId || '').trim();
  if (!id) {
    return;
  }
  const key = stripeWebhookEventKey(id);
  return Number(
    await ioRedis.eval(
      `if redis.call('GET', KEYS[1]) == ARGV[1] then
         return redis.call('DEL', KEYS[1])
       end
       return 0`,
      1,
      key,
      `processing:${ownerToken}`
    )
  );
}

/** @deprecated Use beginStripeWebhookProcessing — kept for audit string checks. */
export async function claimStripeWebhookEvent(eventId: string) {
  const claim = await beginStripeWebhookProcessing(eventId);
  return claim.status === 'claimed';
}

export function isStripeTestModeSecret(secret: string | undefined) {
  const value = String(secret || '').trim();
  return value.startsWith('sk_test_');
}

/**
 * Production may use live keys only after an explicit operator attestation.
 * Non-production still requires a real Stripe secret; live keys are allowed
 * only when ALLOW_STRIPE_LIVE_MODE=true so accidental live use is gated
 * everywhere it is possible.
 */
export function isStripeBillingConfigured(env: NodeJS.ProcessEnv) {
  const secret = String(env.STRIPE_SECRET_KEY || '').trim();
  if (!secret || secret === 'sk_nothing') {
    return false;
  }

  if (env.ALLOW_STRIPE_LIVE_MODE === 'true') {
    return secret.startsWith('sk_live_') || isStripeTestModeSecret(secret);
  }

  return isStripeTestModeSecret(secret);
}
