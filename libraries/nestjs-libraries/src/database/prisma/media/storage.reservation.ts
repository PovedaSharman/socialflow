import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';

const RESERVATION_TTL_SECONDS = 60 * 60;

function reservationKey(organizationId: string) {
  return `storage:reserve:${organizationId}`;
}

export async function getReservedStorageBytes(
  organizationId: string
): Promise<number> {
  const raw = await ioRedis.get(reservationKey(organizationId));
  const value = Number(raw || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Atomically reserve bytes against used+reserved+limit.
 * Returns false when the claim would exceed the limit (and does not leave a
 * partial reservation).
 */
export async function claimStorageReservation(input: {
  organizationId: string;
  usedBytes: number;
  incomingBytes: number;
  limitBytes: number;
  nowMs?: number;
}): Promise<boolean> {
  const key = reservationKey(input.organizationId);
  const used = Math.max(0, Number(input.usedBytes) || 0);
  const incoming = Math.max(0, Number(input.incomingBytes) || 0);
  const limit = Number(input.limitBytes);
  if (!Number.isFinite(limit) || incoming <= 0) {
    return false;
  }

  const script = `
    local key = KEYS[1]
    local incoming = tonumber(ARGV[1])
    local used = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local ttl = tonumber(ARGV[4])
    local reserved = tonumber(redis.call('GET', key) or '0')
    if used + reserved + incoming > limit then
      return 0
    end
    local next = redis.call('INCRBY', key, incoming)
    redis.call('EXPIRE', key, ttl)
    return next
  `;

  const result = await ioRedis.eval(
    script,
    1,
    key,
    String(incoming),
    String(used),
    String(limit),
    String(RESERVATION_TTL_SECONDS)
  );

  return Number(result) > 0;
}

export async function releaseStorageReservation(
  organizationId: string,
  bytes: number
): Promise<void> {
  const amount = Math.max(0, Number(bytes) || 0);
  if (amount <= 0) {
    return;
  }

  const key = reservationKey(organizationId);
  const script = `
    local key = KEYS[1]
    local amount = tonumber(ARGV[1])
    local current = tonumber(redis.call('GET', key) or '0')
    if current <= amount then
      redis.call('DEL', key)
      return 0
    end
    return redis.call('DECRBY', key, amount)
  `;

  await ioRedis.eval(script, 1, key, String(amount));
}
