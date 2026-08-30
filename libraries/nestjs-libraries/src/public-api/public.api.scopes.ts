import {
  McpScope,
  mcpScopeAllows,
  normalizeMcpScopes,
} from '@gitroom/nestjs-libraries/chat/mcp.scopes';

export type PublicApiAuthKind = 'scoped' | 'legacy' | 'oauth';

export type PublicApiAuthContext = {
  organizationId?: string;
  /**
   * Scopes attached by PublicAuthMiddleware. Missing or non-array values deny.
   * Legacy organisation API keys and OAuth tokens receive DEFAULT_MCP_SCOPES
   * (no posts:publish, no media:generate) — see docs/MCP_CREDENTIALS.md.
   */
  mcpScopes?: unknown;
  apiCredentialId?: string | null;
  authKind?: PublicApiAuthKind;
};

export type PublicApiScopeDecision = {
  allowed: boolean;
  required?: McpScope;
  reason?: string;
  action: string;
};

function normalizePath(path: string) {
  const bare = String(path || '').split('?')[0];
  const marker = '/public/v1';
  const index = bare.indexOf(marker);
  return index === -1 ? bare : bare.slice(index + marker.length) || '/';
}

/**
 * Maps post create type to the required write scope.
 * Unknown or missing type is denied (fail closed).
 */
export function requiredScopeForPostType(type: unknown): McpScope | undefined {
  if (type === 'draft') {
    return 'posts:draft';
  }
  if (type === 'schedule') {
    return 'posts:schedule';
  }
  if (type === 'now') {
    return 'posts:publish';
  }
  return undefined;
}

/**
 * Resolve the scope required for a public API request.
 * Returns undefined when the route is unknown (caller must deny).
 */
export function requiredScopeForPublicRequest(input: {
  method: string;
  path: string;
  body?: any;
}): McpScope | undefined {
  const method = String(input.method || 'GET').toUpperCase();
  const path = normalizePath(input.path);

  if (method === 'POST' && path === '/posts') {
    return requiredScopeForPostType(input.body?.type);
  }

  if (method === 'DELETE' && path.startsWith('/posts/')) {
    return 'posts:draft';
  }

  if (method === 'PUT' && /^\/posts\/[^/]+\/status$/.test(path)) {
    return requiredScopeForPostType(input.body?.status);
  }

  if (method === 'PUT' && /^\/posts\/[^/]+\/release-id$/.test(path)) {
    return 'posts:draft';
  }

  if (
    method === 'GET' &&
    (path === '/posts' ||
      path.startsWith('/posts/') ||
      path.startsWith('/notifications') ||
      path.startsWith('/analytics/') ||
      path.startsWith('/find-slot/'))
  ) {
    return 'posts:read';
  }

  if (
    method === 'GET' &&
    (path === '/integrations' ||
      path === '/groups' ||
      path === '/is-connected' ||
      path.startsWith('/integration-settings/'))
  ) {
    return 'channels:read';
  }

  if (method === 'GET' && path.startsWith('/social/')) {
    // Starting a provider OAuth connection is privileged.
    return 'posts:publish';
  }

  if (
    method === 'POST' &&
    (path === '/upload' || path === '/upload-from-url')
  ) {
    return 'posts:draft';
  }

  if (
    method === 'POST' &&
    (path === '/generate-video' || path === '/video/function')
  ) {
    return 'media:generate';
  }

  if (method === 'DELETE' && path.startsWith('/integrations/')) {
    // No channels:write scope yet; treat destructive channel ops as elevated.
    return 'posts:publish';
  }

  if (method === 'POST' && path.startsWith('/integration-trigger/')) {
    return 'channels:read';
  }

  return undefined;
}

export function evaluatePublicApiScope(input: {
  method: string;
  path: string;
  body?: any;
  auth: PublicApiAuthContext | null | undefined;
}): PublicApiScopeDecision {
  const action = `${String(
    input.method || 'GET'
  ).toUpperCase()} ${normalizePath(input.path)}`;

  if (!input.auth?.organizationId) {
    return {
      allowed: false,
      action,
      reason: 'missing_organisation',
    };
  }

  if (!Array.isArray(input.auth.mcpScopes)) {
    return {
      allowed: false,
      action,
      reason: 'missing_scopes',
    };
  }

  const scopes = normalizeMcpScopes(input.auth.mcpScopes as string[]);
  const required = requiredScopeForPublicRequest({
    method: input.method,
    path: input.path,
    body: input.body,
  });

  if (!required) {
    return {
      allowed: false,
      action,
      reason: 'unknown_route_or_post_type',
    };
  }

  if (!mcpScopeAllows(scopes, required)) {
    return {
      allowed: false,
      required,
      action,
      reason: 'missing_scope',
    };
  }

  return {
    allowed: true,
    required,
    action,
  };
}
