import { PrismaClient } from '@prisma/client';
import { SocialCredentialEncryptionService } from '../libraries/nestjs-libraries/src/security/social-credential-encryption.service';

const BATCH_SIZE = 100;
const applyChanges = process.env.SOCIAL_CREDENTIAL_MIGRATION_APPLY === 'true';

if (
  !process.env.SOCIAL_CREDENTIAL_ENCRYPTION_KEYS ||
  !process.env.SOCIAL_CREDENTIAL_ENCRYPTION_ACTIVE_KEY_ID
) {
  throw new Error('A complete social credential key ring is required.');
}

const prisma = new PrismaClient();
const encryption = new SocialCredentialEncryptionService();

async function scanAndRotate(write: boolean) {
  const initialTotal = await prisma.integration.count();
  let cursor: string | undefined;
  let processed = 0;
  let changed = 0;

  while (processed < initialTotal) {
    const rows = await prisma.integration.findMany({
      orderBy: { id: 'asc' },
      take: Math.min(BATCH_SIZE, initialTotal - processed),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, token: true, refreshToken: true },
    });
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const token = encryption.encrypt(row.token);
      const refreshToken =
        row.refreshToken == null
          ? row.refreshToken
          : encryption.encrypt(row.refreshToken);
      if (token !== row.token || refreshToken !== row.refreshToken) {
        changed += 1;
        if (write) {
          await prisma.integration.update({
            where: { id: row.id },
            data: { token, refreshToken },
            select: { id: true },
          });
        }
      }
    }

    processed += rows.length;
    cursor = rows[rows.length - 1].id;
    process.stdout.write(
      `Credential migration scanned ${processed}/${initialTotal} rows.\n`
    );
  }

  return { processed, changed };
}

async function main() {
  const result = await scanAndRotate(applyChanges);
  if (!applyChanges) {
    process.stdout.write(
      `Dry run complete: ${result.changed}/${result.processed} rows require encryption or rotation.\n`
    );
    return;
  }

  const verification = await scanAndRotate(false);
  if (verification.changed !== 0) {
    throw new Error(
      `${verification.changed} social credential rows failed verification.`
    );
  }
  process.stdout.write(
    `Credential migration complete: ${result.changed}/${result.processed} rows updated and verified.\n`
  );
}

main()
  .catch((error) => {
    process.stderr.write(
      `${
        error instanceof Error ? error.message : 'Credential migration failed.'
      }\n`
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
