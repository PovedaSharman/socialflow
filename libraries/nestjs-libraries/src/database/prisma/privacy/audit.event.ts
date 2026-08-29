import { createHash } from 'node:crypto';

export type AuditEventInput = {
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  outcome: 'success' | 'denied' | 'failed' | 'requested';
  source: 'website' | 'api' | 'mcp' | 'system';
  requestId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

const blockedMetadataKeys = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'authorization',
  'apiKey',
  'content',
  'message',
  'body',
];

export function hashAuditIp(ip: string | null | undefined) {
  const value = String(ip || '').trim();
  if (!value) {
    return null;
  }
  return createHash('sha256').update(value).digest('hex');
}

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  if (!metadata) {
    return null;
  }

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (blockedMetadataKeys.some((blocked) => lower.includes(blocked))) {
      continue;
    }
    if (typeof value === 'string' && value.length > 200) {
      safe[key] = `${value.slice(0, 200)}…`;
      continue;
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      safe[key] = value;
    }
  }
  return Object.keys(safe).length ? safe : null;
}
