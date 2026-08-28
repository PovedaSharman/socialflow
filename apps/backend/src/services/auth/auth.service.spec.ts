import { AuthService } from './auth.service';
import { AuthService as AuthChecker } from '@gitroom/helpers/auth/auth.service';
import { Provider } from '@prisma/client';

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

describe('single-use password reset lifecycle', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'unit-test-secret-with-at-least-32-bytes';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  const resetService = (
    user: Record<string, unknown> | null,
    updatePasswordIfCurrent = jest.fn().mockResolvedValue({ count: 1 })
  ) => ({
    service: new AuthService(
      {
        getUserById: jest.fn().mockResolvedValue(user),
        updatePasswordIfCurrent,
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    ),
    updatePasswordIfCurrent,
  });

  const validReset = (password: string) => ({
    id: 'user-a',
    expiresAt: Date.now() + 60_000,
    passwordVersion: AuthChecker.fingerprint(password),
  });

  it('rejects malformed and expired reset claims before loading a user', async () => {
    const getUserById = jest.fn();
    const service = new AuthService(
      { getUserById } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );
    jest.spyOn(AuthChecker, 'verifyJWT').mockReturnValue({
      ...validReset('current-hash'),
      expiresAt: Date.now() - 1,
    });

    await expect(
      service.forgotReturn({
        token: 'expired',
        password: 'new-password',
        repeatPassword: 'new-password',
      })
    ).resolves.toBe(false);
    expect(getUserById).not.toHaveBeenCalled();
  });

  it('rejects password resets for non-local users', async () => {
    jest
      .spyOn(AuthChecker, 'verifyJWT')
      .mockReturnValue(validReset('current-hash'));
    const { service, updatePasswordIfCurrent } = resetService({
      id: 'user-a',
      password: 'current-hash',
      providerName: Provider.GENERIC,
    });

    await expect(
      service.forgotReturn({
        token: 'provider',
        password: 'new-password',
        repeatPassword: 'new-password',
      })
    ).resolves.toBe(false);
    expect(updatePasswordIfCurrent).not.toHaveBeenCalled();
  });

  it('rejects a stale password fingerprint', async () => {
    jest
      .spyOn(AuthChecker, 'verifyJWT')
      .mockReturnValue(validReset('different-hash'));
    const { service, updatePasswordIfCurrent } = resetService({
      id: 'user-a',
      password: 'current-hash',
      providerName: Provider.LOCAL,
    });

    await expect(
      service.forgotReturn({
        token: 'stale',
        password: 'new-password',
        repeatPassword: 'new-password',
      })
    ).resolves.toBe(false);
    expect(updatePasswordIfCurrent).not.toHaveBeenCalled();
  });

  it('uses the current hash as an atomic predicate and accepts the token once', async () => {
    jest
      .spyOn(AuthChecker, 'verifyJWT')
      .mockReturnValue(validReset('current-hash'));
    const updatePasswordIfCurrent = jest
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    const { service } = resetService(
      {
        id: 'user-a',
        password: 'current-hash',
        providerName: Provider.LOCAL,
      },
      updatePasswordIfCurrent
    );
    const body = {
      token: 'single-use',
      password: 'new-password',
      repeatPassword: 'new-password',
    };

    await expect(service.forgotReturn(body)).resolves.toBe(true);
    await expect(service.forgotReturn(body)).resolves.toBe(false);
    expect(updatePasswordIfCurrent).toHaveBeenNthCalledWith(
      1,
      'user-a',
      'current-hash',
      'new-password'
    );
  });
});
