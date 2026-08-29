import { hashAuditIp, sanitizeAuditMetadata } from './audit.event';

describe('audit event safety', () => {
  it('hashes IP addresses and drops secret or content metadata', () => {
    expect(hashAuditIp('203.0.113.10')).toHaveLength(64);
    expect(
      sanitizeAuditMetadata({
        reason: 'export',
        password: 'secret',
        content: 'full post body',
        count: 3,
      })
    ).toEqual({ reason: 'export', count: 3 });
  });
});
