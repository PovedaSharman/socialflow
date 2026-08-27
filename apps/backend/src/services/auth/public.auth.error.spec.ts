import { publicAuthError } from './public.auth.error';

describe('public authentication errors', () => {
  it('does not vary the login response by internal failure reason', () => {
    expect(publicAuthError('login')).toBe('Invalid email or password.');
  });

  it('gives registration recovery without confirming an account exists', () => {
    const message = publicAuthError('register');

    expect(message).toContain('Sign in or reset your password');
    expect(message).not.toContain('exists');
  });
});
