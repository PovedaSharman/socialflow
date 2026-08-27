import { buildSmtpOptions } from './node.mailer.provider';

describe('buildSmtpOptions', () => {
  it('supports an unauthenticated local SMTP catcher', () => {
    expect(
      buildSmtpOptions({
        EMAIL_HOST: 'localhost',
        EMAIL_PORT: '1025',
        EMAIL_SECURE: 'false',
      })
    ).toEqual({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  });

  it('includes authentication only when both credentials are present', () => {
    expect(
      buildSmtpOptions({
        EMAIL_HOST: 'smtp.example.test',
        EMAIL_PORT: '465',
        EMAIL_SECURE: 'true',
        EMAIL_USER: 'mailer',
        EMAIL_PASS: 'secret',
      })
    ).toEqual({
      host: 'smtp.example.test',
      port: 465,
      secure: true,
      auth: { user: 'mailer', pass: 'secret' },
    });

    expect(
      buildSmtpOptions({
        EMAIL_HOST: 'smtp.example.test',
        EMAIL_PORT: '587',
        EMAIL_SECURE: 'false',
        EMAIL_USER: 'mailer',
      })
    ).not.toHaveProperty('auth');
  });
});
