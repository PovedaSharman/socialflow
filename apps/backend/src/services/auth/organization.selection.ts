export type OrganizationMembership = {
  disabled: boolean;
};

export type MembershipScopedOrganization = {
  id: string;
  users: OrganizationMembership[];
};

export function filterActiveOrganizations<
  T extends MembershipScopedOrganization,
>(organizations: T[]): T[] {
  return organizations.filter(
    (organization) =>
      organization.users.length === 1 && !organization.users[0].disabled
  );
}

export function selectActiveOrganization<
  T extends MembershipScopedOrganization,
>(organizations: T[], requestedOrganization: unknown): T | null {
  const activeOrganizations = filterActiveOrganizations(organizations);

  if (activeOrganizations.length === 0) {
    return null;
  }

  if (requestedOrganization === undefined || requestedOrganization === null) {
    return activeOrganizations[0];
  }

  if (
    typeof requestedOrganization !== 'string' ||
    requestedOrganization.length === 0
  ) {
    return null;
  }

  return (
    activeOrganizations.find(
      (organization) => organization.id === requestedOrganization
    ) ?? null
  );
}
