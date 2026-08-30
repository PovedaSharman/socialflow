import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service';
import { OAuthService } from '@gitroom/nestjs-libraries/database/prisma/oauth/oauth.service';
import { HttpForbiddenException } from '@gitroom/nestjs-libraries/services/exception.filter';
import { SubscriptionService } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { enforceApiCallBudget } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/api.usage';
import { ApiCredentialService } from '@gitroom/nestjs-libraries/database/prisma/api-credentials/api.credential.service';
import { API_CREDENTIAL_PREFIX } from '@gitroom/nestjs-libraries/database/prisma/api-credentials/api.credential.secret';
import { DEFAULT_MCP_SCOPES } from '@gitroom/nestjs-libraries/chat/mcp.scopes';

@Injectable()
export class PublicAuthMiddleware implements NestMiddleware {
  constructor(
    private _organizationService: OrganizationService,
    private _oauthService: OAuthService,
    private _subscriptionService: SubscriptionService,
    private _apiCredentialService: ApiCredentialService
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const auth = (
      (req.headers.authorization || req.headers.Authorization) as string
    )?.replace(/^Bearer\s+/i, '');
    if (!auth) {
      res.status(HttpStatus.UNAUTHORIZED).json({ msg: 'No API Key found' });
      return;
    }
    try {
      if (auth.startsWith('pos_')) {
        const authorization = await this._oauthService.getOrgByOAuthToken(auth);
        if (!authorization) {
          res
            .status(HttpStatus.UNAUTHORIZED)
            .json({ msg: 'Invalid OAuth token' });
          return;
        }

        const org = authorization.organization;
        if (!!process.env.STRIPE_SECRET_KEY && !org.subscription) {
          res
            .status(HttpStatus.UNAUTHORIZED)
            .json({ msg: 'No subscription found' });
          return;
        }

        // @ts-ignore
        req.org = {
          ...org,
          users: [{ role: 'OWNER' }],
          mcpScopes: [...DEFAULT_MCP_SCOPES],
          authKind: 'oauth',
        };
      } else if (auth.startsWith(API_CREDENTIAL_PREFIX)) {
        const resolved =
          await this._apiCredentialService.resolveOrganizationBySecret(auth);
        if (!resolved) {
          res
            .status(HttpStatus.UNAUTHORIZED)
            .json({ msg: 'Invalid API credential' });
          return;
        }

        if (
          !!process.env.STRIPE_SECRET_KEY &&
          !resolved.organization.subscription
        ) {
          res
            .status(HttpStatus.UNAUTHORIZED)
            .json({ msg: 'No subscription found' });
          return;
        }

        // @ts-ignore
        req.org = {
          ...resolved.organization,
          users: [{ role: 'OWNER' }],
          mcpScopes: resolved.scopes,
          apiCredentialId: resolved.credentialId,
          authKind: 'scoped',
        };
      } else {
        const org = await this._organizationService.getOrgByApiKey(auth);
        if (!org) {
          res.status(HttpStatus.UNAUTHORIZED).json({ msg: 'Invalid API key' });
          return;
        }

        if (!!process.env.STRIPE_SECRET_KEY && !org.subscription) {
          res
            .status(HttpStatus.UNAUTHORIZED)
            .json({ msg: 'No subscription found' });
          return;
        }

        // @ts-ignore
        req.org = {
          ...org,
          users: [{ role: 'OWNER' }],
          mcpScopes: [...DEFAULT_MCP_SCOPES],
          authKind: 'legacy',
        };
      }
    } catch (err) {
      throw new HttpForbiddenException();
    }

    // @ts-ignore
    const organizationId = req.org?.id as string | undefined;
    if (organizationId && req.method !== 'GET' && req.method !== 'HEAD') {
      const decision = await enforceApiCallBudget(
        this._subscriptionService,
        organizationId
      );
      if (!decision.allowed && decision.denial) {
        res.status(HttpStatus.PAYMENT_REQUIRED).json({
          section: decision.denial.section,
          action: decision.denial.action,
          message: decision.denial.message,
          nextStep: decision.denial.nextStep,
          used: decision.used,
          limit: decision.limit,
        });
        return;
      }
      if (decision.warning) {
        res.setHeader('X-Usage-Warning', decision.warning);
      }
    }

    next();
  }
}
