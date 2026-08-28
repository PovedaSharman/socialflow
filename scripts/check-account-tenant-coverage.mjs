import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const middleware = read('apps/backend/src/services/auth/auth.middleware.ts');
const middlewareSpec = read(
  'apps/backend/src/services/auth/auth.middleware.spec.ts'
);
const authService = read('apps/backend/src/services/auth/auth.service.ts');
const authSpec = read('apps/backend/src/services/auth/auth.service.spec.ts');
const organizationRepository = read(
  'libraries/nestjs-libraries/src/database/prisma/organizations/organization.repository.ts'
);
const invitationSpec = read(
  'libraries/helpers/src/auth/invitation.token.spec.ts'
);
const databaseTenantSpec = read(
  'libraries/nestjs-libraries/src/database/prisma/posts/posts.repository.tenant.integration.spec.ts'
);
const integrationRepository = read(
  'libraries/nestjs-libraries/src/database/prisma/integrations/integration.repository.ts'
);
const integrationTenantSpec = read(
  'libraries/nestjs-libraries/src/database/prisma/integrations/integration.repository.tenant.integration.spec.ts'
);
const integrationsController = read(
  'apps/backend/src/api/routes/integrations.controller.ts'
);
const mediaRepository = read(
  'libraries/nestjs-libraries/src/database/prisma/media/media.repository.ts'
);
const mediaTenantSpec = read(
  'libraries/nestjs-libraries/src/database/prisma/media/media.repository.tenant.integration.spec.ts'
);
const postsService = read(
  'libraries/nestjs-libraries/src/database/prisma/posts/posts.service.ts'
);
const postActivity = read('apps/orchestrator/src/activities/post.activity.ts');

const requirements = [
  [
    middleware.includes('getUserById(payload.id)') &&
      middleware.includes('selectActiveOrganization(organization, orgHeader)'),
    'Authenticated requests must re-resolve the user and active membership.',
  ],
  [
    middleware.includes('loadImpersonate && !loadImpersonate.disabled') &&
      middleware.includes('f.userId === user.id'),
    'Support impersonation must reject disabled memberships and isolate the target.',
  ],
  [
    middlewareSpec.includes('rejects forged activation claims') &&
      middlewareSpec.includes('outside the membership set') &&
      middlewareSpec.includes('rejects disabled and malformed memberships'),
    'The middleware matrix must cover forged, cross-tenant and disabled cases.',
  ],
  [
    middlewareSpec.includes('limits enabled impersonation') &&
      middlewareSpec.includes('strips the password'),
    'The middleware matrix must cover successful isolation and secret stripping.',
  ],
  [
    authService.includes('updatePasswordIfCurrent(') &&
      authSpec.includes('atomic predicate and accepts the token once') &&
      authSpec.includes('rejects a stale password fingerprint'),
    'Password-reset coverage must prove stale and single-use behaviour.',
  ],
  [
    organizationRepository.includes('acceptTeamInvitation(') &&
      organizationRepository.includes('claimed.count !== 1') &&
      organizationRepository.includes('email: user.email.toLowerCase()'),
    'Invitation acceptance must remain email-bound and atomically claimed.',
  ],
  [
    invitationSpec.includes('high-entropy URL-safe values') &&
      invitationSpec.includes('hash rather than the raw token'),
    'Invitation tests must retain entropy and at-rest hashing coverage.',
  ],
  [
    databaseTenantSpec.includes("RUN_DATABASE_INTEGRATION_TESTS === 'true'") &&
      databaseTenantSpec.includes('getPostsByGroup(organizationA, groupB)') &&
      databaseTenantSpec.includes('deletePost(organizationA, groupB)') &&
      databaseTenantSpec.includes('requestPostApproval('),
    'The opt-in database suite must cover cross-tenant read, delete and approval denial.',
  ],
  [
    /updateMany\(\{\s*where:\s*\{\s*organizationId: org,\s*id:\s*\{\s*not: upsert\.id/.test(
      integrationRepository
    ) &&
      /updateNameAndUrl\(org: string, id: string, name: string, url: string\)[\s\S]*?where:\s*\{\s*id,\s*organizationId: org/.test(
        integrationRepository
      ) &&
      integrationsController.includes(
        'updateNameAndUrl(org.id, id, name, url)'
      ),
    'Credential rotation and channel profile updates must remain scoped to the active organization.',
  ],
  [
    integrationTenantSpec.includes(
      "RUN_DATABASE_INTEGRATION_TESTS === 'true'"
    ) &&
      integrationTenantSpec.includes(
        'getIntegrationById(organizationA, integrationB)'
      ) &&
      integrationTenantSpec.includes(
        'rotates one-time credentials only inside the active organization'
      ) &&
      integrationTenantSpec.includes("token: 'tenant-b-original-token'"),
    'The opt-in database suite must cover channel reads, mutations and credential-rotation isolation.',
  ],
  [
    /getMediaById\(org: string, id: string\)[\s\S]*?findFirst\(\{[\s\S]*?organizationId: org,[\s\S]*?deletedAt: null/.test(
      mediaRepository
    ) &&
      postsService.includes('getMediaById(orgId, p.id)') &&
      postActivity.includes(
        'updateMedia(\n            integration.organizationId,'
      ),
    'Post media resolution must require the active organization in API and publishing paths.',
  ],
  [
    mediaTenantSpec.includes("RUN_DATABASE_INTEGRATION_TESTS === 'true'") &&
      mediaTenantSpec.includes('getMediaById(organizationA, mediaB)') &&
      mediaTenantSpec.includes('saveMediaInformation(organizationA') &&
      mediaTenantSpec.includes('deleteMedia(organizationA, mediaB)') &&
      mediaTenantSpec.includes('does not resolve soft-deleted media'),
    'The opt-in database suite must cover cross-tenant media reads, edits, deletion and active-state checks.',
  ],
];

const failures = requirements
  .filter(([passed]) => !passed)
  .map(([, message]) => message);

if (failures.length > 0) {
  process.stderr.write(
    `Account/tenant coverage audit failed:\n${failures.join('\n')}\n`
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Account/tenant coverage audit passed (${requirements.length} invariants).\n`
  );
}
