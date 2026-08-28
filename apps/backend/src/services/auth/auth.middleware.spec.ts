import { AuthService } from '@gitroom/helpers/auth/auth.service';
import { AuthMiddleware } from './auth.middleware';

const activeOrganization = (id = 'organization-a') => ({
  id,
  apiKey: 'api-key',
  users: [{ userId: 'user-a', disabled: false, role: 'EDITOR' }],
});

const request = (overrides: Record<string, unknown> = {}) =>
  ({
    headers: { auth: 'signed-token' },
    cookies: {},
    ...overrides,
  } as any);

const createMiddleware = ({
  user = {
    id: 'user-a',
    activated: true,
    isSuperAdmin: false,
    password: 'password-hash',
  },
  organizations = [activeOrganization()],
  impersonation = null as any,
} = {}) => {
  const organizationService = {
    getOrgsByUserId: jest.fn().mockResolvedValue(organizations),
    getUserOrg: jest.fn().mockResolvedValue(impersonation),
    updateApiKey: jest.fn().mockResolvedValue(undefined),
  };
  const usersService = {
    getUserById: jest.fn().mockResolvedValue(user),
  };
  return {
    middleware: new AuthMiddleware(
      organizationService as never,
      usersService as never
    ),
    organizationService,
    usersService,
  };
};

describe('authenticated tenant boundary', () => {
  beforeEach(() => {
    jest.spyOn(AuthService, 'verifyJWT').mockReturnValue({
      id: 'user-a',
      activated: true,
      isSuperAdmin: true,
    } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('re-resolves the user and rejects forged activation claims', async () => {
    const { middleware, usersService } = createMiddleware({
      user: {
        id: 'user-a',
        activated: false,
        isSuperAdmin: false,
        password: 'password-hash',
      },
    });

    await expect(
      middleware.use(request(), {} as any, jest.fn())
    ).rejects.toBeDefined();
    expect(usersService.getUserById).toHaveBeenCalledWith('user-a');
  });

  it('rejects an explicitly requested organization outside the membership set', async () => {
    const { middleware } = createMiddleware();
    const req = request({
      headers: { auth: 'signed-token', showorg: 'organization-b' },
    });

    await expect(
      middleware.use(req, {} as any, jest.fn())
    ).rejects.toBeDefined();
    expect(req.org).toBeUndefined();
  });

  it('rejects disabled and malformed memberships', async () => {
    const disabled = activeOrganization();
    disabled.users[0].disabled = true;
    const { middleware } = createMiddleware({
      organizations: [disabled, { ...activeOrganization(), users: [] }],
    });

    await expect(
      middleware.use(request(), {} as any, jest.fn())
    ).rejects.toBeDefined();
  });

  it('attaches only the selected active organization and strips the password', async () => {
    const next = jest.fn();
    const req = request();
    const { middleware, organizationService } = createMiddleware();

    await middleware.use(req, {} as any, next);

    expect(req.org).toMatchObject({ id: 'organization-a' });
    expect(req.org.users).toEqual([
      expect.objectContaining({ userId: 'user-a', disabled: false }),
    ]);
    expect(req.user.password).toBeUndefined();
    expect(organizationService.updateApiKey).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not use a disabled support impersonation membership', async () => {
    const { middleware, organizationService } = createMiddleware({
      user: {
        id: 'support-user',
        activated: true,
        isSuperAdmin: true,
        password: 'password-hash',
      },
      organizations: [],
      impersonation: {
        disabled: true,
        user: { id: 'target-user' },
        organization: activeOrganization('organization-b'),
      },
    });
    const req = request({
      cookies: { impersonate: 'target-membership' },
    });

    await expect(
      middleware.use(req, {} as any, jest.fn())
    ).rejects.toBeDefined();
    expect(organizationService.getUserOrg).toHaveBeenCalledWith(
      'target-membership'
    );
    expect(req.org).toBeUndefined();
  });

  it('limits enabled impersonation to the target membership', async () => {
    const targetOrganization = activeOrganization('organization-b');
    targetOrganization.users.push({
      userId: 'unrelated-user',
      disabled: false,
      role: 'OWNER',
    });
    const { middleware } = createMiddleware({
      user: {
        id: 'support-user',
        activated: true,
        isSuperAdmin: true,
        password: 'password-hash',
      },
      impersonation: {
        disabled: false,
        user: {
          id: 'user-a',
          activated: true,
          isSuperAdmin: false,
          password: 'password-hash',
        },
        organization: targetOrganization,
      },
    });
    const req = request({
      cookies: { impersonate: 'target-membership' },
    });
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(req.org.id).toBe('organization-b');
    expect(req.org.users).toHaveLength(1);
    expect(req.org.users[0].userId).toBe('user-a');
    expect(req.user.password).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
