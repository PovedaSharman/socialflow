import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const schema = read(
  'libraries/nestjs-libraries/src/database/prisma/schema.prisma'
);
const sanitize = read(
  'libraries/nestjs-libraries/src/database/prisma/privacy/audit.event.ts'
);
const controller = read('apps/backend/src/api/routes/privacy.controller.ts');
const service = read(
  'libraries/nestjs-libraries/src/database/prisma/privacy/privacy.service.ts'
);
const apiCredentialService = read(
  'libraries/nestjs-libraries/src/database/prisma/api-credentials/api.credential.service.ts'
);
const apiCredentialController = read(
  'apps/backend/src/api/routes/api-credentials.controller.ts'
);
const mcpAudit = read('libraries/nestjs-libraries/src/chat/mcp.audit.ts');
const integrationList = read(
  'libraries/nestjs-libraries/src/chat/tools/integration.list.tool.ts'
);
const generateImage = read(
  'libraries/nestjs-libraries/src/chat/tools/generate.image.tool.ts'
);
const generateVideo = read(
  'libraries/nestjs-libraries/src/chat/tools/generate.video.tool.ts'
);
const schedulePost = read(
  'libraries/nestjs-libraries/src/chat/tools/integration.schedule.post.ts'
);
const privacyRepo = read(
  'libraries/nestjs-libraries/src/database/prisma/privacy/privacy.repository.ts'
);
const monitor = read('apps/backend/src/api/routes/monitor.controller.ts');
const throttler = read(
  'libraries/nestjs-libraries/src/throttler/throttler.provider.ts'
);
const privacyUi = read(
  'apps/frontend/src/components/settings/privacy.admin.component.tsx'
);
const settings = read(
  'apps/frontend/src/components/layout/settings.component.tsx'
);
const privacyDoc = read('docs/PRIVACY.md');
const opsDoc = read('docs/OPS_BACKUP_MONITORING.md');
const releaseHost = read('docs/RELEASE_HOST_EVIDENCE.md');
const readiness = read('docs/READINESS.md');

const invariants = [
  [
    schema.includes('model AuditEvent') &&
      schema.includes('model ConsentPreference') &&
      schema.includes('ipHash') &&
      sanitize.includes('sanitizeAuditMetadata') &&
      sanitize.includes('hashAuditIp') &&
      sanitize.includes('createHmac') &&
      sanitize.includes('AUDIT_IP_HMAC_KEY') &&
      sanitize.includes('AUDIT_WRITE_RELIABILITY_POLICY') &&
      sanitize.includes("'password'") &&
      sanitize.includes("'content'") &&
      sanitize.includes("'prompt'"),
    'audit storage must HMAC-hash IPs and drop secret/content metadata',
  ],
  [
    controller.includes("@Controller('/user/privacy')") &&
      controller.includes('/export') &&
      controller.includes('/deletion-request') &&
      controller.includes('/consent') &&
      controller.includes('/audit') &&
      service.includes('Re-authentication failed') &&
      service.includes('comparePassword'),
    'privacy APIs must export, record consent and re-authenticate deletion',
  ],
  [
    privacyUi.includes('htmlFor="privacy-password"') &&
      privacyUi.includes('/user/privacy/export') &&
      privacyUi.includes('/user/privacy/deletion-request') &&
      settings.includes('PrivacyAdminComponent') &&
      settings.includes("tab: 'privacy'"),
    'admins must have a privacy and audit settings surface',
  ],
  [
    monitor.includes('/live') &&
      monitor.includes('/ready') &&
      monitor.includes('$queryRaw') &&
      monitor.includes('ioRedis.ping'),
    'backend must expose liveness and dependency readiness checks',
  ],
  [
    throttler.includes('/auth/login') &&
      throttler.includes('/auth/register') &&
      throttler.includes('ip_') &&
      throttler.includes('req.org.id'),
    'rate limits must cover anonymous auth by IP and authenticated org traffic',
  ],
  [
    apiCredentialService.includes('api_credential.create') &&
      apiCredentialService.includes('api_credential.revoke') &&
      apiCredentialService.includes('api_credential.use') &&
      apiCredentialService.includes('createAuditEvent') &&
      apiCredentialController.includes('user.id'),
    'credential create, use and revoke must write sanitised audit events',
  ],
  [
    mcpAudit.includes('enforceMcpScopeAudit') &&
      integrationList.includes('mcp.channels.read') &&
      generateImage.includes('mcp.media.generate') &&
      generateVideo.includes('mcp.media.generate') &&
      schedulePost.includes('mcp.posts.write') &&
      privacyRepo.includes('audit_event_write_failed'),
    'MCP reads, writes and generation must audit allow/deny/fail best-effort',
  ],
  [
    privacyDoc.includes('Implemented in source') &&
      opsDoc.includes('/monitor/ready') &&
      opsDoc.includes('Backup and restore drill') &&
      releaseHost.includes('Milestones 6–9') &&
      readiness.includes('not production-ready'),
    'privacy, ops and readiness docs must separate source from release evidence',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(`Privacy/ops audit passed (${invariants.length} invariants).`);
