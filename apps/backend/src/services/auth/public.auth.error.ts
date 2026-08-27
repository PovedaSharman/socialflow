export type PublicAuthAction = 'register' | 'login';

const messages: Record<PublicAuthAction, string> = {
  register:
    'Unable to create the account. Sign in or reset your password if you may already be registered.',
  login: 'Invalid email or password.',
};

export function publicAuthError(action: PublicAuthAction) {
  return messages[action];
}
