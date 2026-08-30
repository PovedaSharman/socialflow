import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrivacyRepository } from '@gitroom/nestjs-libraries/database/prisma/privacy/privacy.repository';
import { evaluatePublicApiScope } from '@gitroom/nestjs-libraries/public-api/public.api.scopes';

@Injectable()
export class PublicApiScopeGuard implements CanActivate {
  constructor(private _privacyRepository: PrivacyRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const org = request.org;
    const decision = evaluatePublicApiScope({
      method: request.method,
      path: request.originalUrl || request.url || '',
      body: request.body,
      auth: org
        ? {
            organizationId: org.id,
            mcpScopes: org.mcpScopes,
            apiCredentialId: org.apiCredentialId || null,
            authKind: org.authKind,
          }
        : null,
    });
    request.publicApiScopeDecision = decision;

    if (org?.id && !decision.allowed) {
      await this._privacyRepository.createAuditEvent({
        organizationId: org.id,
        actorUserId: null,
        action: 'api.request',
        targetType: 'public_api',
        targetId: decision.required || null,
        outcome: 'denied',
        source: 'api',
        requestId: request.headers?.['x-request-id'] || null,
        metadata: {
          action: decision.action,
          required: decision.required || null,
          reason: decision.reason || null,
          authKind: org.authKind || null,
          apiCredentialId: org.apiCredentialId || null,
        },
        ip: request.ip,
      });
    }

    if (!decision.allowed) {
      throw new ForbiddenException({
        msg: decision.required
          ? `Missing required scope: ${decision.required}`
          : 'This public API action is not authorised for the presented credential.',
        reason: decision.reason,
        required: decision.required,
      });
    }

    return true;
  }
}
