import { SocialFlowTestProvider } from './socialflow.test.provider';

describe('SocialFlowTestProvider', () => {
  it('connects and publishes without network access', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const provider = new SocialFlowTestProvider();
    const code = Buffer.from(
      JSON.stringify({ displayName: 'Development account' })
    ).toString('base64');

    const authentication = await provider.authenticate({ code });
    expect(authentication).toMatchObject({
      id: 'socialflow-local-test-account',
      name: 'Development account',
      username: 'local-test',
    });

    const result = await provider.post(
      'integration-id',
      'ignored',
      [{ id: 'post-id', message: 'Safe local post', settings: {} }],
      {} as never
    );

    expect(result).toEqual([
      {
        id: 'post-id',
        postId: 'local-integration-id-1',
        releaseURL: 'socialflow-test://posts/local-integration-id-1',
        status: 'completed',
      },
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('rejects malformed connection data', async () => {
    const provider = new SocialFlowTestProvider();
    await expect(
      provider.authenticate({ code: 'not-base64-json' })
    ).resolves.toBe('Invalid local test provider data');
  });
});
