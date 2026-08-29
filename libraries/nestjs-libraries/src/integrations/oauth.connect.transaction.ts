import { randomBytes } from 'node:crypto';
import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';

const OAUTH_TRANSACTION_TTL_SECONDS = 10 * 60;

export type OAuthConnectTransaction = {
  version: 1;
  provider: string;
  organizationId: string;
  initiatedByUserId?: string;
  codeVerifier: string;
  externalDetails?: string;
  refreshId?: string;
  onboarding?: boolean;
  redirectUrl?: string;
  webhookUrl?: string;
  flow: 'user' | 'enterprise';
};

export type PublicProviderContinuation = {
  version: 1;
  provider: string;
  organizationId: string;
  integrationId: string;
};

export function validateOAuthRedirectUrl(
  value: string | undefined,
  options: {
    flow: 'user' | 'enterprise';
    frontendUrl: string | undefined;
    nodeEnv: string | undefined;
  }
) {
  if (!value) {
    return undefined;
  }

  if (options.flow === 'user' && value === 'postiz://integrations') {
    return value;
  }

  let frontend: URL | undefined;
  try {
    frontend = options.frontendUrl ? new URL(options.frontendUrl) : undefined;
  } catch {
    frontend = undefined;
  }

  try {
    const redirect = new URL(value, frontend);
    if (
      options.flow === 'user' &&
      frontend &&
      redirect.origin === frontend.origin &&
      ['http:', 'https:'].includes(redirect.protocol)
    ) {
      return redirect.toString();
    }

    if (
      options.flow === 'enterprise' &&
      (redirect.protocol === 'https:' ||
        (options.nodeEnv !== 'production' && redirect.protocol === 'http:'))
    ) {
      return redirect.toString();
    }
  } catch {
    // Fall through to the stable public error below.
  }

  throw new Error('Invalid OAuth return URL');
}

const oauthTransactionKey = (provider: string, state: string) =>
  `oauth-connect:v1:${provider}:${state}`;

const continuationKey = (token: string) =>
  `oauth-connect-continuation:v1:${token}`;

export function hardenOAuthState(input: { url: string; state: string }) {
  const state = randomBytes(32).toString('base64url');

  if (input.url === input.state) {
    return { url: state, state };
  }

  if (input.url.endsWith(`||${input.state}`)) {
    return {
      url: `${input.url.slice(0, -input.state.length)}${state}`,
      state,
    };
  }

  try {
    const url = new URL(input.url);
    if (url.searchParams.has('state')) {
      url.searchParams.set('state', state);
      return { url: url.toString(), state };
    }

    const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
    if (fragment.has('state')) {
      fragment.set('state', state);
      url.hash = fragment.toString();
      return { url: url.toString(), state };
    }
  } catch {
    // Some custom providers return a non-URL nonce. The equality case above
    // handles those; opaque OAuth 1.0 authorization URLs remain unchanged.
  }

  return input;
}

async function consumeJson<T>(key: string): Promise<T | undefined> {
  const value = await ioRedis.getdel(key);
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export async function createOAuthConnectTransaction(
  state: string,
  transaction: OAuthConnectTransaction
) {
  if (!state || state.length > 512) {
    throw new Error('Invalid OAuth state');
  }

  const result = await ioRedis.set(
    oauthTransactionKey(transaction.provider, state),
    JSON.stringify(transaction),
    'EX',
    OAUTH_TRANSACTION_TTL_SECONDS,
    'NX'
  );

  if (result !== 'OK') {
    throw new Error('OAuth state collision');
  }
}

export async function consumeOAuthConnectTransaction(
  provider: string,
  state: string
) {
  if (!state || state.length > 512) {
    return undefined;
  }

  const transaction = await consumeJson<OAuthConnectTransaction>(
    oauthTransactionKey(provider, state)
  );

  if (
    transaction?.version !== 1 ||
    transaction.provider !== provider ||
    !transaction.organizationId ||
    !transaction.codeVerifier
  ) {
    return undefined;
  }

  return transaction;
}

export async function createPublicProviderContinuation(
  continuation: PublicProviderContinuation
) {
  const token = randomBytes(32).toString('base64url');
  const result = await ioRedis.set(
    continuationKey(token),
    JSON.stringify(continuation),
    'EX',
    OAUTH_TRANSACTION_TTL_SECONDS,
    'NX'
  );
  if (result !== 'OK') {
    throw new Error('Continuation token collision');
  }
  return token;
}

export async function consumePublicProviderContinuation(token: string) {
  if (!token || token.length > 128) {
    return undefined;
  }

  const continuation = await consumeJson<PublicProviderContinuation>(
    continuationKey(token)
  );

  if (
    continuation?.version !== 1 ||
    !continuation.provider ||
    !continuation.organizationId ||
    !continuation.integrationId
  ) {
    return undefined;
  }

  return continuation;
}
