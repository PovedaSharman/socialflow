import { canManageOrganization } from './organization.role';

describe('organization role permissions', () => {
  it.each(['OWNER', 'ADMIN', 'SUPERADMIN'] as const)(
    'allows %s to administer a workspace',
    (role) => {
      expect(canManageOrganization(role)).toBe(true);
    }
  );

  it.each(['APPROVER', 'EDITOR', 'VIEWER', 'USER'] as const)(
    'prevents %s from administering a workspace',
    (role) => {
      expect(canManageOrganization(role)).toBe(false);
    }
  );
});
