import {
  canApproveContent,
  canEditContent,
  canManageOrganization,
  normalizeOrganizationRole,
  roleRank,
} from './organization.role';

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

  it('maps legacy roles to their least-surprising current equivalents', () => {
    expect(normalizeOrganizationRole('SUPERADMIN')).toBe('OWNER');
    expect(normalizeOrganizationRole('USER')).toBe('EDITOR');
    expect(normalizeOrganizationRole('unexpected' as never)).toBe('VIEWER');
  });

  it('separates approval, editing and read-only access', () => {
    expect(canApproveContent('APPROVER')).toBe(true);
    expect(canApproveContent('EDITOR')).toBe(false);
    expect(canEditContent('EDITOR')).toBe(true);
    expect(canEditContent('USER')).toBe(true);
    expect(canEditContent('VIEWER')).toBe(false);
    expect(roleRank('OWNER')).toBeGreaterThan(roleRank('ADMIN'));
    expect(roleRank('ADMIN')).toBeGreaterThan(roleRank('APPROVER'));
    expect(roleRank('APPROVER')).toBeGreaterThan(roleRank('EDITOR'));
    expect(roleRank('EDITOR')).toBeGreaterThan(roleRank('VIEWER'));
  });
});
