import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const safety = read(
  'libraries/nestjs-libraries/src/services/stripe.webhook.safety.ts'
);
const controller = read('apps/backend/src/api/routes/stripe.controller.ts');
const usage = read(
  'libraries/nestjs-libraries/src/database/prisma/subscriptions/usage.limit.ts'
);
const permissions = read(
  'apps/backend/src/services/auth/permissions/permissions.service.ts'
);
const exception = read(
  'apps/backend/src/services/auth/permissions/permission.exception.class.ts'
);
const envExample = read('.env.example');

const invariants = [
  [
    safety.includes("KEY_PREFIX = 'stripe:webhook:event:'") &&
      safety.includes("'NX'") &&
      safety.includes('claimStripeWebhookEvent'),
    'webhook events must be claimed once with Redis NX',
  ],
  [
    safety.includes("startsWith('sk_test_')") &&
      safety.includes('ALLOW_STRIPE_LIVE_MODE') &&
      safety.includes('isStripeBillingConfigured'),
    'production must stay on Stripe test mode until live mode is attested',
  ],
  [
    controller.includes('claimStripeWebhookEvent(event.id)') &&
      controller.includes('isStripeBillingConfigured(process.env)') &&
      controller.includes('duplicate: true'),
    'the webhook controller must gate mode and ignore duplicate events',
  ],
  [
    envExample.includes('ALLOW_STRIPE_LIVE_MODE') &&
      envExample.includes('STRIPE_SECRET_KEY'),
    'billing controls must be documented in the environment template',
  ],
  [
    usage.includes('resolveChannelLimit') &&
      usage.includes('isWithinHardLimit') &&
      usage.includes('nextStep') &&
      !permissions.includes('channel: tier === ') &&
      permissions.includes('resolveChannelLimit(') &&
      permissions.includes('isWithinHardLimit(') &&
      exception.includes('usageLimitDenial(') &&
      exception.includes('nextStep: denial.nextStep'),
    'hard limits must use plan configuration and explain the next step',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(`Billing safety audit passed (${invariants.length} invariants).`);
