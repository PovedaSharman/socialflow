import {
  claimStripeWebhookEvent,
  isStripeBillingConfigured,
  isStripeTestModeSecret,
  stripeWebhookEventKey,
} from './stripe.webhook.safety';

jest.mock('@gitroom/nestjs-libraries/redis/redis.service', () => {
  const data = new Map<string, string>();
  return {
    ioRedis: {
      async set(key: string, value: string, ...args: Array<string | number>) {
        if (args.includes('NX') && data.has(key)) {
          return null;
        }
        data.set(key, value);
        return 'OK';
      },
    },
  };
});

describe('Stripe webhook safety', () => {
  it('claims each event id once', async () => {
    expect(await claimStripeWebhookEvent('evt_1')).toBe(true);
    expect(await claimStripeWebhookEvent('evt_1')).toBe(false);
    expect(stripeWebhookEventKey('evt_1')).toBe('stripe:webhook:event:evt_1');
  });

  it('keeps production on test mode until live mode is attested', () => {
    expect(isStripeTestModeSecret('sk_test_abc')).toBe(true);
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
        NODE_ENV: 'production',
        STRIPE_SECRET_KEY: 'sk_live_abc',
        ALLOW_STRIPE_LIVE_MODE: 'true',
      })
    ).toBe(true);
  });
});
