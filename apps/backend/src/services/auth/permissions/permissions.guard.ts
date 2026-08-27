import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AppAbility,
  PermissionsService,
  roleCanAccess,
} from '@gitroom/backend/services/auth/permissions/permissions.service';
import {
  AbilityPolicy,
  CHECK_POLICIES_KEY,
} from '@gitroom/backend/services/auth/permissions/permissions.ability';
import { Organization } from '@prisma/client';
import { Request } from 'express';
import {
  AuthorizationException,
  Sections,
  SubscriptionException,
} from './permission.exception.class';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private _reflector: Reflector,
    private _authorizationService: PermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    if (
      request.path.indexOf('/auth') > -1 ||
      request.path.indexOf('/auth') > -1 ||
      request.path.indexOf('/integrations/social-connect') > -1 ||
      request.path.indexOf('/integrations/provider') > -1
    ) {
      return true;
    }

    const policyHandlers =
      this._reflector.get<AbilityPolicy[]>(
        CHECK_POLICIES_KEY,
        context.getHandler()
      ) || [];

    if (!policyHandlers || !policyHandlers.length) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { org }: { org: Organization } = request;

    const refreshChannelId = typeof request.query?.refresh === 'string' ? request.query.refresh : undefined;

    // @ts-ignore
    const role = org.users[0].role;
    const roleDenied = policyHandlers.find(
      ([action, section]) => !roleCanAccess(role, action, section)
    );
    if (roleDenied) {
      throw new AuthorizationException({
        section: roleDenied[1],
        action: roleDenied[0],
      });
    }

    const ability = await this._authorizationService.check(
      org.id,
      org.createdAt,
      role,
      policyHandlers,
      refreshChannelId
    );

    const item = policyHandlers.find(
      (handler) => !this.execPolicyHandler(handler, ability)
    );

    if (item) {
      if (item[1] === Sections.ADMIN) {
        throw new AuthorizationException({
          section: item[1],
          action: item[0],
        });
      }
      throw new SubscriptionException({
        section: item[1],
        action: item[0],
      });
    }

    return true;
  }

  private execPolicyHandler(handler: AbilityPolicy, ability: AppAbility) {
    return ability.can(handler[0], handler[1]);
  }
}
