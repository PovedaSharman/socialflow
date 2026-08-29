const values = new Map<string, string>();

jest.mock('@gitroom/nestjs-libraries/redis/redis.service', () => ({
  ioRedis: {
    set: jest.fn(async (key: string, value: string, ...args: string[]) => {
      if (args.includes('NX') && values.has(key)) {
        return null;
      }
      values.set(key, value);
      return 'OK';
    }),
    getdel: jest.fn(async (key: string) => {
      const value = values.get(key);
      values.delete(key);
      return value;
    }),
  },
}));

import {
  consumeOAuthConnectTransaction,
  consumePublicProviderContinuation,
  createOAuthConnectTransaction,
  createPublicProviderContinuation,
  hardenOAuthState,
} from './oauth.connect.transaction';

describe('OAuth connect transactions', () => {
  beforeEach(() => values.clear());

  it('replaces ordinary OAuth state with 256-bit randomness', () => {
    const hardened = hardenOAuthState({
      url: 'https://provider.example/authorize?client_id=client&state=weak',
      state: 'weak',
    });

    expect(hardened.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(new URL(hardened.url).searchParams.get('state')).toBe(
      hardened.state
    );
  });

  it('preserves platform-issued OAuth 1.0 callback tokens', () => {
    const oauth1 = {
      url: 'https://provider.example/authenticate?oauth_token=platform-token',
      state: 'platform-token',
    };
    expect(hardenOAuthState(oauth1)).toEqual(oauth1);
  });

  it('hardens a composite custom-provider nonce', () => {
    const hardened = hardenOAuthState({
      url: 'client-id||weak',
      state: 'weak',
    });
    expect(hardened.url).toBe(`client-id||${hardened.state}`);
    expect(hardened.state).toHaveLength(43);
  });

  it('binds a transaction to its provider and consumes it once', async () => {
    await createOAuthConnectTransaction('state', {
      version: 1,
      provider: 'linkedin',
      organizationId: 'org-1',
      initiatedByUserId: 'user-1',
      codeVerifier: 'verifier',
      flow: 'user',
    });

    await expect(
      consumeOAuthConnectTransaction('x', 'state')
    ).resolves.toBeUndefined();
    await expect(
      consumeOAuthConnectTransaction('linkedin', 'state')
    ).resolves.toMatchObject({
      organizationId: 'org-1',
      initiatedByUserId: 'user-1',
    });
    await expect(
      consumeOAuthConnectTransaction('linkedin', 'state')
    ).resolves.toBeUndefined();
  });

  it('refuses to overwrite an outstanding state', async () => {
    const transaction = {
      version: 1 as const,
      provider: 'linkedin',
      organizationId: 'org-1',
      codeVerifier: 'verifier',
      flow: 'enterprise' as const,
    };
    await createOAuthConnectTransaction('state', transaction);
    await expect(
      createOAuthConnectTransaction('state', transaction)
    ).rejects.toThrow('OAuth state collision');
  });

  it('issues a random one-use public continuation', async () => {
    const token = await createPublicProviderContinuation({
      version: 1,
      provider: 'linkedin-page',
      organizationId: 'org-1',
      integrationId: 'integration-1',
    });

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await expect(
      consumePublicProviderContinuation(token)
    ).resolves.toMatchObject({ integrationId: 'integration-1' });
    await expect(
      consumePublicProviderContinuation(token)
    ).resolves.toBeUndefined();
  });
});
