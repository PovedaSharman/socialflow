import { brandConfig } from './brand';

const originalEnvironment = process.env;

describe('brandConfig', () => {
  beforeEach(() => {
    process.env = { ...originalEnvironment };
    delete process.env.NEXT_PUBLIC_BRAND_NAME;
    delete process.env.NEXT_PUBLIC_BRAND_PRIMARY;
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('uses the replaceable working brand defaults', () => {
    expect(brandConfig()).toMatchObject({
      name: 'SocialFlow',
      primary: '#4F46E5',
      termsUrl: '/legal/terms',
      privacyUrl: '/legal/privacy',
    });
  });

  it('accepts configured branding and rejects unsafe colour values', () => {
    process.env.NEXT_PUBLIC_BRAND_NAME = 'Acme Social';
    process.env.NEXT_PUBLIC_BRAND_PRIMARY = 'red; background: url(example)';

    expect(brandConfig()).toMatchObject({
      name: 'Acme Social',
      primary: '#4F46E5',
    });
  });
});
