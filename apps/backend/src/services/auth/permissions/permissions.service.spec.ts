import { PermissionsService } from './permissions.service';
import {
  AuthorizationActions,
  Sections,
} from './permission.exception.class';

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
    const ability = await service.check(
      'organization',
      new Date(),
      'USER',
      [[AuthorizationActions.Create, Sections.ADMIN]]
    );

    expect(ability.can(AuthorizationActions.Create, Sections.ADMIN)).toBe(
      false
    );
  });

  it('retains administrator access independently of billing', async () => {
    const ability = await service.check(
      'organization',
      new Date(),
      'ADMIN',
      [[AuthorizationActions.Create, Sections.ADMIN]]
    );

    expect(ability.can(AuthorizationActions.Create, Sections.ADMIN)).toBe(true);
  });
});
