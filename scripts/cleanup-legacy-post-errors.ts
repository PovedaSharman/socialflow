import { PrismaClient } from '@prisma/client';

const SAFE_BODY_PREFIX = '{"version":1,';
const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;
const applyChanges = process.env.ERROR_HISTORY_CLEANUP_APPLY === 'true';

const requestedBatchSize = Number(
  process.env.ERROR_HISTORY_CLEANUP_BATCH_SIZE || DEFAULT_BATCH_SIZE
);
if (
  !Number.isInteger(requestedBatchSize) ||
  requestedBatchSize < 1 ||
  requestedBatchSize > MAX_BATCH_SIZE
) {
  throw new Error(
    `ERROR_HISTORY_CLEANUP_BATCH_SIZE must be an integer from 1 to ${MAX_BATCH_SIZE}.`
  );
}

if (applyChanges && process.env.ALLOW_ERROR_HISTORY_CLEANUP !== 'true') {
  throw new Error(
    'Applying cleanup requires ALLOW_ERROR_HISTORY_CLEANUP=true.'
  );
}

const prisma = new PrismaClient();
const legacyWhere = {
  NOT: { body: { startsWith: SAFE_BODY_PREFIX } },
};

async function main() {
  // One fixed query and at most 100 sequential updates per invocation. There
  // is deliberately no unbounded scan/retry loop or payload read into memory.
  const rows = await prisma.errors.findMany({
    where: legacyWhere,
    orderBy: { id: 'asc' },
    take: requestedBatchSize,
    select: { id: true, postId: true },
  });

  if (!applyChanges) {
    process.stdout.write(
      `Dry run: ${rows.length} legacy error-history rows are ready in this bounded batch.\n`
    );
    return;
  }

  for (const row of rows) {
    await prisma.$transaction([
      prisma.errors.update({
        where: { id: row.id },
        data: {
          message:
            'Legacy publishing failure (details removed by privacy cleanup)',
          body: JSON.stringify({
            version: 1,
            attempts: [],
            legacyPayloadRemoved: true,
          }),
        },
        select: { id: true },
      }),
      prisma.post.updateMany({
        where: { id: row.postId },
        data: {
          error:
            'Legacy publishing failure details were removed. Review the channel before retrying.',
        },
      }),
    ]);
  }

  const remaining = await prisma.errors.count({ where: legacyWhere });
  process.stdout.write(
    `Cleanup applied to ${rows.length} rows; ${remaining} legacy rows remain. Run another reviewed batch if needed.\n`
  );
}

main()
  .catch((error) => {
    process.stderr.write(
      `${
        error instanceof Error ? error.message : 'Error-history cleanup failed.'
      }\n`
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
