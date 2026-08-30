#!/usr/bin/env bash
set -euo pipefail

if [[ "${ALLOW_DISPOSABLE_DATABASE_BOOTSTRAP:-}" != "true" ]]; then
  echo "Set ALLOW_DISPOSABLE_DATABASE_BOOTSTRAP=true for an approved disposable database." >&2
  exit 1
fi

node <<'NODE'
const raw = process.env.DATABASE_URL || '';
let url;
try {
  url = new URL(raw);
} catch {
  console.error('A valid DATABASE_URL is required.');
  process.exit(1);
}
const database = url.pathname.toLowerCase();
if (!database.includes('test') && !database.includes('staging')) {
  console.error('Disposable database name must contain test or staging.');
  process.exit(1);
}
if (!['test', 'staging'].includes(process.env.NODE_ENV || '')) {
  console.error('NODE_ENV must be test or staging.');
  process.exit(1);
}
NODE

pnpm prisma-db-push
pnpm exec prisma migrate resolve \
  --schema libraries/nestjs-libraries/src/database/prisma/schema.prisma \
  --applied 20260830120000_socialflow_control_plane
pnpm prisma-migrate-deploy
pnpm prisma-migrate-status
