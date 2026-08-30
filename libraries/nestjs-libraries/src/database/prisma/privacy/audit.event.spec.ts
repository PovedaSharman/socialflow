import {
  AUDIT_WRITE_RELIABILITY_POLICY,
  hashAuditIp,
  sanitizeAuditMetadata,
} from './audit.event';

describe('audit event safety', () => {
  const previousKey = process.env.AUDIT_IP_HMAC_KEY;

  afterEach(() => {
    if (previousKey === undefined) {
      delete process.env.AUDIT_IP_HMAC_KEY;
    } else {
      process.env.AUDIT_IP_HMAC_KEY = previousKey;
    }
  });

  it('HMAC-hashes IP addresses with the configured key', () => {
    process.env.AUDIT_IP_HMAC_KEY = 'test-audit-key';
    const first = hashAuditIp('203.0.113.10');
    const second = hashAuditIp('203.0.113.10', 'test-audit-key');
    expect(first).toHaveLength(64);
    expect(first).toBe(second);
    expect(hashAuditIp('203.0.113.10', 'other-key')).not.toBe(first);
  });

  it('does not fall back to unsalted hashing when the key is missing', () => {
    delete process.env.AUDIT_IP_HMAC_KEY;
    expect(hashAuditIp('203.0.113.10')).toBeNull();
    expect(hashAuditIp('203.0.113.10', '')).toBeNull();
    expect(hashAuditIp('')).toBeNull();
  });

  it('drops secret, content and prompt metadata', () => {
    expect(
      sanitizeAuditMetadata({
        reason: 'export',
        password: 'secret',
        content: 'full post body',
        prompt: 'generate a cat',
        authorization: 'Bearer abc',
        count: 3,
      })
    ).toEqual({ reason: 'export', count: 3 });
  });

  it('documents the best-effort audit write policy', () => {
    expect(AUDIT_WRITE_RELIABILITY_POLICY).toMatch(/best-effort/i);
    expect(AUDIT_WRITE_RELIABILITY_POLICY).toMatch(/primary/i);
  });
});
