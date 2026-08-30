import {
  evaluatePublicApiScope,
  requiredScopeForPostType,
  requiredScopeForPublicRequest,
} from './public.api.scopes';

describe('public API scopes', () => {
  it('maps post types to write scopes and denies unknown types', () => {
    expect(requiredScopeForPostType('draft')).toBe('posts:draft');
    expect(requiredScopeForPostType('schedule')).toBe('posts:schedule');
    expect(requiredScopeForPostType('now')).toBe('posts:publish');
    expect(requiredScopeForPostType('tomorrow')).toBeUndefined();
    expect(requiredScopeForPostType(undefined)).toBeUndefined();
  });

  it('maps routes to the documented scopes', () => {
    expect(
      requiredScopeForPublicRequest({ method: 'GET', path: '/public/v1/posts' })
    ).toBe('posts:read');
    expect(
      requiredScopeForPublicRequest({
        method: 'GET',
        path: '/public/v1/integrations',
      })
    ).toBe('channels:read');
    expect(
      requiredScopeForPublicRequest({
        method: 'POST',
        path: '/public/v1/upload',
      })
    ).toBe('posts:draft');
    expect(
      requiredScopeForPublicRequest({
        method: 'POST',
        path: '/public/v1/generate-video',
      })
    ).toBe('media:generate');
    expect(
      requiredScopeForPublicRequest({
        method: 'DELETE',
        path: '/public/v1/integrations/abc',
      })
    ).toBe('posts:publish');
    expect(
      requiredScopeForPublicRequest({
        method: 'DELETE',
        path: '/public/v1/posts/abc',
      })
    ).toBe('posts:draft');
    expect(
      requiredScopeForPublicRequest({
        method: 'PUT',
        path: '/public/v1/posts/abc/status',
        body: { status: 'draft' },
      })
    ).toBe('posts:draft');
    expect(
      requiredScopeForPublicRequest({
        method: 'PUT',
        path: '/public/v1/posts/abc/status',
        body: { status: 'schedule' },
      })
    ).toBe('posts:schedule');
    expect(
      requiredScopeForPublicRequest({
        method: 'PUT',
        path: '/public/v1/posts/abc/status',
        body: { status: 'unknown' },
      })
    ).toBeUndefined();
  });

  it('denies read-only credentials for writes, uploads, generation and deletion', () => {
    const readOnly = {
      organizationId: 'org-a',
      mcpScopes: ['channels:read', 'posts:read', 'audit:read'],
      authKind: 'scoped' as const,
    };

    expect(
      evaluatePublicApiScope({
        method: 'POST',
        path: '/public/v1/posts',
        body: { type: 'draft' },
        auth: readOnly,
      }).allowed
    ).toBe(false);

    expect(
      evaluatePublicApiScope({
        method: 'PUT',
        path: '/public/v1/posts/x/status',
        body: { status: 'schedule' },
        auth: {
          organizationId: 'org-a',
          mcpScopes: ['posts:draft'],
        },
      })
    ).toMatchObject({
      allowed: false,
      required: 'posts:schedule',
      reason: 'missing_scope',
    });

    expect(
      evaluatePublicApiScope({
        method: 'POST',
        path: '/public/v1/posts',
        body: { type: 'schedule' },
        auth: readOnly,
      }).allowed
    ).toBe(false);

    expect(
      evaluatePublicApiScope({
        method: 'POST',
        path: '/public/v1/posts',
        body: { type: 'now' },
        auth: readOnly,
      }).allowed
    ).toBe(false);

    expect(
      evaluatePublicApiScope({
        method: 'POST',
        path: '/public/v1/upload',
        auth: readOnly,
      }).allowed
    ).toBe(false);

    expect(
      evaluatePublicApiScope({
        method: 'POST',
        path: '/public/v1/generate-video',
        auth: readOnly,
      }).allowed
    ).toBe(false);

    expect(
      evaluatePublicApiScope({
        method: 'DELETE',
        path: '/public/v1/integrations/x',
        auth: readOnly,
      }).allowed
    ).toBe(false);
  });

  it('allows matching scopes and denies cross-scope and malformed context', () => {
    expect(
      evaluatePublicApiScope({
        method: 'POST',
        path: '/public/v1/posts',
        body: { type: 'draft' },
        auth: {
          organizationId: 'org-a',
          mcpScopes: ['posts:draft'],
        },
      })
    ).toMatchObject({ allowed: true, required: 'posts:draft' });

    expect(
      evaluatePublicApiScope({
        method: 'POST',
        path: '/public/v1/posts',
        body: { type: 'now' },
        auth: {
          organizationId: 'org-a',
          mcpScopes: ['posts:schedule'],
        },
      }).allowed
    ).toBe(false);

    expect(
      evaluatePublicApiScope({
        method: 'GET',
        path: '/public/v1/posts',
        auth: { organizationId: 'org-a', mcpScopes: 'posts:read' as any },
      }).reason
    ).toBe('missing_scopes');

    expect(
      evaluatePublicApiScope({
        method: 'GET',
        path: '/public/v1/posts',
        auth: null,
      }).reason
    ).toBe('missing_organisation');
  });
});
