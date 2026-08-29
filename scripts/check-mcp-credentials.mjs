import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const scopes = read('libraries/nestjs-libraries/src/chat/mcp.scopes.ts');
const urlSecret = read('libraries/nestjs-libraries/src/chat/mcp.url-secret.ts');
const startMcp = read('libraries/nestjs-libraries/src/chat/start.mcp.ts');
const publicApi = read(
  'apps/frontend/src/components/public-api/public.component.tsx'
);
const scopedUi = read(
  'apps/frontend/src/components/public-api/scoped.api.credentials.tsx'
);
const envExample = read('.env.example');
const compose = read('docker-compose.yaml');
const schema = read(
  'libraries/nestjs-libraries/src/database/prisma/schema.prisma'
);
const secretHelper = read(
  'libraries/nestjs-libraries/src/database/prisma/api-credentials/api.credential.secret.ts'
);
const service = read(
  'libraries/nestjs-libraries/src/database/prisma/api-credentials/api.credential.service.ts'
);
const controller = read(
  'apps/backend/src/api/routes/api-credentials.controller.ts'
);
const scheduleTool = read(
  'libraries/nestjs-libraries/src/chat/tools/integration.schedule.post.ts'
);
const imageTool = read(
  'libraries/nestjs-libraries/src/chat/tools/generate.image.tool.ts'
);
const authContext = read('libraries/nestjs-libraries/src/chat/auth.context.ts');
const auditTool = read(
  'libraries/nestjs-libraries/src/chat/tools/audit.list.tool.ts'
);
const toolList = read('libraries/nestjs-libraries/src/chat/tools/tool.list.ts');
const startMcpBudget = read('libraries/nestjs-libraries/src/chat/start.mcp.ts');
const pricing = read(
  'libraries/nestjs-libraries/src/database/prisma/subscriptions/pricing.ts'
);

const invariants = [
  [
    scopes.includes("'posts:publish'") &&
      scopes.includes("'media:generate'") &&
      scopes.includes('DEFAULT_MCP_SCOPES') &&
      scopes.includes('OPT_IN_MCP_SCOPES') &&
      scopes.includes('mcpAllowsImmediatePublish'),
    'product scopes must default-deny publish and media generation',
  ],
  [
    urlSecret.includes("env.NODE_ENV !== 'production'") &&
      urlSecret.includes("env.ALLOW_MCP_URL_SECRETS === 'true'"),
    'production must deny URL secrets unless explicitly enabled',
  ],
  [
    startMcp.includes('areMcpUrlSecretsAllowed(process.env)') &&
      startMcp.includes("error: 'url_secret_disabled'") &&
      startMcp.includes('MCP_SCOPES') &&
      startMcp.includes('apiCredentialService.resolveOrganizationBySecret'),
    'MCP mounts must gate URL secrets and resolve hashed credentials',
  ],
  [
    !publicApi.includes('/mcp/${') &&
      !publicApi.includes("method: 'header' | 'path'") &&
      publicApi.includes('Bearer ${apiKey}') &&
      publicApi.includes('headers: { Authorization: bearer }') &&
      publicApi.includes('mcp_url_secrets_retired'),
    'client instructions must be Bearer-only without URL-embedded secrets',
  ],
  [
    envExample.includes('ALLOW_MCP_URL_SECRETS') &&
      compose.includes('ALLOW_MCP_URL_SECRETS:'),
    'the compatibility control must be documented and fail closed by default',
  ],
  [
    schema.includes('model ApiCredential') &&
      schema.includes('secretHash') &&
      schema.includes('scopes') &&
      secretHelper.includes('createHash') &&
      secretHelper.includes('API_CREDENTIAL_PREFIX') &&
      service.includes('secret: created.secret') &&
      service.includes('secretHash: created.secretHash') &&
      !service.includes('secretHash: created.secret,') &&
      controller.includes("'/user/api-credentials'"),
    '    hashed credentials must be created, listed and revoked without storing plaintext',
  ],
  [
    publicApi.includes('ScopedApiCredentialsSection') &&
      scopedUi.includes('const useApiCredentials = () =>') &&
      scopedUi.includes('return useSWR') &&
      scopedUi.includes('one_time_secret') &&
      scopedUi.includes('I have copied it') &&
      scopedUi.includes("method: 'DELETE'"),
    'the public API page must offer one-time secret create/list/revoke UI',
  ],
  [
    authContext.includes('missingMcpScope') &&
      authContext.includes("ui === 'true'") &&
      scheduleTool.includes('missingMcpScope(requiredScope') &&
      scheduleTool.includes("'posts:publish'") &&
      scheduleTool.includes('recordMcpAudit') &&
      imageTool.includes("missingMcpScope('media:generate'"),
    'MCP tools must enforce scopes with UI sessions exempt',
  ],
  [
    auditTool.includes("missingMcpScope('audit:read'") &&
      toolList.includes('AuditListTool') &&
      startMcpBudget.includes('gateMcpBudget') &&
      pricing.includes('mcp_calls_per_month') &&
      pricing.includes('storage_bytes'),
    'MCP must expose audit:read listing and enforce monthly call budgets from plan config',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(`MCP credentials audit passed (${invariants.length} invariants).`);
