import { AuthService } from './auth.service';

const createService = (resolveTeamInvitation: jest.Mock) =>
  new AuthService(
    {} as never,
    { resolveTeamInvitation } as never,
    {} as never,
    {} as never,
    {} as never
  );

describe('authentication team invitations', () => {
  it('passes only an opaque token into the authentication flow', async () => {
    const resolveTeamInvitation = jest.fn().mockResolvedValue({
      id: 'invitation-id',
      organizationId: 'organization-id',
    });
    const service = createService(resolveTeamInvitation);

    await expect(service.getOrgFromCookie('opaque-token')).resolves.toEqual({
      token: 'opaque-token',
    });
    expect(resolveTeamInvitation).toHaveBeenCalledWith('opaque-token');
  });

  it('fails closed when a token is absent, invalid, or cannot be resolved', async () => {
    const resolveTeamInvitation = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('database unavailable'));
    const service = createService(resolveTeamInvitation);

    await expect(service.getOrgFromCookie()).resolves.toBe(false);
    await expect(service.getOrgFromCookie('invalid')).resolves.toBe(false);
    await expect(service.getOrgFromCookie('unavailable')).resolves.toBe(false);
  });
});
