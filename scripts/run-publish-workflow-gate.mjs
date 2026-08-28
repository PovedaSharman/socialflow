import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { isAbsolute, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

if (
  process.env.NODE_ENV !== 'test' ||
  process.env.RUN_TEMPORAL_INTEGRATION_TESTS !== 'true' ||
  process.env.ALLOW_TEMPORAL_TEST_HISTORY !== 'true'
) {
  fail(
    'The publish workflow gate requires NODE_ENV=test, RUN_TEMPORAL_INTEGRATION_TESTS=true and ALLOW_TEMPORAL_TEST_HISTORY=true.'
  );
}

if (!(process.env.TEMPORAL_NAMESPACE || '').toLowerCase().includes('test')) {
  fail('The Temporal namespace must contain "test".');
}
if (!process.env.TEMPORAL_ADDRESS) {
  fail('TEMPORAL_ADDRESS is required.');
}

const artifactDirectory = resolve(
  process.env.TEMPORAL_TEST_ARTIFACT_DIR || 'artifacts/temporal-post-safety'
);
const artifactRelativePath = relative(process.cwd(), artifactDirectory);
if (
  !artifactRelativePath ||
  artifactRelativePath.startsWith('..') ||
  isAbsolute(artifactRelativePath)
) {
  fail('TEMPORAL_TEST_ARTIFACT_DIR must be inside the repository.');
}

const testFile =
  'apps/orchestrator/src/workflows/post-workflows/post.workflow.v1.0.6.integration.spec.ts';
if (!existsSync(testFile)) {
  fail(`Publish workflow test file is missing: ${testFile}`);
}

const require = createRequire(import.meta.url);
const jestBin = require.resolve('jest/bin/jest');
const result = spawnSync(
  process.execPath,
  [jestBin, '--runInBand', '--runTestsByPath', testFile, '--reporters=default'],
  {
    stdio: 'inherit',
    shell: false,
    timeout: 90_000,
    killSignal: 'SIGTERM',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=1024',
      TEMPORAL_TEST_ARTIFACT_DIR: artifactDirectory,
    },
  }
);

if (result.error) {
  fail(
    `Publish workflow gate failed to start or timed out: ${result.error.message}`
  );
}
process.exit(result.status ?? 1);
