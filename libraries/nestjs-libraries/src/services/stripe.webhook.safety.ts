import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';

const KEY_PREFIX = 'stripe:webhook:event:';
const TTL_SECONDS = 60 * 60 * 24 * 7; // seven days

export function stripeWebhookEventKey(eventId: string) {
  return `${KEY_PREFIX}${eventId}`;
}

/**
 * Claims a Stripe webhook event for processing. Returns false when the same
 * event id was already claimed (replay / duplicate delivery).
 */
export async function claimStripeWebhookEvent(eventId: string) {
  const id = String(eventId || '').trim();
  if (!id) {
    return false;
  }

  const result = await ioRedis.set(
    stripeWebhookEventKey(id),
    '1',
    'EX',
    TTL_SECONDS,
    'NX'
  );
  return result === 'OK';
}

export function isStripeTestModeSecret(secret: string | undefined) {
  const value = String(secret || '').trim();
  return value.startsWith('sk_test_');
}

/**
 * Production may use live keys only after an explicit operator attestation.
 * Until then, only Stripe test secrets are accepted.
 */
export function isStripeBillingConfigured(env: NodeJS.ProcessEnv) {
  const secret = String(env.STRIPE_SECRET_KEY || '').trim();
  if (!secret || secret === 'sk_nothing') {
    return false;
  }

  if (env.NODE_ENV !== 'production') {
    return isStripeTestModeSecret(secret) || secret.startsWith('sk_live_');
  }

  if (env.ALLOW_STRIPE_LIVE_MODE === 'true') {
    return secret.startsWith('sk_live_');
  }

  return isStripeTestModeSecret(secret);
}
