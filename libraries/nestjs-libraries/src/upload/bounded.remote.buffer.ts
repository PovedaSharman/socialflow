const MIB = 1024 * 1024;
const DEFAULT_REMOTE_MEDIA_MAX_BYTES = 64 * MIB;
const ABSOLUTE_REMOTE_MEDIA_MAX_BYTES = 256 * MIB;

export function remoteMediaMaxBytes(env = process.env): number {
  const configured = Number(env.REMOTE_MEDIA_MAX_BYTES);
  if (!Number.isSafeInteger(configured) || configured <= 0) {
    return DEFAULT_REMOTE_MEDIA_MAX_BYTES;
  }
  return Math.min(configured, ABSOLUTE_REMOTE_MEDIA_MAX_BYTES);
}

/**
 * Read a fetch response with a hard streaming limit. Content-Length is only an
 * early rejection: every received chunk is counted because the header can be
 * absent or dishonest.
 */
export async function readBoundedResponseBuffer(
  response: Response,
  maxBytes = remoteMediaMaxBytes()
): Promise<Buffer> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error('Invalid remote media byte limit.');
  }

  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel();
    throw new Error(`Remote media exceeds the ${maxBytes} byte limit.`);
  }
  if (!response.body) {
    throw new Error('Remote media response has no body.');
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('remote media byte limit exceeded');
        throw new Error(`Remote media exceeds the ${maxBytes} byte limit.`);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, total);
}
