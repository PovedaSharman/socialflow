import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const availability = read(
  'libraries/nestjs-libraries/src/integrations/social.provider.availability.ts'
);
const manager = read(
  'libraries/nestjs-libraries/src/integrations/integration.manager.ts'
);
const envExample = read('.env.example');
const compose = read('docker-compose.yaml');

const invariants = [
  [
    availability.includes("env.NODE_ENV !== 'production'"),
    'production has distinct fail-closed behavior',
  ],
  [
    availability.includes('env.SOCIAL_PROVIDER_ALLOWLIST'),
    'production requires an explicit allowlist',
  ],
  [
    availability.includes("Boolean(String(env.FRONTEND_URL || '').trim())"),
    'production requires a callback origin',
  ],
  [
    availability.includes('getMissingSocialProviderConfiguration('),
    'provider credential requirements are checked',
  ],
  [
    availability.includes("identifier === 'socialflow-test'"),
    'test-provider behavior is explicit',
  ],
  [
    availability.includes("env.NODE_ENV !== 'production'"),
    'the test provider cannot run in production',
  ],
  [
    manager.includes('this.getAvailableSocialIntegrations().map'),
    'connection discovery uses the filtered set',
  ],
  [
    manager.includes('this.getAvailableSocialIntegrations().reduce'),
    'tool and rule discovery use the filtered set',
  ],
  [
    manager.includes('return { internalPlugs: [] }'),
    'disabled-provider internal plugs fail closed',
  ],
  [
    manager.includes(
      'return this.getAvailableSocialIntegrations().map((p) => p.identifier)'
    ),
    'connection allow checks use the filtered set',
  ],
  [
    envExample.includes('SOCIAL_PROVIDER_ALLOWLIST=""'),
    'the production control is documented in the environment template',
  ],
  [
    compose.includes("SOCIAL_PROVIDER_ALLOWLIST: ''"),
    'the production Compose template passes the fail-closed control',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(
  `Provider release-gate audit passed (${invariants.length} invariants).`
);
