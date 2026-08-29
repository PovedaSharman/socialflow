export const MCP_SCOPES = [
  'audit:read',
  'channels:read',
  'posts:read',
  'posts:draft',
  'posts:schedule',
  'posts:publish',
  'media:generate',
] as const;

export type McpScope = (typeof MCP_SCOPES)[number];

/** Scopes granted unless an operator explicitly opts in to riskier tools. */
export const DEFAULT_MCP_SCOPES: readonly McpScope[] = [
  'audit:read',
  'channels:read',
  'posts:read',
  'posts:draft',
  'posts:schedule',
];

export const OPT_IN_MCP_SCOPES: readonly McpScope[] = [
  'posts:publish',
  'media:generate',
];

export function isMcpScope(value: string): value is McpScope {
  return (MCP_SCOPES as readonly string[]).includes(value);
}

export function normalizeMcpScopes(scopes: string[] | undefined) {
  const unique = [
    ...new Set(
      (scopes || [])
        .map((scope) => scope.trim())
        .filter((scope): scope is McpScope => isMcpScope(scope))
    ),
  ];
  return unique;
}

export function defaultMcpScopes() {
  return [...DEFAULT_MCP_SCOPES];
}

export function mcpScopeAllows(
  scopes: string[] | undefined,
  required: McpScope
) {
  return normalizeMcpScopes(scopes).includes(required);
}

export function mcpAllowsImmediatePublish(scopes: string[] | undefined) {
  return mcpScopeAllows(scopes, 'posts:publish');
}

export function mcpAllowsMediaGeneration(scopes: string[] | undefined) {
  return mcpScopeAllows(scopes, 'media:generate');
}
