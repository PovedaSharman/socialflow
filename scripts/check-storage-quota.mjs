import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const quota = read(
  'libraries/nestjs-libraries/src/database/prisma/media/storage.quota.ts'
);
const reservation = read(
  'libraries/nestjs-libraries/src/database/prisma/media/storage.reservation.ts'
);
const mediaService = read(
  'libraries/nestjs-libraries/src/database/prisma/media/media.service.ts'
);
const mediaRepository = read(
  'libraries/nestjs-libraries/src/database/prisma/media/media.repository.ts'
);
const objectBytes = read(
  'libraries/nestjs-libraries/src/upload/object.byte.length.ts'
);
const publicApi = read(
  'apps/backend/src/public-api/routes/v1/public.integrations.controller.ts'
);
const migrationReadme = read(
  'libraries/nestjs-libraries/src/database/prisma/migrations/20260830120000_socialflow_control_plane/README.md'
);
const billing = read('docs/BILLING.md');

const invariants = [
  [
    quota.includes('resolveTrustedByteLength') &&
      quota.includes('fitsStorageQuota') &&
      quota.includes('UNKNOWN_FILE_SIZE_POLICY') &&
      quota.includes('value <= 0'),
    'trusted sizes must reject zero and unknown values',
  ],
  [
    reservation.includes('claimStorageReservation') &&
      reservation.includes('releaseStorageReservation') &&
      reservation.includes('INCRBY') &&
      reservation.includes('storage:reserve:'),
    'Redis must soft-reserve bytes before concurrent commits',
  ],
  [
    mediaRepository.includes('pg_advisory_xact_lock') &&
      mediaRepository.includes('saveFileAtomic') &&
      mediaRepository.includes('fitsStorageQuota') &&
      mediaRepository.includes('storage_quota_historical_sizes_unknown') &&
      mediaRepository.includes('fileSize: 0'),
    'PostgreSQL must re-check quota under an organisation advisory lock',
  ],
  [
    mediaService.includes('resolveTrustedByteLength') &&
      mediaService.includes('resolveObjectByteLength') &&
      mediaService.includes('claimStorageReservation') &&
      mediaService.includes('releaseStorageReservation') &&
      mediaService.includes('removeFile') &&
      mediaService.includes('Trusted file size is required'),
    'MediaService must require trusted sizes, reserve, commit and clean up',
  ],
  [
    objectBytes.includes('HeadObjectCommand') &&
      objectBytes.includes('ContentLength') &&
      !objectBytes.includes('arrayBuffer'),
    'object size probes must use HEAD metadata without buffering bodies',
  ],
  [
    publicApi.includes('file.size') &&
      publicApi.includes('buffer.length') &&
      !/saveFile\(\s*org\.id,\s*getFile\.originalname,\s*getFile\.path\s*\)/.test(
        publicApi
      ),
    'public API uploads must pass trusted byte lengths',
  ],
  [
    migrationReadme.includes('fileSize = 0') &&
      migrationReadme.includes('unknown') &&
      billing.includes('advisory lock') &&
      billing.includes('Media.fileSize = 0'),
    'unknown historical sizes and enforcement must be documented',
  ],
];

let failed = 0;
for (const [ok, message] of invariants) {
  try {
    assert.equal(ok, true, message);
    console.log(`ok - ${message}`);
  } catch (err) {
    failed += 1;
    console.error(`fail - ${message}`);
    console.error(err.message);
  }
}

if (failed) {
  console.error(`${failed} storage-quota invariant(s) failed`);
  process.exit(1);
}

console.log(`${invariants.length} storage-quota invariants passed`);
