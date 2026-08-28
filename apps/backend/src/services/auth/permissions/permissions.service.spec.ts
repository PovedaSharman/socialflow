import { PermissionsService, roleCanAccess } from './permissions.service';
import { AuthorizationActions, Sections } from './permission.exception.class';

describe('permissions without billing', () => {
  const originalStripeKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const service = new PermissionsService(
    null as never,
    null as never,
    null as never,
    null as never
  );

  beforeEach(() => {
    delete process.env.STRIPE_PUBLISHABLE_KEY;
  });

  afterAll(() => {
    if (originalStripeKey === undefined) {
      delete process.env.STRIPE_PUBLISHABLE_KEY;
    } else {
      process.env.STRIPE_PUBLISHABLE_KEY = originalStripeKey;
    }
  });

  it('does not turn disabled billing into administrator access', async () => {
    const ability = await service.check('organization', new Date(), 'USER', [
      [AuthorizationActions.Create, Sections.ADMIN],
    ]);

    expect(ability.can(AuthorizationActions.Create, Sections.ADMIN)).toBe(
      false
    );
  });

  it('retains administrator access independently of billing', async () => {
    const ability = await service.check('organization', new Date(), 'ADMIN', [
      [AuthorizationActions.Create, Sections.ADMIN],
    ]);

    expect(ability.can(AuthorizationActions.Create, Sections.ADMIN)).toBe(true);
  });

  it('keeps viewers read-only and channel administration restricted', () => {
    expect(
      roleCanAccess(
        'VIEWER',
        AuthorizationActions.Read,
        Sections.POSTS_PER_MONTH
      )
    ).toBe(true);
    expect(
      roleCanAccess(
        'VIEWER',
        AuthorizationActions.Create,
        Sections.POSTS_PER_MONTH
      )
    ).toBe(false);
    expect(
      roleCanAccess('EDITOR', AuthorizationActions.Create, Sections.CHANNEL)
    ).toBe(false);
    expect(
      roleCanAccess('ADMIN', AuthorizationActions.Create, Sections.CHANNEL)
    ).toBe(true);
  });

  it('separates editing from approval authority', () => {
    expect(
      roleCanAccess('EDITOR', AuthorizationActions.Update, Sections.CONTENT)
    ).toBe(true);
    expect(
      roleCanAccess('EDITOR', AuthorizationActions.Update, Sections.APPROVAL)
    ).toBe(false);
    expect(
      roleCanAccess('APPROVER', AuthorizationActions.Update, Sections.APPROVAL)
    ).toBe(true);
    expect(
      roleCanAccess('VIEWER', AuthorizationActions.Read, Sections.APPROVAL)
    ).toBe(false);
  });

  it('reserves billing authority for owners', () => {
    expect(
      roleCanAccess('OWNER', AuthorizationActions.Read, Sections.BILLING)
    ).toBe(true);
    expect(
      roleCanAccess('ADMIN', AuthorizationActions.Read, Sections.BILLING)
    ).toBe(false);
    expect(
      roleCanAccess('SUPERADMIN', AuthorizationActions.Update, Sections.BILLING)
    ).toBe(true);
  });
});
