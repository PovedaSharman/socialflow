import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';

const KEY_PREFIX = 'stripe:webhook:event:';
const COMPLETED_TTL_SECONDS = 60 * 60 * 24 * 7; // seven days
const PROCESSING_LEASE_SECONDS = 120;

export type StripeWebhookClaim =
  | { status: 'claimed' }
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
    const expiresAt = Number(raw.slice('processing:'.length));
    return {
      kind: 'processing' as const,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
    };
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
  nowMs = Date.now(),
  leaseSeconds = PROCESSING_LEASE_SECONDS
): Promise<StripeWebhookClaim> {
  const id = String(eventId || '').trim();
  if (!id) {
    return { status: 'duplicate_completed' };
  }

  const key = stripeWebhookEventKey(id);
  const expiresAt = nowMs + leaseSeconds * 1000;
  const processingValue = `processing:${expiresAt}`;

  // Pure SET NX first — fastest path for a never-seen event.
  const created = await ioRedis.set(
    key,
    processingValue,
    'EX',
    leaseSeconds,
    'NX'
  );
  if (created === 'OK') {
    return { status: 'claimed' };
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
    return retry === 'OK' ? { status: 'claimed' } : { status: 'in_progress' };
  }

  if (existing.kind === 'completed') {
    return { status: 'duplicate_completed' };
  }

  if (existing.kind === 'processing' && existing.expiresAt > nowMs) {
    return { status: 'in_progress' };
  }

  // Expired processing lease: reclaim with compare-and-set via GET + SET XX only
  // when the value is still the expired processing token.
  const current = await ioRedis.get(key);
  const currentState = parseState(current);
  if (currentState?.kind === 'completed') {
    return { status: 'duplicate_completed' };
  }
  if (currentState?.kind === 'processing' && currentState.expiresAt > nowMs) {
    return { status: 'in_progress' };
  }

  // Delete expired marker then NX claim. Concurrent reclaimers serialize here.
  if (current && current === (await ioRedis.get(key))) {
    await ioRedis.del(key);
  }
  const reclaimed = await ioRedis.set(
    key,
    processingValue,
    'EX',
    leaseSeconds,
    'NX'
  );
  return reclaimed === 'OK' ? { status: 'claimed' } : { status: 'in_progress' };
}

export async function completeStripeWebhookProcessing(eventId: string) {
  const id = String(eventId || '').trim();
  if (!id) {
    return;
  }
  await ioRedis.set(
    stripeWebhookEventKey(id),
    'completed',
    'EX',
    COMPLETED_TTL_SECONDS
  );
}

export async function releaseStripeWebhookProcessing(eventId: string) {
  const id = String(eventId || '').trim();
  if (!id) {
    return;
  }
  const key = stripeWebhookEventKey(id);
  const current = await ioRedis.get(key);
  if (parseState(current)?.kind === 'processing') {
    await ioRedis.del(key);
  }
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
