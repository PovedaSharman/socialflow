import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const idempotency = read(
  'libraries/nestjs-libraries/src/integrations/social/publication.idempotency.ts'
);
const idempotencySpec = read(
  'libraries/nestjs-libraries/src/integrations/social/publication.idempotency.spec.ts'
);
const providerInterface = read(
  'libraries/nestjs-libraries/src/integrations/social/social.integrations.interface.ts'
);
const testProvider = read(
  'libraries/nestjs-libraries/src/integrations/social/socialflow.test.provider.ts'
);
const testProviderSpec = read(
  'libraries/nestjs-libraries/src/integrations/social/socialflow.test.provider.spec.ts'
);
const postActivity = read('apps/orchestrator/src/activities/post.activity.ts');
const postWorkflow = read(
  'apps/orchestrator/src/workflows/post-workflows/post.workflow.v1.0.6.ts'
);
const postsRepository = read(
  'libraries/nestjs-libraries/src/database/prisma/posts/posts.repository.ts'
);
const workflowIntegrationSpec = read(
  'apps/orchestrator/src/workflows/post-workflows/post.workflow.v1.0.6.integration.spec.ts'
);
const workflowGateRunner = read('scripts/run-publish-workflow-gate.mjs');
const gitignore = read('.gitignore');
const composer = read(
  'apps/frontend/src/components/new-launch/manage.modal.tsx'
);
const scheduleFlow = composer.slice(composer.indexOf('const schedule ='));
const errorHistory = read(
  'libraries/nestjs-libraries/src/database/prisma/posts/post.error-history.ts'
);

const requirements = [
  [
    idempotency.includes("createHash('sha256')") &&
      idempotency.includes("'socialflow-publication-v1'") &&
      idempotency.includes("post.releaseId || 'initial'") &&
      !idempotency.includes('post.content') &&
      !idempotency.includes('accessToken'),
    'Publication keys must be deterministic, revision-aware and free of content or credentials.',
  ],
  [
    idempotencySpec.includes('is deterministic') &&
      idempotencySpec.includes('another tenant, channel, schedule') &&
      idempotencySpec.includes('fails closed'),
    'Publication-key specifications must cover stability, isolation and invalid dates.',
  ],
  [
    providerInterface.includes('idempotencyKey: string') &&
      providerInterface.includes("publicationRetry?: 'idempotency-key'") &&
      (postActivity.match(/idempotencyKey: publicationIdempotencyKey\(p\)/g)
        ?.length || 0) === 2,
    'Main posts and comments must receive the provider idempotency key.',
  ],
  [
    testProvider.includes('local-${post.idempotencyKey}') &&
      testProvider.includes("publicationRetry = 'idempotency-key'") &&
      testProviderSpec.includes('expect(retry).toEqual(first)'),
    'The local test provider must return one deterministic publication on retry.',
  ],
  [
    postWorkflow.includes('const proxyMutationTaskQueue') &&
      postWorkflow.includes('maximumAttempts: 1'),
    'Irreversible provider mutations must not have Temporal activity retries.',
  ],
  [
    /if \(handle\.type === 'unknown'\) \{[\s\S]*?await markUnconfirmed\(err\);[\s\S]*?return false;/.test(
      postWorkflow
    ),
    'Unknown provider mutation outcomes must stop without re-publishing.',
  ],
  [
    postActivity.includes('isPublicationRetrySafe(providerIdentifier') &&
      postWorkflow.includes('requireSafePublicationRetry') &&
      postWorkflow.includes('handleActivityError(err, undefined, true)') &&
      postWorkflow.includes(
        'await isPublicationRetrySafe(post.integration.providerIdentifier)'
      ),
    'Credential-refresh publication retries must require an explicit idempotent provider capability.',
  ],
  [
    /searchForMissingThreeHoursPosts\(\)[\s\S]*?orderBy: \{ publishDate: 'asc' \},[\s\S]*?take: 100/.test(
      postsRepository
    ),
    'The missing-post recovery sweep must remain ordered and batch-bounded.',
  ],
  [
    workflowIntegrationSpec.includes("runScenario('refresh')") &&
      workflowIntegrationSpec.includes("runScenario('unknown')") &&
      workflowIntegrationSpec.includes(
        "runScenario('timeout', '500 milliseconds')"
      ) &&
      workflowIntegrationSpec.includes('expect(acceptedMutations).toBe(1)') &&
      workflowIntegrationSpec.includes('fetchHistory()'),
    'The release-host workflow suite must cover refresh, unknown and timeout outcomes with retained histories.',
  ],
  [
    workflowGateRunner.includes('ALLOW_TEMPORAL_TEST_HISTORY') &&
      workflowGateRunner.includes('TEMPORAL_NAMESPACE') &&
      workflowGateRunner.includes('timeout: 90_000') &&
      workflowGateRunner.includes('shell: false') &&
      workflowGateRunner.includes("'--runInBand'") &&
      gitignore.includes('/artifacts/temporal-post-safety/'),
    'The release-host workflow runner must fail closed and remain single-process and time-bounded.',
  ],
  [
    scheduleFlow.indexOf("type === 'now' &&") > -1 &&
      scheduleFlow.indexOf("type === 'now' &&") <
        scheduleFlow.indexOf('setLoading(true);') &&
      scheduleFlow.includes("t('confirm_publish_now', 'Yes, publish now')"),
    'Immediate publication must require explicit confirmation before submission begins.',
  ],
  [
    /className="post-now[^\"]*focus-visible:ring/.test(composer) &&
      composer.includes("onClick={schedule('now')}") &&
      !/className="[^"]*hidden group-hover:flex[^"]*"/.test(composer),
    'Immediate publication must be a visible keyboard and touch control.',
  ],
  [
    errorHistory.includes('MAX_ERROR_MESSAGE_LENGTH = 1_000') &&
      errorHistory.includes('MAX_ATTEMPTS = 50') &&
      errorHistory.includes("'Bearer [REDACTED]'") &&
      errorHistory.includes("'$1[REDACTED]'"),
    'Retry-history errors must be bounded and redact common credential forms.',
  ],
  [
    errorHistory.includes('postId: bounded(attempt.id, 128)') &&
      errorHistory.includes('providerIdentifier') &&
      !errorHistory.includes('attempt.content') &&
      !errorHistory.includes('integration.token'),
    'Retry context must retain identifiers without post content or credentials.',
  ],
  [
    postsRepository.includes('safePostErrorMessage(err)') &&
      postsRepository.includes('body: safePostErrorContext(body)') &&
      /getErrorsByPostIds\(postIds: string\[\]\)[\s\S]*?take: 100/.test(
        postsRepository
      ),
    'Post state and history persistence must use safe bounded projections.',
  ],
];

const failures = requirements
  .filter(([passed]) => !passed)
  .map(([, message]) => message);

if (failures.length > 0) {
  process.stderr.write(
    `Publish-safety audit failed:\n${failures.join('\n')}\n`
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Publish-safety audit passed (${requirements.length} invariants).\n`
  );
}
