import {
  API_CREDENTIAL_PREFIX,
  createApiCredentialSecret,
  hashApiCredentialSecret,
  resolveApiCredentialScopes,
} from './api.credential.secret';
import { DEFAULT_MCP_SCOPES } from '@gitroom/nestjs-libraries/chat/mcp.scopes';

describe('API credential secrets', () => {
  it('creates a prefixed secret with a stable hash', () => {
    const created = createApiCredentialSecret();
    expect(created.secret.startsWith(API_CREDENTIAL_PREFIX)).toBe(true);
    expect(created.prefix).toBe(created.secret.slice(0, 12));
    expect(hashApiCredentialSecret(created.secret)).toBe(created.secretHash);
  });

  it('defaults scopes when none are supplied', () => {
    expect(resolveApiCredentialScopes(undefined)).toEqual([
      ...DEFAULT_MCP_SCOPES,
    ]);
    expect(resolveApiCredentialScopes(['posts:publish'])).toEqual([
      'posts:publish',
    ]);
  });
});
