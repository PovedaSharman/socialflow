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
