import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { pricing } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import { SubscriptionService } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import dayjs from 'dayjs';
import { WebhooksService } from '@gitroom/nestjs-libraries/database/prisma/webhooks/webhooks.service';
import { AuthorizationActions, Sections } from './permission.exception.class';
import {
  canApproveContent,
  canEditContent,
  canManageBilling,
  canManageOrganization,
  OrganizationRole,
} from './organization.role';
import {
  isWithinHardLimit,
  resolveChannelLimit,
} from '@gitroom/nestjs-libraries/database/prisma/subscriptions/usage.limit';

export type AppAbility = Ability<[AuthorizationActions, Sections]>;

export function roleCanAccess(
  role: OrganizationRole,
  action: AuthorizationActions,
  section: Sections
) {
  if (section === Sections.ADMIN) {
    return canManageOrganization(role);
  }
  if (section === Sections.BILLING) {
    return canManageBilling(role);
  }
  if (section === Sections.APPROVAL) {
    return canApproveContent(role);
  }
  if (action === AuthorizationActions.Read) {
    return true;
  }
  if (
    section === Sections.CHANNEL ||
    section === Sections.WEBHOOKS ||
    section === Sections.TEAM_MEMBERS
  ) {
    return canManageOrganization(role);
  }
  return canEditContent(role);
}

@Injectable()
export class PermissionsService {
  constructor(
    private _subscriptionService: SubscriptionService,
    private _postsService: PostsService,
    private _integrationService: IntegrationService,
    private _webhooksService: WebhooksService
  ) {}
  async getPackageOptions(orgId: string) {
    const subscription =
      await this._subscriptionService.getSubscriptionByOrganizationId(orgId);

    const tier =
      subscription?.subscriptionTier ||
      (!process.env.STRIPE_PUBLISHABLE_KEY ? 'PRO' : 'FREE');

    const plan = pricing[tier];
    return {
      subscription,
      options: {
        ...plan,
        channel: resolveChannelLimit(plan.channel, subscription?.totalChannels),
      },
    };
  }

  async check(
    orgId: string,
    created_at: Date,
    permission: OrganizationRole,
    requestedPermission: Array<[AuthorizationActions, Sections]>,
    refreshChannelId?: string
  ) {
    const { can, build } = new AbilityBuilder<
      Ability<[AuthorizationActions, Sections]>
    >(Ability as AbilityClass<AppAbility>);

    if (requestedPermission.length === 0) {
      return build({
        detectSubjectType: (item) =>
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          item.constructor,
      });
    }

    const billingEnabled = !!process.env.STRIPE_PUBLISHABLE_KEY;

    if (!billingEnabled) {
      for (const [action, section] of requestedPermission) {
        if (roleCanAccess(permission, action, section)) {
          can(action, section);
        }
      }
      return build({
        detectSubjectType: (item) =>
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          item.constructor,
      });
    }

    const { options } = await this.getPackageOptions(orgId);
    for (const [action, section] of requestedPermission) {
      if (!roleCanAccess(permission, action, section)) {
        continue;
      }
      if (
        section === Sections.CONTENT ||
        section === Sections.APPROVAL ||
        section === Sections.BILLING
      ) {
        can(action, section);
        continue;
      }
      // check for the amount of channels
      if (section === Sections.CHANNEL) {
        // Refreshing an existing channel doesn't add a new one, so skip the limit check
        // but only if the channel actually belongs to this org
        if (refreshChannelId) {
          const existingIntegration =
            await this._integrationService.getIntegrationById(
              orgId,
              refreshChannelId
            );
          if (existingIntegration) {
            can(action, section);
            continue;
          }
        }

        const totalChannels = (
          await this._integrationService.getIntegrationsList(orgId)
        ).filter((f) => !f.refreshNeeded).length;

        if (isWithinHardLimit(totalChannels, options.channel || 0)) {
          can(action, section);
          continue;
        }
      }

      if (section === Sections.WEBHOOKS) {
        const totalWebhooks = await this._webhooksService.getTotal(orgId);
        if (isWithinHardLimit(totalWebhooks, options.webhooks || 0)) {
          can(AuthorizationActions.Create, section);
          continue;
        }
      }

      // check for posts per month
      if (section === Sections.POSTS_PER_MONTH) {
        const createdAt =
          (await this._subscriptionService.getSubscription(orgId))?.createdAt ||
          created_at;
        const totalMonthPast = Math.abs(
          dayjs(createdAt).diff(dayjs(), 'month')
        );
        const checkFrom = dayjs(createdAt).add(totalMonthPast, 'month');
        const count = await this._postsService.countPostsFromDay(
          orgId,
          checkFrom.toDate()
        );

        if (isWithinHardLimit(count, options.posts_per_month || 0)) {
          can(action, section);
          continue;
        }
      }

      if (section === Sections.TEAM_MEMBERS && options.team_members) {
        can(action, section);
        continue;
      }

      if (section === Sections.ADMIN && canManageOrganization(permission)) {
        can(action, section);
        continue;
      }

      if (
        section === Sections.COMMUNITY_FEATURES &&
        options.community_features
      ) {
        can(action, section);
        continue;
      }

      if (
        section === Sections.FEATURED_BY_GITROOM &&
        options.featured_by_gitroom
      ) {
        can(action, section);
        continue;
      }

      if (section === Sections.AI && options.ai) {
        can(action, section);
        continue;
      }

      if (
        section === Sections.IMPORT_FROM_CHANNELS &&
        options.import_from_channels
      ) {
        can(action, section);
      }
    }

    return build({
      detectSubjectType: (item) =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        item.constructor,
    });
  }
}
