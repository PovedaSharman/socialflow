import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const transaction = read(
  'libraries/nestjs-libraries/src/integrations/oauth.connect.transaction.ts'
);
const authenticated = read(
  'apps/backend/src/api/routes/integrations.controller.ts'
);
const enterprise = read('apps/backend/src/api/routes/enterprise.controller.ts');
const callback = read(
  'apps/backend/src/api/routes/no.auth.integrations.controller.ts'
);
const frontend = read(
  'apps/frontend/src/components/launches/continue.integration.tsx'
);

const invariants = [
  [
    transaction.includes("'EX',\n    OAUTH_TRANSACTION_TTL_SECONDS,\n    'NX'"),
    'transactions expire and cannot overwrite an outstanding state',
  ],
  [
    transaction.includes('ioRedis.getdel(key)'),
    'transactions are atomically consumed',
  ],
  [
    transaction.includes("flow: 'user' | 'enterprise'"),
    'transaction records distinguish actor types',
  ],
  [
    authenticated.includes('initiatedByUserId: user.id'),
    'authenticated initiation binds the user',
  ],
  [
    authenticated.includes('organizationId: org.id'),
    'authenticated initiation binds the tenant',
  ],
  [
    enterprise.includes("flow: 'enterprise'"),
    'signed enterprise initiation is explicitly bound',
  ],
  [
    callback.includes('consumeOAuthConnectTransaction('),
    'the callback claims state before exchange',
  ],
  [
    callback.includes('hasActiveMembership('),
    'the callback rechecks initiating membership',
  ],
  [
    callback.includes('transaction.organizationId'),
    'callback mutations use the bound tenant',
  ],
  [
    !callback.includes('refresh: body.refresh'),
    'callback refresh behavior uses only transaction-bound input',
  ],
  [
    callback.includes('consumePublicProviderContinuation('),
    'public two-step state is separately consumed',
  ],
  [
    transaction.includes('randomBytes(32)'),
    'public continuation tokens use 256-bit randomness',
  ],
  [
    transaction.includes("url.searchParams.set('state', state)"),
    'ordinary OAuth state is replaced at the trust boundary',
  ],
  [
    transaction.includes('input.url.endsWith(`||${input.state}`)'),
    'composite custom-provider state is hardened',
  ],
  [
    authenticated.includes('hardenOAuthState(generatedAuthUrl)'),
    'user flows harden provider state',
  ],
  [
    enterprise.includes('hardenOAuthState(generatedAuthUrl)'),
    'enterprise flows harden provider state',
  ],
  [
    frontend.includes('publicContinuationToken'),
    'the client sends the scoped continuation token',
  ],
  [
    !callback.includes('`organization:${body.state}`'),
    'legacy replayable organization state is absent',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(
  `OAuth connection safety audit passed (${invariants.length} invariants).`
);
