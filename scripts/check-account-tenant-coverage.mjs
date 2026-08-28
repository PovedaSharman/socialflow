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
const webhooksRepository = read(
  'libraries/nestjs-libraries/src/database/prisma/webhooks/webhooks.repository.ts'
);
const webhooksDto = read(
  'libraries/nestjs-libraries/src/dtos/webhooks/webhooks.dto.ts'
);
const webhooksTenantSpec = read(
  'libraries/nestjs-libraries/src/database/prisma/webhooks/webhooks.repository.tenant.integration.spec.ts'
);
const setsRepository = read(
  'libraries/nestjs-libraries/src/database/prisma/sets/sets.repository.ts'
);
const setsDto = read('libraries/nestjs-libraries/src/dtos/sets/sets.dto.ts');
const setsTenantSpec = read(
  'libraries/nestjs-libraries/src/database/prisma/sets/sets.repository.tenant.integration.spec.ts'
);
const signatureRepository = read(
  'libraries/nestjs-libraries/src/database/prisma/signatures/signature.repository.ts'
);
const signatureDto = read(
  'libraries/nestjs-libraries/src/dtos/signature/signature.dto.ts'
);
const signatureTenantSpec = read(
  'libraries/nestjs-libraries/src/database/prisma/signatures/signature.repository.tenant.integration.spec.ts'
);
const invitationTenantSpec = read(
  'libraries/nestjs-libraries/src/database/prisma/organizations/organization.repository.invitation.tenant.integration.spec.ts'
);
const prismaSchema = read(
  'libraries/nestjs-libraries/src/database/prisma/schema.prisma'
);
const subscriptionTenantSpec = read(
  'libraries/nestjs-libraries/src/database/prisma/subscriptions/subscription.repository.tenant.integration.spec.ts'
);
const billingTenantRunbook = read('docs/BILLING_TENANT_KEYS.md');
const accountTenantRunner = read('scripts/run-account-tenant-gate.mjs');
const accountTenantWorkflow = read('.github/workflows/account-tenant-gate.yml');

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
  [
    webhooksRepository.includes('this._transaction.model.$transaction') &&
      webhooksRepository.includes('organizationId: orgId') &&
      webhooksRepository.includes(
        'ownedIntegrations !== integrationIds.length'
      ) &&
      webhooksRepository.includes('deletedAt: null') &&
      webhooksDto.match(/@ArrayMaxSize\(100\)/g)?.length === 2,
    'Webhook writes must atomically validate a bounded list of active tenant-owned channels.',
  ],
  [
    webhooksTenantSpec.includes("RUN_DATABASE_INTEGRATION_TESTS === 'true'") &&
      webhooksTenantSpec.includes('integrations: [{ id: integrationB }]') &&
      webhooksTenantSpec.includes('deleteWebhook(organizationA, webhookB)') &&
      webhooksTenantSpec.includes('only de-duplicated relationships'),
    'The opt-in database suite must cover webhook/channel ownership, mutation denial and relationship de-duplication.',
  ],
  [
    setsRepository.includes('const setId = body.id || uuidv4()') &&
      (setsRepository.match(/organizationId: orgId/g)?.length || 0) >= 5 &&
      setsDto.match(/@MaxLength\(128\)/g)?.length === 2 &&
      setsDto.match(/@MaxLength\(120\)/g)?.length === 2 &&
      setsDto.match(/@MaxLength\(100_000\)/g)?.length === 2,
    'Content-set writes must use stable IDs, tenant predicates and bounded text fields.',
  ],
  [
    setsTenantSpec.includes("RUN_DATABASE_INTEGRATION_TESTS === 'true'") &&
      setsTenantSpec.includes('getSets(organizationA)') &&
      setsTenantSpec.includes('id: setB') &&
      setsTenantSpec.includes('deleteSet(organizationA, setB)') &&
      setsTenantSpec.includes('organizationId: organizationB'),
    'The opt-in database suite must cover set list/count isolation and cross-tenant update/delete denial.',
  ],
  [
    signatureRepository.includes('const signatureId = id || uuidv4()') &&
      signatureRepository.includes('create: { id: signatureId, ...values }') &&
      signatureRepository.includes(
        'where: { organizationId: orgId, id: { not: updatedId } }'
      ) &&
      signatureDto.includes('@MaxLength(10_000)'),
    'Signature writes must use stable IDs, tenant-scoped default updates and bounded content.',
  ],
  [
    signatureTenantSpec.includes("RUN_DATABASE_INTEGRATION_TESTS === 'true'") &&
      signatureTenantSpec.includes('getDefaultSignature(organizationA)') &&
      signatureTenantSpec.includes('signatureB') &&
      signatureTenantSpec.includes('deleteSignature(organizationA') &&
      signatureTenantSpec.includes(
        'changes the default only within the selected organization'
      ),
    'The opt-in database suite must cover signature reads, mutations and default isolation.',
  ],
  [
    invitationTenantSpec.includes(
      "RUN_DATABASE_INTEGRATION_TESTS === 'true'"
    ) &&
      invitationTenantSpec.includes(
        'revokeTeamInvitation(organizationA, invitationBId)'
      ) &&
      invitationTenantSpec.includes(
        'supersedes only the matching organization invitation'
      ) &&
      invitationTenantSpec.includes('email: wrongEmail') &&
      invitationTenantSpec.includes('organizationId: organizationB'),
    'The opt-in database suite must cover invitation list/revoke, supersession, email binding and membership isolation.',
  ],
  [
    /paymentId\s+String\?\s+@unique/.test(prismaSchema) &&
      /identifier\s+String\?\s+@unique/.test(prismaSchema) &&
      billingTenantRunbook.includes('Both queries must return zero rows') &&
      billingTenantRunbook.includes('Replay signed Stripe test fixtures'),
    'Stripe customer and subscription routing keys must be unique with a reviewed migration runbook.',
  ],
  [
    subscriptionTenantSpec.includes(
      "RUN_DATABASE_INTEGRATION_TESTS === 'true'"
    ) &&
      subscriptionTenantSpec.includes(
        'updateCustomerId(organizationA, customerB)'
      ) &&
      subscriptionTenantSpec.includes('routes a webhook update only') &&
      subscriptionTenantSpec.includes('getCreditsFrom(organizationA') &&
      subscriptionTenantSpec.includes(
        'deleteSubscriptionByCustomerId(customerB)'
      ),
    'The opt-in database suite must cover billing key collisions, webhook routing, credits and deletion isolation.',
  ],
  [
    (accountTenantRunner.match(/\.spec\.ts'/g) || []).length === 18 &&
      accountTenantRunner.includes('ALLOW_DISPOSABLE_DATABASE_TESTS') &&
      accountTenantRunner.includes('databaseUrl.pathname') &&
      accountTenantRunner.includes("'--runTestsByPath'") &&
      accountTenantWorkflow.includes('socialflow_tenant_test') &&
      accountTenantWorkflow.includes('actions/upload-artifact@v4'),
    'The release-host gate must use a fixed test manifest, disposable database safeguards and retained CI output.',
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
