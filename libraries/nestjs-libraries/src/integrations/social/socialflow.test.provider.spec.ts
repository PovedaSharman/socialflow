import { SocialFlowTestProvider } from './socialflow.test.provider';
import { publicationIdempotencyKey } from './publication.idempotency';

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

    const idempotencyKey = publicationIdempotencyKey({
      id: 'post-id',
      organizationId: 'organization-id',
      integrationId: 'integration-id',
      publishDate: '2030-01-01T10:00:00.000Z',
    });
    const details = [
      {
        id: 'post-id',
        idempotencyKey,
        message: 'Safe local post',
        settings: {},
      },
    ];
    const first = await provider.post(
      'integration-id',
      'ignored',
      details,
      {} as never
    );
    const retry = await provider.post(
      'integration-id',
      'ignored',
      details,
      {} as never
    );

    expect(first).toEqual([
      {
        id: 'post-id',
        postId: `local-${idempotencyKey}`,
        releaseURL: `socialflow-test://posts/local-${idempotencyKey}`,
        status: 'completed',
      },
    ]);
    expect(retry).toEqual(first);
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
