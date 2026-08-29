import {
  getMissingSocialProviderConfiguration,
  isSocialProviderAvailable,
} from './social.provider.availability';

describe('social provider availability', () => {
  it('keeps normal adapters available for development', () => {
    expect(
      isSocialProviderAvailable('linkedin', { NODE_ENV: 'development' })
    ).toBe(true);
  });

  it('requires an exact production allowlist entry and configuration', () => {
    const env = {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://socialflow.example',
      SOCIAL_PROVIDER_ALLOWLIST: 'linkedin',
      LINKEDIN_CLIENT_ID: 'client',
      LINKEDIN_CLIENT_SECRET: 'secret',
    };
    expect(isSocialProviderAvailable('linkedin', env)).toBe(true);
    expect(isSocialProviderAvailable('linkedin-page', env)).toBe(false);
    expect(isSocialProviderAvailable('reddit', env)).toBe(false);
  });

  it('fails closed when a required credential is blank', () => {
    const env = {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://socialflow.example',
      SOCIAL_PROVIDER_ALLOWLIST: 'linkedin',
      LINKEDIN_CLIENT_ID: 'client',
      LINKEDIN_CLIENT_SECRET: '   ',
    };
    expect(isSocialProviderAvailable('linkedin', env)).toBe(false);
    expect(getMissingSocialProviderConfiguration('linkedin', env)).toEqual([
      'LINKEDIN_CLIENT_SECRET',
    ]);
  });

  it('supports explicit alternative Google credential pairs', () => {
    const env = {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://socialflow.example',
      SOCIAL_PROVIDER_ALLOWLIST: 'gmb',
      YOUTUBE_CLIENT_ID: 'client',
      YOUTUBE_CLIENT_SECRET: 'secret',
    };
    expect(isSocialProviderAvailable('gmb', env)).toBe(true);
  });

  it('never enables the test provider in production', () => {
    expect(
      isSocialProviderAvailable('socialflow-test', {
        NODE_ENV: 'production',
        ENABLE_TEST_PROVIDER: 'true',
        SOCIAL_PROVIDER_ALLOWLIST: 'socialflow-test',
      })
    ).toBe(false);
  });
});
