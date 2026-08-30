import { firstValueFrom, of, throwError } from 'rxjs';
import { PublicApiAuditInterceptor } from './public.api.audit.interceptor';

describe('PublicApiAuditInterceptor', () => {
  const createAuditEvent = jest.fn().mockResolvedValue(null);
  const interceptor = new PublicApiAuditInterceptor({
    createAuditEvent,
  } as any);
  const request = {
    org: {
      id: 'org-a',
      authKind: 'scoped',
      apiCredentialId: 'credential-a',
    },
    publicApiScopeDecision: {
      action: 'GET /posts',
      required: 'posts:read',
    },
    headers: { 'x-request-id': 'request-a' },
    ip: '192.0.2.1',
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;

  beforeEach(() => createAuditEvent.mockClear());

  it('records success only after the handler succeeds', async () => {
    await expect(
      firstValueFrom(interceptor.intercept(context, { handle: () => of('ok') }))
    ).resolves.toBe('ok');
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'success', organizationId: 'org-a' })
    );
  });

  it('records failure and preserves the original handler error', async () => {
    const error = Object.assign(new Error('failed'), { status: 422 });
    await expect(
      firstValueFrom(
        interceptor.intercept(context, {
          handle: () => throwError(() => error),
        })
      )
    ).rejects.toBe(error);
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'failed',
        metadata: expect.objectContaining({ statusCode: 422 }),
      })
    );
  });
});
