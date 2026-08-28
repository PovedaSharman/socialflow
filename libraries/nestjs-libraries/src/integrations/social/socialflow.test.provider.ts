import { Integration } from '@prisma/client';
import {
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  SocialProvider,
} from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { SocialAbstract } from '@gitroom/nestjs-libraries/integrations/social.abstract';

const LOCAL_TOKEN = 'socialflow-test-provider-local-only';

/**
 * A development-only provider that never performs an outbound request. It lets
 * the complete connection and publishing workflow run without a platform app,
 * approval or credential.
 */
export class SocialFlowTestProvider
  extends SocialAbstract
  implements SocialProvider
{
  identifier = 'socialflow-test';
  name = 'SocialFlow Test (local only)';
  publicationRetry = 'idempotency-key' as const;
  editor = 'normal' as const;
  isBetweenSteps = false;
  scopes: string[] = [];

  maxLength() {
    return 5_000;
  }

  async customFields() {
    return [
      {
        key: 'displayName',
        label: 'Test account name',
        defaultValue: 'Local test account',
        validation: '/^.{3,64}$/',
        type: 'text' as const,
        hint: 'Local simulation only. Nothing is sent to a social network.',
      },
    ];
  }

  async generateAuthUrl() {
    return {
      url: 'socialflow-test://connect',
      codeVerifier: 'local-only',
      state: 'local-only',
    };
  }

  async authenticate(params: { code: string }) {
    try {
      const input = JSON.parse(Buffer.from(params.code, 'base64').toString());
      const displayName = String(input.displayName || '').trim();
      if (displayName.length < 3 || displayName.length > 64) {
        return 'Test account name must contain 3 to 64 characters';
      }

      return this.token(displayName);
    } catch {
      return 'Invalid local test provider data';
    }
  }

  async refreshToken(): Promise<AuthTokenDetails> {
    return this.token('Local test account');
  }

  async post(
    _id: string,
    _accessToken: string,
    postDetails: PostDetails[],
    _integration: Integration
  ): Promise<PostResponse[]> {
    return postDetails.map((post) => {
      const postId = `local-${post.idempotencyKey}`;
      return {
        id: post.id,
        postId,
        releaseURL: `socialflow-test://posts/${postId}`,
        status: 'completed',
      };
    });
  }

  private token(displayName: string): AuthTokenDetails {
    return {
      id: 'socialflow-local-test-account',
      name: displayName,
      username: 'local-test',
      accessToken: LOCAL_TOKEN,
      refreshToken: LOCAL_TOKEN,
      expiresIn: 100 * 365 * 24 * 60 * 60,
      picture: '',
    };
  }
}
