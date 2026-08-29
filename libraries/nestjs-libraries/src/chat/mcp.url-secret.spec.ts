import { areMcpUrlSecretsAllowed } from './mcp.url-secret';

describe('MCP URL secret gate', () => {
  it('allows URL secrets outside production for local recovery', () => {
    expect(areMcpUrlSecretsAllowed({ NODE_ENV: 'development' })).toBe(true);
  });

  it('denies URL secrets in production unless explicitly enabled', () => {
    expect(areMcpUrlSecretsAllowed({ NODE_ENV: 'production' })).toBe(false);
    expect(
      areMcpUrlSecretsAllowed({
        NODE_ENV: 'production',
        ALLOW_MCP_URL_SECRETS: 'true',
      })
    ).toBe(true);
  });
});
