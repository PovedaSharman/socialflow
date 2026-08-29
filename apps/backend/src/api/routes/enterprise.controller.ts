import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '@gitroom/helpers/auth/auth.service';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { OrganizationService } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import {
  createOAuthConnectTransaction,
  hardenOAuthState,
  validateOAuthRedirectUrl,
} from '@gitroom/nestjs-libraries/integrations/oauth.connect.transaction';

@ApiTags('Enterprise')
@Controller('/enterprise')
export class EnterpriseController {
  constructor(
    private _integrationManager: IntegrationManager,
    private _organizationService: OrganizationService,
    private _integrationService: IntegrationService,
    private _postsService: PostsService
  ) {}

  @Post('/create-user')
  async createUser(@Body('params') params: string) {
    try {
      const { id, name, saasName, email } = AuthService.verifyJWT(params) as {
        id: string;
        name: string;
        email: string;
        saasName: string;
      };

      try {
        return await this._organizationService.createMaxUser(
          id,
          name,
          saasName,
          email
        );
      } catch (err) {
        return { create: false };
      }
    } catch (err) {
      return { success: false };
    }
  }

  @Post('/url')
  async redirectParams(@Body('params') params: string) {
    try {
      const load = AuthService.verifyJWT(params) as {
        redirectUrl: string;
        apiKey: string;
        refreshId?: string;
        provider: string;
        webhookUrl: string;
      };

      if (!load || !load.redirectUrl || !load.apiKey || !load.provider) {
        return;
      }

      const org = await this._organizationService.getOrgByApiKey(load.apiKey);

      if (!org) {
        throw new Error('Organization not found');
      }

      if (
        !this._integrationManager
          .getAllowedSocialsIntegrations()
          .includes(load.provider)
      ) {
        throw new Error('Integration not allowed');
      }

      const integrationProvider = this._integrationManager.getSocialIntegration(
        load.provider
      );

      const generatedAuthUrl = await integrationProvider.generateAuthUrl();
      const { codeVerifier } = generatedAuthUrl;
      const { state, url } = hardenOAuthState(generatedAuthUrl);

      await createOAuthConnectTransaction(state, {
        version: 1,
        provider: load.provider,
        organizationId: org.id,
        codeVerifier,
        refreshId: load.refreshId,
        redirectUrl: validateOAuthRedirectUrl(load.redirectUrl, {
          flow: 'enterprise',
          frontendUrl: process.env.FRONTEND_URL,
          nodeEnv: process.env.NODE_ENV,
        }),
        webhookUrl: load.webhookUrl,
        flow: 'enterprise',
      });

      return url;
    } catch (err) {}
  }

  @Post('/delete-channel')
  async deleteChannel(@Body('params') params: string) {
    try {
      const load = AuthService.verifyJWT(params) as {
        apiKey: string;
        id: string;
      };

      if (!load || !load.apiKey || !load.id) {
        return { success: false };
      }

      const org = await this._organizationService.getOrgByApiKey(load.apiKey);

      if (!org) {
        return { success: false };
      }

      const isTherePosts = await this._integrationService.getPostsForChannel(
        org.id,
        load.id
      );
      if (isTherePosts.length) {
        for (const post of isTherePosts) {
          this._postsService.deletePost(org.id, post.group).catch(() => {});
        }
      }

      await this._integrationService.deleteChannel(org.id, load.id);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }
}
