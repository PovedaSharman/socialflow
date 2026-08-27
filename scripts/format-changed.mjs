import { spawnSync } from 'node:child_process';

const mode = process.argv[2];
if (!['--check', '--write'].includes(mode)) {
  throw new Error('Usage: node scripts/format-changed.mjs --check|--write');
}

function gitFiles(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout.split('\n').filter(Boolean);
}

const candidates = new Set([
  ...gitFiles(['diff', '--name-only', '--diff-filter=ACMR', 'v2.23.0', '--']),
  ...gitFiles(['ls-files', '--others', '--exclude-standard']),
]);
const supported = /\.(?:cjs|css|js|json|jsx|md|mjs|scss|ts|tsx|yaml|yml)$/;
const files = [...candidates]
  .filter((file) => supported.test(file))
  .filter((file) => !file.includes('/dist/') && !file.includes('/.next/'))
  .sort();

if (files.length === 0) {
  console.log('No changed files require Prettier');
  process.exit(0);
}

const prettier = spawnSync('pnpm', ['exec', 'prettier', mode, ...files], {
  stdio: 'inherit',
});
process.exit(prettier.status ?? 1);
