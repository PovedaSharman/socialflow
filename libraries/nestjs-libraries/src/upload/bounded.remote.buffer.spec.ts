import {
  readBoundedResponseBuffer,
  remoteMediaMaxBytes,
} from './bounded.remote.buffer';

function responseFromChunks(chunks: number[][], contentLength?: number) {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(Uint8Array.from(chunk));
        controller.close();
      },
    }),
    {
      headers:
        contentLength === undefined
          ? undefined
          : { 'content-length': String(contentLength) },
    }
  );
}

describe('bounded remote media buffering', () => {
  it('combines chunks below the limit', async () => {
    await expect(
      readBoundedResponseBuffer(responseFromChunks([[1, 2], [3]]), 3)
    ).resolves.toEqual(Buffer.from([1, 2, 3]));
  });

  it('rejects a declared oversized response before reading it', async () => {
    await expect(
      readBoundedResponseBuffer(responseFromChunks([[1]], 10), 5)
    ).rejects.toThrow('exceeds the 5 byte limit');
  });

  it('rejects a chunked response that crosses the real byte limit', async () => {
    await expect(
      readBoundedResponseBuffer(
        responseFromChunks([
          [1, 2],
          [3, 4],
        ]),
        3
      )
    ).rejects.toThrow('exceeds the 3 byte limit');
  });

  it('uses a safe default and caps configured values', () => {
    expect(remoteMediaMaxBytes({} as NodeJS.ProcessEnv)).toBe(64 * 1024 * 1024);
    expect(
      remoteMediaMaxBytes({
        REMOTE_MEDIA_MAX_BYTES: String(1024 * 1024 * 1024),
      } as NodeJS.ProcessEnv)
    ).toBe(256 * 1024 * 1024);
  });
});
