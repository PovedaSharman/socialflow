import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const packageJson = JSON.parse(read('package.json'));
const integrationController = read(
  'apps/backend/src/api/routes/integrations.controller.ts'
);
const integrationService = read(
  'libraries/nestjs-libraries/src/database/prisma/integrations/integration.service.ts'
);
const postsService = read(
  'libraries/nestjs-libraries/src/database/prisma/posts/posts.service.ts'
);
const postsRepository = read(
  'libraries/nestjs-libraries/src/database/prisma/posts/posts.repository.ts'
);
const credentialMigration = read('scripts/migrate-social-credentials.ts');
const refreshTokenWorkflow = read(
  'apps/orchestrator/src/workflows/refresh.token.workflow.ts'
);
const publicIntegrationsController = read(
  'apps/backend/src/public-api/routes/v1/public.integrations.controller.ts'
);
const integrationTriggerTool = read(
  'libraries/nestjs-libraries/src/chat/tools/integration.trigger.tool.ts'
);

const requirements = [
  [
    packageJson.scripts.dev === 'node ./scripts/dev-safety-notice.mjs',
    'The root dev command must remain a non-launching safety notice.',
  ],
  [
    packageJson.scripts.test.includes('--runInBand'),
    'Jest must remain single-process.',
  ],
  [
    packageJson.scripts.build.includes('--workspace-concurrency=1'),
    'Workspace builds must remain serial.',
  ],
  [
    integrationController.includes('if (refreshAttempt >= 1)'),
    'Integration function refresh retries must remain bounded.',
  ],
  [
    integrationController.includes('refreshAttempt + 1'),
    'Integration function retries must increment their attempt counter.',
  ],
  [
    !postsService.includes('findFreeDateTimeRecursive'),
    'Publishing-slot search must not use unbounded recursion.',
  ],
  [
    postsService.includes('MAX_SCHEDULING_HORIZON_DAYS'),
    'Publishing-slot search must retain a finite horizon.',
  ],
  [
    (postsService.match(/e instanceof RefreshToken && !forceRefresh/g) || [])
      .length === 2,
    'Post credential refresh retry guards must remain single-use.',
  ],
  [
    integrationService.includes('e instanceof RefreshToken && !forceRefresh'),
    'Integration analytics refresh retry must remain single-use.',
  ],
  [
    postsRepository.includes('take: 50'),
    'The pending approval queue must retain a finite result limit.',
  ],
  [
    credentialMigration.includes('const BATCH_SIZE = 100') &&
      credentialMigration.includes('processed < initialTotal'),
    'Social credential migration must remain batch- and iteration-bounded.',
  ],
  [
    refreshTokenWorkflow.includes('continueAsNew') &&
      refreshTokenWorkflow.includes(
        'social-credential-refresh-history-boundary-v1'
      ),
    'New credential-refresh workflow histories must continue as new.',
  ],
  [
    !publicIntegrationsController.includes('while (true)') &&
      publicIntegrationsController.includes('refreshAttempt <= 1'),
    'Public integration credential refresh must remain bounded to one retry.',
  ],
  [
    publicIntegrationsController.includes(
      'await this._postsService.deletePost(org.id, post.group)'
    ),
    'Public channel deletion must process post groups sequentially.',
  ],
  [
    !integrationTriggerTool.includes('while (true)') &&
      integrationTriggerTool.includes('refreshAttempt <= 1'),
    'MCP integration credential refresh must remain bounded to one retry.',
  ],
];

const failures = requirements
  .filter(([passed]) => !passed)
  .map(([, message]) => message);

if (failures.length > 0) {
  process.stderr.write(
    `Resource-safety audit failed:\n${failures.join('\n')}\n`
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Resource-safety audit passed (${requirements.length} invariants).\n`
  );
}
