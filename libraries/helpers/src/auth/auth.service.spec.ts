import { AuthService } from './auth.service';

describe('authentication fingerprints', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'unit-test-secret-with-at-least-32-bytes';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('is deterministic but changes with the protected value', () => {
    const first = AuthService.fingerprint('first-password-hash');

    expect(AuthService.fingerprint('first-password-hash')).toBe(first);
    expect(AuthService.fingerprint('second-password-hash')).not.toBe(first);
  });

  it('compares equal-length fingerprints without accepting other values', () => {
    const first = AuthService.fingerprint('first-password-hash');
    const second = AuthService.fingerprint('second-password-hash');

    expect(AuthService.fingerprintsMatch(first, first)).toBe(true);
    expect(AuthService.fingerprintsMatch(first, second)).toBe(false);
    expect(AuthService.fingerprintsMatch(first, 'short')).toBe(false);
  });
});
