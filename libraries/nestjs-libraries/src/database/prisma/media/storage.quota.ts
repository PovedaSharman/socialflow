/**
 * Trusted media size and storage-quota helpers.
 *
 * Existing Media.fileSize = 0 means unknown historical size, not free capacity.
 * New writes must supply a positive integer byte length from server-side data
 * (multer size, buffered download length, or object-store ContentLength).
 */

export function resolveTrustedByteLength(value: unknown): number | null {
  if (typeof value === 'bigint') {
    if (value <= 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null;
    }
    return Number(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
      return null;
    }
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  return null;
}

export function fitsStorageQuota(input: {
  usedBytes: number;
  reservedBytes: number;
  incomingBytes: number;
  limitBytes: number;
}): boolean {
  const used = Math.max(0, Number(input.usedBytes) || 0);
  const reserved = Math.max(0, Number(input.reservedBytes) || 0);
  const incoming = resolveTrustedByteLength(input.incomingBytes);
  const limit = Number(input.limitBytes);

  if (incoming === null) {
    return false;
  }
  if (!Number.isFinite(limit) || limit < 0) {
    return false;
  }

  return used + reserved + incoming <= limit;
}

/** Documented treatment for rows that predate trusted sizing. */
export const UNKNOWN_FILE_SIZE_POLICY =
  'Media.fileSize = 0 means unknown size. Do not treat it as free capacity when storage limits are enforced; backfill from object-store metadata before production hard limits.';
