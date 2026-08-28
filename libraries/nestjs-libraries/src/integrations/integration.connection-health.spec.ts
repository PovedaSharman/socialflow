import { integrationConnectionHealth } from './integration.connection-health';

const now = new Date('2030-01-01T00:00:00.000Z');
const connected = {
  disabled: false,
  refreshNeeded: false,
  inBetweenSteps: false,
};

describe('integration connection health', () => {
  it('prioritises plan, reconnect and incomplete-connection actions', () => {
    expect(
      integrationConnectionHealth({ ...connected, disabled: true }, now)
    ).toMatchObject({ status: 'disabled', requiredAction: 'upgrade' });
    expect(
      integrationConnectionHealth({ ...connected, refreshNeeded: true }, now)
    ).toMatchObject({
      status: 'action_required',
      requiredAction: 'reconnect',
    });
    expect(
      integrationConnectionHealth({ ...connected, inBetweenSteps: true }, now)
    ).toMatchObject({ status: 'connecting', requiredAction: 'continue' });
  });

  it('classifies expired, expiring and healthy credentials', () => {
    expect(
      integrationConnectionHealth(
        { ...connected, tokenExpiration: '2029-12-31T23:59:59.000Z' },
        now
      )
    ).toMatchObject({ status: 'action_required' });
    expect(
      integrationConnectionHealth(
        { ...connected, tokenExpiration: '2030-01-07T00:00:00.000Z' },
        now
      )
    ).toMatchObject({ status: 'expiring', requiredAction: 'reconnect' });
    expect(
      integrationConnectionHealth(
        { ...connected, tokenExpiration: '2030-02-01T00:00:00.000Z' },
        now
      )
    ).toMatchObject({
      status: 'healthy',
      requiredAction: 'none',
      expiresAt: '2030-02-01T00:00:00.000Z',
    });
  });

  it('fails closed when a supplied expiry is malformed', () => {
    expect(
      integrationConnectionHealth(
        { ...connected, tokenExpiration: 'not-a-date' },
        now
      )
    ).toMatchObject({
      status: 'action_required',
      requiredAction: 'reconnect',
      expiresAt: null,
    });
  });
});
