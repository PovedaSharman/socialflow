import {
  beginStripeWebhookProcessing,
  completeStripeWebhookProcessing,
  isStripeBillingConfigured,
  isStripeTestModeSecret,
  releaseStripeWebhookProcessing,
  stripeWebhookEventKey,
} from './stripe.webhook.safety';

const data = new Map<string, string>();

jest.mock('@gitroom/nestjs-libraries/redis/redis.service', () => ({
  ioRedis: {
    async set(key: string, value: string, ...args: Array<string | number>) {
      if (args.includes('NX') && data.has(key)) {
        return null;
      }
      data.set(key, value);
      return 'OK';
    },
    async get(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    async del(key: string) {
      data.delete(key);
      return 1;
    },
  },
}));

describe('Stripe webhook safety', () => {
  beforeEach(() => {
    data.clear();
  });

  it('claims the first delivery and marks completion', async () => {
    expect(await beginStripeWebhookProcessing('evt_1')).toEqual({
      status: 'claimed',
    });
    await completeStripeWebhookProcessing('evt_1');
    expect(await beginStripeWebhookProcessing('evt_1')).toEqual({
      status: 'duplicate_completed',
    });
    expect(stripeWebhookEventKey('evt_1')).toBe('stripe:webhook:event:evt_1');
  });

  it('acknowledges duplicate completed deliveries', async () => {
    await beginStripeWebhookProcessing('evt_dup');
    await completeStripeWebhookProcessing('evt_dup');
    expect(await beginStripeWebhookProcessing('evt_dup')).toEqual({
      status: 'duplicate_completed',
    });
  });

  it('releases failed processing so a retry can succeed', async () => {
    expect(await beginStripeWebhookProcessing('evt_fail')).toEqual({
      status: 'claimed',
    });
    await releaseStripeWebhookProcessing('evt_fail');
    expect(await beginStripeWebhookProcessing('evt_fail')).toEqual({
      status: 'claimed',
    });
    await completeStripeWebhookProcessing('evt_fail');
    expect(await beginStripeWebhookProcessing('evt_fail')).toEqual({
      status: 'duplicate_completed',
    });
  });

  it('runs concurrent delivery once while the lease is active', async () => {
    expect(await beginStripeWebhookProcessing('evt_conc', 1_000)).toEqual({
      status: 'claimed',
    });
    expect(await beginStripeWebhookProcessing('evt_conc', 1_500)).toEqual({
      status: 'in_progress',
    });
  });

  it('reclaims an expired processing lease', async () => {
    expect(await beginStripeWebhookProcessing('evt_lease', 1_000, 1)).toEqual({
      status: 'claimed',
    });
    // Lease expired at 2000ms; reclaim at 3_000.
    expect(await beginStripeWebhookProcessing('evt_lease', 3_000, 120)).toEqual(
      { status: 'claimed' }
    );
  });

  it('keeps live Stripe secrets gated by attestation in every environment', () => {
    expect(isStripeTestModeSecret('sk_test_abc')).toBe(true);
    expect(
      isStripeBillingConfigured({
        NODE_ENV: 'development',
        STRIPE_SECRET_KEY: 'sk_live_abc',
      })
    ).toBe(false);
    expect(
      isStripeBillingConfigured({
        NODE_ENV: 'production',
        STRIPE_SECRET_KEY: 'sk_test_abc',
      })
    ).toBe(true);
    expect(
      isStripeBillingConfigured({
        NODE_ENV: 'production',
        STRIPE_SECRET_KEY: 'sk_live_abc',
      })
    ).toBe(false);
    expect(
      isStripeBillingConfigured({
        NODE_ENV: 'development',
        STRIPE_SECRET_KEY: 'sk_live_abc',
        ALLOW_STRIPE_LIVE_MODE: 'true',
      })
    ).toBe(true);
  });
});
