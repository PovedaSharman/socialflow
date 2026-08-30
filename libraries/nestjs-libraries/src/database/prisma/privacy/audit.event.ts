import { createHmac } from 'node:crypto';

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
  'apikey',
  'content',
  'message',
  'body',
  'prompt',
  'bearer',
];

/**
 * Pseudonymise client IPs with HMAC-SHA256.
 * Without `AUDIT_IP_HMAC_KEY`, returns null (never falls back to unsalted hashing).
 */
export function hashAuditIp(
  ip: string | null | undefined,
  hmacKey: string | null | undefined = process.env.AUDIT_IP_HMAC_KEY
) {
  const value = String(ip || '').trim();
  if (!value) {
    return null;
  }
  const key = String(hmacKey || '').trim();
  if (!key) {
    return null;
  }
  return createHmac('sha256', key).update(value).digest('hex');
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

/**
 * Reliability policy: audit persistence failures must not convert a successful
 * (or intentionally denied) primary action into an ambiguous client failure.
 * Callers should await `safeCreateAuditEvent` and ignore a null return.
 */
export const AUDIT_WRITE_RELIABILITY_POLICY =
  'Audit writes are best-effort. Primary allow/deny/fail outcomes proceed even when AuditEvent persistence fails; operators must monitor audit_event_write_failed signals separately.';
