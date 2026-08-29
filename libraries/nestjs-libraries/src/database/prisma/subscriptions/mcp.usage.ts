import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';
import dayjs from 'dayjs';

const KEY_PREFIX = 'usage:mcp:';

export function mcpUsageKey(organizationId: string, periodStart: Date) {
  return `${KEY_PREFIX}${organizationId}:${dayjs(periodStart).format(
    'YYYY-MM'
  )}`;
}

/**
 * Atomically increments the organisation MCP call counter for the billing
 * month. Returns the new count, or null when Redis is unavailable.
 */
export async function incrementMcpCallCount(
  organizationId: string,
  periodStart: Date = new Date()
) {
  const id = String(organizationId || '').trim();
  if (!id) {
    return null;
  }

  const key = mcpUsageKey(id, periodStart);
  const count = await ioRedis.incr(key);
  if (count === 1) {
    await ioRedis.expire(key, 60 * 60 * 24 * 40);
  }
  return count;
}

export async function getMcpCallCount(
  organizationId: string,
  periodStart: Date = new Date()
) {
  const id = String(organizationId || '').trim();
  if (!id) {
    return 0;
  }
  const raw = await ioRedis.get(mcpUsageKey(id, periodStart));
  return Number(raw || 0) || 0;
}
