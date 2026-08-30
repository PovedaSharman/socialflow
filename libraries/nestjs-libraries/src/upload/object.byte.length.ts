import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { resolveTrustedByteLength } from '@gitroom/nestjs-libraries/database/prisma/media/storage.quota';

/**
 * Resolve a trusted ContentLength for an already-uploaded object.
 * Never buffers the object body.
 */
export async function resolveObjectByteLength(
  filePath: string
): Promise<number | null> {
  const key = filePath?.split('/').pop();
  if (!key) {
    return null;
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKey = process.env.CLOUDFLARE_ACCESS_KEY;
  const secretKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_BUCKETNAME;

  if (!accountId || !accessKey || !secretKey || !bucket) {
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  try {
    const head = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return resolveTrustedByteLength(head.ContentLength);
  } catch {
    return null;
  }
}
