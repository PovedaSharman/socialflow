import { getAuth } from '@gitroom/nestjs-libraries/chat/async.storage';
import {
  McpScope,
  mcpScopeAllows,
} from '@gitroom/nestjs-libraries/chat/mcp.scopes';

export const checkAuth = (inputData: any, context: any) => {
  const auth = getAuth();
  const authInfo = context?.mcp?.extra?.authInfo || auth;
  if (authInfo && context?.requestContext) {
    (context.requestContext as any).set(
      'organization',
      JSON.stringify(authInfo)
    );
    (context.requestContext as any).set('ui', 'false');
  }
};

/**
 * Enforces API/MCP credential scopes. The in-app copilot (`ui=true`) keeps
 * session authorisation and is not limited by MCP scopes.
 */
export function missingMcpScope(
  required: McpScope,
  context?: any
): string | undefined {
  const ui = (context?.requestContext as any)?.get?.('ui');
  if (ui === 'true') {
    return undefined;
  }

  let scopes: string[] | undefined;
  const auth = getAuth() as { mcpScopes?: string[] } | undefined;
  if (Array.isArray(auth?.mcpScopes)) {
    scopes = auth.mcpScopes;
  } else {
    try {
      const raw = (context?.requestContext as any)?.get?.('organization');
      const parsed = raw ? JSON.parse(raw) : undefined;
      if (Array.isArray(parsed?.mcpScopes)) {
        scopes = parsed.mcpScopes;
      }
    } catch {
      scopes = undefined;
    }
  }

  if (!Array.isArray(scopes)) {
    return `Missing required scope: ${required}`;
  }

  if (!mcpScopeAllows(scopes, required)) {
    return `Missing required scope: ${required}`;
  }

  return undefined;
}
