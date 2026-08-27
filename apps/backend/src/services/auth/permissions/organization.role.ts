export type OrganizationRole =
  | 'OWNER'
  | 'ADMIN'
  | 'APPROVER'
  | 'EDITOR'
  | 'VIEWER'
  | 'SUPERADMIN'
  | 'USER';

export function canManageOrganization(role: OrganizationRole) {
  return role === 'OWNER' || role === 'ADMIN' || role === 'SUPERADMIN';
}
