const MAX_ERROR_MESSAGE_LENGTH = 1_000;
const MAX_ATTEMPTS = 50;
const bounded = (value: unknown, length: number) =>
  String(value || '').slice(0, length);

const redactSecrets = (value: string) =>
  value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(
      /((?:access[_-]?token|refresh[_-]?token|client[_-]?secret|api[_-]?key)["']?\s*[:=]\s*["']?)[^\s,"'&}]+/gi,
      '$1[REDACTED]'
    );

export function safePostErrorMessage(error: unknown) {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : 'Publishing failed';

  return redactSecrets(message).slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

export function safePostErrorContext(body: unknown) {
  const attempts = (Array.isArray(body) ? body : [body])
    .slice(0, MAX_ATTEMPTS)
    .filter((attempt): attempt is Record<string, unknown> =>
      Boolean(attempt && typeof attempt === 'object')
    )
    .map((attempt) => {
      const integration =
        attempt.integration && typeof attempt.integration === 'object'
          ? (attempt.integration as Record<string, unknown>)
          : undefined;
      return {
        postId: bounded(attempt.id, 128),
        integrationId: bounded(attempt.integrationId || integration?.id, 128),
        provider: bounded(integration?.providerIdentifier, 64),
        state: bounded(attempt.state, 32),
        kind: attempt.parentPostId ? 'comment' : 'root',
      };
    });

  return JSON.stringify({ version: 1, attempts });
}
