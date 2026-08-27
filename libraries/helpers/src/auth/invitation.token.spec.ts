import {
  createInvitationToken,
  hashInvitationToken,
} from './invitation.token';

describe('team invitation tokens', () => {
  it('creates independent high-entropy URL-safe values', () => {
    const first = createInvitationToken();
    const second = createInvitationToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
  });

  it('stores a deterministic hash rather than the raw token', () => {
    const token = createInvitationToken();
    const hash = hashInvitationToken(token);

    expect(hash).toHaveLength(43);
    expect(hash).not.toBe(token);
    expect(hashInvitationToken(token)).toBe(hash);
  });
});
