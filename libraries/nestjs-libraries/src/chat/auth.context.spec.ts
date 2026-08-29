import { missingMcpScope } from './auth.context';

describe('missingMcpScope', () => {
  it('does not limit the in-app copilot UI session', () => {
    expect(
      missingMcpScope('posts:publish', {
        requestContext: {
          get: (key: string) => (key === 'ui' ? 'true' : undefined),
        },
      })
    ).toBeUndefined();
  });

  it('denies immediate publish without posts:publish', () => {
    expect(
      missingMcpScope('posts:publish', {
        requestContext: {
          get: (key: string) =>
            key === 'ui'
              ? 'false'
              : key === 'organization'
              ? JSON.stringify({
                  id: 'org',
                  mcpScopes: ['posts:schedule'],
                })
              : undefined,
        },
      })
    ).toBe('Missing required scope: posts:publish');
  });

  it('allows schedule when posts:schedule is present', () => {
    expect(
      missingMcpScope('posts:schedule', {
        requestContext: {
          get: (key: string) =>
            key === 'ui'
              ? 'false'
              : key === 'organization'
              ? JSON.stringify({
                  id: 'org',
                  mcpScopes: ['posts:schedule'],
                })
              : undefined,
        },
      })
    ).toBeUndefined();
  });
});
