import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const testFiles = [
  'apps/backend/src/services/auth/auth.middleware.spec.ts',
  'apps/backend/src/services/auth/auth.service.spec.ts',
  'apps/backend/src/services/auth/organization.selection.spec.ts',
  'apps/backend/src/services/auth/public.auth.error.spec.ts',
  'apps/backend/src/services/auth/permissions/organization.role.spec.ts',
  'apps/backend/src/services/auth/permissions/permissions.route-coverage.spec.ts',
  'apps/backend/src/services/auth/permissions/permissions.service.spec.ts',
  'libraries/helpers/src/auth/auth.service.spec.ts',
  'libraries/helpers/src/auth/invitation.token.spec.ts',
  'libraries/nestjs-libraries/src/integrations/oauth.connect.transaction.spec.ts',
  'libraries/nestjs-libraries/src/integrations/social.provider.availability.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/posts/post.error-history.spec.ts',
  'libraries/nestjs-libraries/src/dtos/media/media.accessibility.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/integrations/integration.repository.tenant.integration.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/media/media.repository.tenant.integration.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/organizations/organization.repository.invitation.tenant.integration.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/posts/posts.repository.tenant.integration.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/sets/sets.repository.tenant.integration.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/signatures/signature.repository.tenant.integration.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/subscriptions/subscription.cycle.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/subscriptions/subscription.repository.tenant.integration.spec.ts',
  'libraries/nestjs-libraries/src/database/prisma/webhooks/webhooks.repository.tenant.integration.spec.ts',
];

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

if (
  process.env.NODE_ENV !== 'test' ||
  process.env.RUN_DATABASE_INTEGRATION_TESTS !== 'true' ||
  process.env.ALLOW_DISPOSABLE_DATABASE_TESTS !== 'true'
) {
  fail(
    'The account/tenant gate requires NODE_ENV=test, RUN_DATABASE_INTEGRATION_TESTS=true and ALLOW_DISPOSABLE_DATABASE_TESTS=true.'
  );
}

let databaseUrl;
try {
  databaseUrl = new URL(process.env.DATABASE_URL || '');
} catch {
  fail('The account/tenant gate requires a valid disposable DATABASE_URL.');
}
if (!databaseUrl.pathname.toLowerCase().includes('test')) {
  fail('The disposable database name must contain "test".');
}

const missingFiles = testFiles.filter((file) => !existsSync(file));
if (missingFiles.length > 0) {
  fail(`Account/tenant test files are missing: ${missingFiles.join(', ')}`);
}

const require = createRequire(import.meta.url);
const jestBin = require.resolve('jest/bin/jest');
const result = spawnSync(
  process.execPath,
  [
    jestBin,
    '--runInBand',
    '--runTestsByPath',
    ...testFiles,
    '--reporters=default',
  ],
  {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=1024',
    },
  }
);

if (result.error) {
  fail(`Unable to start the account/tenant gate: ${result.error.message}`);
}
process.exit(result.status ?? 1);
