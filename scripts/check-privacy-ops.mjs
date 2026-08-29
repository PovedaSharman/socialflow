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
      sanitize.includes("'password'") &&
      sanitize.includes("'content'"),
    'audit storage must hash IPs and drop secret/content metadata',
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
      apiCredentialService.includes('createAuditEvent') &&
      apiCredentialController.includes('user.id'),
    'credential create and revoke must write sanitised audit events',
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
