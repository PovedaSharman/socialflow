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
    async eval(script: string, _keys: number, key: string, ...args: any[]) {
      if (data.get(key) !== args[0]) {
        return 0;
      }
      if (script.includes("'completed'")) {
        data.set(key, 'completed');
        return 1;
      }
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
    const claim = await beginStripeWebhookProcessing(
      'evt_1',
      1_000,
      120,
      'owner-1'
    );
    expect(claim).toEqual({
      status: 'claimed',
      token: 'owner-1',
    });
    if (claim.status !== 'claimed') throw new Error('expected claim');
    await completeStripeWebhookProcessing('evt_1', claim.token);
    expect(await beginStripeWebhookProcessing('evt_1')).toEqual({
      status: 'duplicate_completed',
    });
    expect(stripeWebhookEventKey('evt_1')).toBe('stripe:webhook:event:evt_1');
  });

  it('acknowledges duplicate completed deliveries', async () => {
    const claim = await beginStripeWebhookProcessing(
      'evt_dup',
      1_000,
      120,
      'owner-dup'
    );
    if (claim.status !== 'claimed') throw new Error('expected claim');
    await completeStripeWebhookProcessing('evt_dup', claim.token);
    expect(await beginStripeWebhookProcessing('evt_dup')).toEqual({
      status: 'duplicate_completed',
    });
  });

  it('releases failed processing so a retry can succeed', async () => {
    const first = await beginStripeWebhookProcessing(
      'evt_fail',
      1_000,
      120,
      'owner-failed'
    );
    expect(first).toEqual({ status: 'claimed', token: 'owner-failed' });
    if (first.status !== 'claimed') throw new Error('expected claim');
    await releaseStripeWebhookProcessing('evt_fail', first.token);
    const retry = await beginStripeWebhookProcessing(
      'evt_fail',
      2_000,
      120,
      'owner-retry'
    );
    expect(retry).toEqual({ status: 'claimed', token: 'owner-retry' });
    if (retry.status !== 'claimed') throw new Error('expected retry claim');
    await completeStripeWebhookProcessing('evt_fail', retry.token);
    expect(await beginStripeWebhookProcessing('evt_fail')).toEqual({
      status: 'duplicate_completed',
    });
  });

  it('runs concurrent delivery once while the lease is active', async () => {
    expect(
      await beginStripeWebhookProcessing('evt_conc', 1_000, 120, 'owner-a')
    ).toEqual({ status: 'claimed', token: 'owner-a' });
    expect(
      await beginStripeWebhookProcessing('evt_conc', 1_500, 120, 'owner-b')
    ).toEqual({ status: 'in_progress' });
  });

  it('lets Redis expiry make a lease claimable again', async () => {
    expect(
      await beginStripeWebhookProcessing('evt_lease', 1_000, 1, 'owner-old')
    ).toEqual({ status: 'claimed', token: 'owner-old' });
    data.delete(stripeWebhookEventKey('evt_lease'));
    expect(
      await beginStripeWebhookProcessing('evt_lease', 3_000, 120, 'owner-new')
    ).toEqual({ status: 'claimed', token: 'owner-new' });
  });

  it('does not let an expired owner complete or release a newer claim', async () => {
    const key = stripeWebhookEventKey('evt_owner');
    data.set(key, 'processing:owner-new');
    await expect(
      completeStripeWebhookProcessing('evt_owner', 'owner-old')
    ).resolves.toBe(0);
    expect(data.get(key)).toBe('processing:owner-new');
    await expect(
      releaseStripeWebhookProcessing('evt_owner', 'owner-old')
    ).resolves.toBe(0);
    expect(data.get(key)).toBe('processing:owner-new');
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
