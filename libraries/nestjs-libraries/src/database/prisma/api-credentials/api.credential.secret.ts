import { createHash, randomBytes } from 'node:crypto';
import {
  DEFAULT_MCP_SCOPES,
  McpScope,
  normalizeMcpScopes,
} from '@gitroom/nestjs-libraries/chat/mcp.scopes';

export const API_CREDENTIAL_PREFIX = 'sf_live_';

export function createApiCredentialSecret() {
  const secret = `${API_CREDENTIAL_PREFIX}${randomBytes(32).toString(
    'base64url'
  )}`;
  return {
    secret,
    prefix: secret.slice(0, 12),
    secretHash: hashApiCredentialSecret(secret),
  };
}

export function hashApiCredentialSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

export function resolveApiCredentialScopes(scopes: string[] | undefined) {
  const normalized = normalizeMcpScopes(scopes);
  if (!normalized.length) {
    return [...DEFAULT_MCP_SCOPES] as McpScope[];
  }
  return normalized;
}

export function apiCredentialPublicView(credential: {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
  createdByUserId: string;
}) {
  return {
    id: credential.id,
    name: credential.name,
    prefix: credential.prefix,
    scopes: credential.scopes,
    expiresAt: credential.expiresAt || null,
    lastUsedAt: credential.lastUsedAt || null,
    revokedAt: credential.revokedAt || null,
    createdAt: credential.createdAt,
    createdByUserId: credential.createdByUserId,
  };
}
