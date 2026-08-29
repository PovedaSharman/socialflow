/**
 * URL-embedded MCP/API secrets are a compatibility hazard. Production denies
 * `/mcp/:id`, `/sse/:id` and `/message/:id` unless an operator explicitly opts
 * into a temporary compatibility window.
 */
export function areMcpUrlSecretsAllowed(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== 'production') {
    return true;
  }

  return env.ALLOW_MCP_URL_SECRETS === 'true';
}
