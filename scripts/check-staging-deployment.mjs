import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const compose = read('deploy/staging/docker-compose.staging.yml');
const dockerfile = read('Dockerfile.staging');
const workflow = read('.github/workflows/staging-release.yml');
const bootstrap = read('scripts/bootstrap-disposable-database.sh');

const invariants = [
  [
    compose.includes('mem_limit: 1536m') &&
      compose.includes('mem_limit: 1g') &&
      compose.includes('mem_limit: 768m') &&
      compose.includes('${UPLOAD_HOST_PATH}:/uploads') &&
      compose.includes('max-size: 10m'),
    'staging services and logs must remain memory and disk bounded',
  ],
  [
    !compose.includes('elasticsearch') &&
      compose.includes("ENABLE_ES: 'false'") &&
      compose.includes('internal: true'),
    'staging must use private PostgreSQL-backed Temporal without Elasticsearch',
  ],
  [
    compose.includes("ALLOW_STRIPE_LIVE_MODE: ''") &&
      compose.includes("SOCIAL_PROVIDER_ALLOWLIST: ''") &&
      compose.includes("ALLOW_MCP_URL_SECRETS: ''"),
    'staging must fail closed for live billing, providers and URL secrets',
  ],
  [
    dockerfile.includes('node:22.12.0-bookworm-slim') &&
      dockerfile.includes('pnpm install --frozen-lockfile') &&
      dockerfile.includes('USER node'),
    'the staging image must use pinned tooling, a locked install and non-root runtime',
  ],
  [
    workflow.includes('ubuntu-24.04-arm') &&
      workflow.includes('prisma-bootstrap-disposable') &&
      workflow.includes('test:account-tenant:release') &&
      workflow.includes('test:publish-workflow:release') &&
      workflow.includes('staging-${{ github.sha }}'),
    'CI must prove clean runtime gates before publishing immutable ARM64 images',
  ],
  [
    bootstrap.includes('ALLOW_DISPOSABLE_DATABASE_BOOTSTRAP') &&
      bootstrap.includes("database.includes('test')") &&
      bootstrap.includes("database.includes('staging')") &&
      !bootstrap.includes('--accept-data-loss'),
    'clean database bootstrap must be guarded and non-destructive',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(
  `Staging deployment audit passed (${invariants.length} invariants).`
);
