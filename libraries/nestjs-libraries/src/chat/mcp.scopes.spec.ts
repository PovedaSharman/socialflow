import {
  DEFAULT_MCP_SCOPES,
  MCP_SCOPES,
  OPT_IN_MCP_SCOPES,
  defaultMcpScopes,
  mcpAllowsImmediatePublish,
  mcpAllowsMediaGeneration,
  normalizeMcpScopes,
} from './mcp.scopes';

describe('MCP scopes', () => {
  it('keeps immediate publish and media generation off by default', () => {
    expect(defaultMcpScopes()).toEqual([...DEFAULT_MCP_SCOPES]);
    expect(defaultMcpScopes()).not.toEqual(
      expect.arrayContaining([...OPT_IN_MCP_SCOPES])
    );
    expect(mcpAllowsImmediatePublish(defaultMcpScopes())).toBe(false);
    expect(mcpAllowsMediaGeneration(defaultMcpScopes())).toBe(false);
  });

  it('normalises known scopes and drops unknown values', () => {
    expect(
      normalizeMcpScopes([
        ' posts:publish ',
        'posts:publish',
        'not-a-scope',
        'channels:read',
      ])
    ).toEqual(['posts:publish', 'channels:read']);
    expect(MCP_SCOPES).toContain('audit:read');
  });

  it('requires an explicit posts:publish grant for immediate publishing', () => {
    expect(mcpAllowsImmediatePublish(['posts:schedule'])).toBe(false);
    expect(mcpAllowsImmediatePublish(['posts:publish'])).toBe(true);
  });
});
