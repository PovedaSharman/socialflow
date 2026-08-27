import {
  filterActiveOrganizations,
  selectActiveOrganization,
} from './organization.selection';

const organization = (id: string, disabled = false) => ({
  id,
  users: [{ disabled }],
});

describe('active organization selection', () => {
  it('returns only well-formed active memberships', () => {
    expect(
      filterActiveOrganizations([
        organization('active'),
        organization('disabled', true),
        { id: 'missing-membership', users: [] },
      ])
    ).toEqual([organization('active')]);
  });

  it('uses the first active membership when no organization is requested', () => {
    expect(
      selectActiveOrganization(
        [organization('disabled', true), organization('active')],
        undefined
      )
    ).toMatchObject({ id: 'active' });
  });

  it('selects only an explicitly requested active membership', () => {
    const organizations = [organization('first'), organization('second')];

    expect(selectActiveOrganization(organizations, 'second')).toMatchObject({
      id: 'second',
    });
    expect(selectActiveOrganization(organizations, 'missing')).toBeNull();
    expect(selectActiveOrganization(organizations, ['second'])).toBeNull();
  });

  it('rejects disabled and malformed memberships', () => {
    expect(
      selectActiveOrganization([organization('disabled', true)], 'disabled')
    ).toBeNull();
    expect(
      selectActiveOrganization([{ id: 'malformed', users: [] }], 'malformed')
    ).toBeNull();
  });
});
