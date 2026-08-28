import { publicationIdempotencyKey } from './publication.idempotency';

const identity = {
  id: 'post-a',
  organizationId: 'organization-a',
  integrationId: 'integration-a',
  publishDate: '2030-01-01T10:00:00.000Z',
  releaseId: null,
};

describe('publication idempotency key', () => {
  it('is deterministic and contains no tenant or post identifiers', () => {
    const first = publicationIdempotencyKey(identity);
    const second = publicationIdempotencyKey({ ...identity });

    expect(first).toBe(second);
    expect(first).toMatch(/^sfpub:v1:[A-Za-z0-9_-]{43}$/);
    expect(first).not.toContain(identity.organizationId);
    expect(first).not.toContain(identity.id);
  });

  it('changes for another tenant, channel, schedule or repeat occurrence', () => {
    const original = publicationIdempotencyKey(identity);
    const variants = [
      { ...identity, organizationId: 'organization-b' },
      { ...identity, integrationId: 'integration-b' },
      { ...identity, publishDate: '2030-01-01T11:00:00.000Z' },
      { ...identity, releaseId: 'previous-platform-post' },
    ];

    expect(variants.map(publicationIdempotencyKey)).not.toContain(original);
    expect(new Set(variants.map(publicationIdempotencyKey))).toHaveSize(4);
  });

  it('fails closed for an invalid publication date', () => {
    expect(() =>
      publicationIdempotencyKey({ ...identity, publishDate: 'invalid' })
    ).toThrow('A valid publication date is required.');
  });
});
