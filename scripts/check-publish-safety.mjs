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
      (postActivity.match(/idempotencyKey: publicationIdempotencyKey\(p\)/g)
        ?.length || 0) === 2,
    'Main posts and comments must receive the provider idempotency key.',
  ],
  [
    testProvider.includes('local-${post.idempotencyKey}') &&
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
    /searchForMissingThreeHoursPosts\(\)[\s\S]*?orderBy: \{ publishDate: 'asc' \},[\s\S]*?take: 100/.test(
      postsRepository
    ),
    'The missing-post recovery sweep must remain ordered and batch-bounded.',
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
