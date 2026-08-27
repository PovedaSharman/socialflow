export type OrganizationRole =
  | 'OWNER'
  | 'ADMIN'
  | 'APPROVER'
  | 'EDITOR'
  | 'VIEWER'
  | 'SUPERADMIN'
  | 'USER';

export type CurrentOrganizationRole =
  | 'OWNER'
  | 'ADMIN'
  | 'APPROVER'
  | 'EDITOR'
  | 'VIEWER';

export function normalizeOrganizationRole(
  role: OrganizationRole
): CurrentOrganizationRole {
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
    case 'APPROVER':
    case 'EDITOR':
    case 'VIEWER':
      return role;
    case 'SUPERADMIN':
      return 'OWNER';
    case 'USER':
      return 'EDITOR';
    default:
      return 'VIEWER';
  }
}

export function roleRank(role: OrganizationRole) {
  const normalized = normalizeOrganizationRole(role);
  return normalized === 'OWNER'
    ? 4
    : normalized === 'ADMIN'
      ? 3
      : normalized === 'APPROVER'
        ? 2
        : normalized === 'EDITOR'
          ? 1
          : 0;
}

export function canManageOrganization(role: OrganizationRole) {
  const normalized = normalizeOrganizationRole(role);
  return normalized === 'OWNER' || normalized === 'ADMIN';
}

export function canManageTeam(role: OrganizationRole) {
  return canManageOrganization(role);
}

export function canEditContent(role: OrganizationRole) {
  return normalizeOrganizationRole(role) !== 'VIEWER';
}

export function canApproveContent(role: OrganizationRole) {
  const normalized = normalizeOrganizationRole(role);
  return (
    normalized === 'OWNER' ||
    normalized === 'ADMIN' ||
    normalized === 'APPROVER'
  );
}
