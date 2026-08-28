import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const encryption = read(
  'libraries/nestjs-libraries/src/security/social-credential-encryption.service.ts'
);
const integrations = read(
  'libraries/nestjs-libraries/src/database/prisma/integrations/integration.repository.ts'
);
const posts = read(
  'libraries/nestjs-libraries/src/database/prisma/posts/posts.repository.ts'
);
const migration = read('scripts/migrate-social-credentials.ts');
const postActivity = read('apps/orchestrator/src/activities/post.activity.ts');
const postWorkflow = read(
  'apps/orchestrator/src/workflows/post-workflows/post.workflow.v1.0.6.ts'
);
const refreshWorkflow = read(
  'apps/orchestrator/src/workflows/refresh.token.workflow.ts'
);

const requirements = [
  [
    encryption.includes("createCipheriv('aes-256-gcm'") &&
      encryption.includes('randomBytes(12)') &&
      encryption.includes('cipher.setAAD('),
    'Social credentials must use random-IV authenticated AES-256-GCM.',
  ],
  [
    encryption.includes('keys are required in production') &&
      encryption.includes('Unencrypted social credentials are not accepted'),
    'Production must fail closed without keys or for plaintext credentials.',
  ],
  [
    integrations.includes(
      'const encryptedToken = this._credentialEncryption.encrypt(token)'
    ) &&
      integrations.includes('this._credentialEncryption.encrypt(refreshToken)'),
    'Integration writes must encrypt access and refresh credentials.',
  ],
  [
    integrations.includes('this._credentialEncryption.decryptFields(') &&
      posts.includes('this._credentialEncryption.decryptFields('),
    'Only internal integration and publishing reads may decrypt credentials.',
  ],
  [
    integrations.includes('getIntegrationsList(org: string)') &&
      integrations.includes('additionalSettings: true') &&
      !integrations
        .slice(integrations.indexOf('getIntegrationsList(org: string)'))
        .slice(0, 900)
        .includes('token: true'),
    'Integration lists must retain an explicit non-secret projection.',
  ],
  [
    (posts.match(/providerIdentifier: true/g) || []).length >= 2 &&
      !posts
        .slice(posts.indexOf('getPostsByGroup('), posts.indexOf('updatePost('))
        .includes('token: true'),
    'Calendar and composer post reads must not select stored credentials.',
  ],
  [
    migration.includes('const BATCH_SIZE = 100') &&
      migration.includes('processed < initialTotal') &&
      migration.includes("orderBy: { id: 'asc' }"),
    'Credential migration must remain cursor-based and memory-bounded.',
  ],
  [
    postActivity.includes('stripIntegrationCredentials') &&
      postActivity.includes('delete integration.token') &&
      postActivity.includes('refreshCredentialWithCause') &&
      postWorkflow.includes('social-credential-history-boundary-v1') &&
      postWorkflow.includes('getPostForWorkflow'),
    'New publishing histories must use secret-free activity payloads.',
  ],
  [
    postActivity.includes('sealPendingResponse') &&
      postActivity.includes('socialFlowEncrypted') &&
      postActivity.includes('openPendingData'),
    'Capability-bearing pending provider payloads must be sealed in workflow history.',
  ],
  [
    refreshWorkflow.includes('social-credential-refresh-history-boundary-v1') &&
      refreshWorkflow.includes('getIntegrationMetadataById') &&
      refreshWorkflow.includes('refreshTokenById') &&
      refreshWorkflow.includes('continueAsNew'),
    'New refresh histories must use metadata-only activities and remain bounded.',
  ],
];

const failures = requirements
  .filter(([passed]) => !passed)
  .map(([, message]) => message);

if (failures.length > 0) {
  process.stderr.write(
    `Social credential safety audit failed:\n${failures.join('\n')}\n`
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Social credential safety audit passed (${requirements.length} invariants).\n`
  );
}
