import crypto from 'node:crypto';

export function createInvitationToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashInvitationToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('base64url');
}
