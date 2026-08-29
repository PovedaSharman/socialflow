import {
  safePostErrorContext,
  safePostErrorMessage,
} from './post.error-history';

describe('post error history safety', () => {
  it('redacts common credential forms and bounds messages', () => {
    const message = safePostErrorMessage(
      `Bearer secret-token access_token=also-secret ${'x'.repeat(2_000)}`
    );
    expect(message).not.toContain('secret-token');
    expect(message).not.toContain('also-secret');
    expect(message.length).toBeLessThanOrEqual(1_000);
  });

  it('keeps recovery identifiers without post content or credentials', () => {
    const context = safePostErrorContext([
      {
        id: 'post-1',
        integrationId: 'integration-1',
        state: 'QUEUE',
        content: 'private customer content',
        image: '[private media]',
        integration: {
          id: 'integration-1',
          providerIdentifier: 'linkedin',
          token: 'secret-token',
        },
      },
    ]);
    expect(JSON.parse(context)).toEqual({
      version: 1,
      attempts: [
        {
          postId: 'post-1',
          integrationId: 'integration-1',
          provider: 'linkedin',
          state: 'QUEUE',
          kind: 'root',
        },
      ],
    });
    expect(context).not.toContain('private customer content');
    expect(context).not.toContain('secret-token');
  });

  it('bounds channel/comment attempt metadata', () => {
    const context = JSON.parse(
      safePostErrorContext(
        Array.from({ length: 75 }, (_, index) => ({
          id: `post-${index}`,
          parentPostId: 'root',
        }))
      )
    );
    expect(context.attempts).toHaveLength(50);
    expect(context.attempts[0].kind).toBe('comment');
    expect(
      JSON.parse(safePostErrorContext([{ id: 'x'.repeat(500) }])).attempts[0]
        .postId
    ).toHaveLength(128);
  });
});
