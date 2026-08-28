import { createHash } from 'node:crypto';

export type PublicationIdentity = {
  id: string;
  organizationId: string;
  integrationId: string;
  publishDate: Date | string;
  releaseId?: string | null;
};

export const publicationIdempotencyKey = (post: PublicationIdentity) => {
  const publishDate = new Date(post.publishDate);
  if (Number.isNaN(publishDate.getTime())) {
    throw new Error('A valid publication date is required.');
  }

  const digest = createHash('sha256')
    .update(
      [
        'socialflow-publication-v1',
        post.organizationId,
        post.integrationId,
        post.id,
        publishDate.toISOString(),
        post.releaseId || 'initial',
      ].join('\u0000')
    )
    .digest('base64url');

  return `sfpub:v1:${digest}`;
};
