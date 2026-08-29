import { HttpException, HttpStatus } from '@nestjs/common';
import { usageLimitDenial } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/usage.limit';

export enum Sections {
  CHANNEL = 'channel',
  POSTS_PER_MONTH = 'posts_per_month',
  VIDEOS_PER_MONTH = 'videos_per_month',
  TEAM_MEMBERS = 'team_members',
  COMMUNITY_FEATURES = 'community_features',
  FEATURED_BY_GITROOM = 'featured_by_gitroom',
  AI = 'ai',
  IMPORT_FROM_CHANNELS = 'import_from_channels',
  ADMIN = 'admin',
  WEBHOOKS = 'webhooks',
  CONTENT = 'content',
  APPROVAL = 'approval',
  BILLING = 'billing',
}

export enum AuthorizationActions {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export class SubscriptionException extends HttpException {
  constructor(message: { section: Sections; action: AuthorizationActions }) {
    const denial = usageLimitDenial(message.section, message.action);
    super(
      {
        section: denial.section,
        action: denial.action,
        message: denial.message,
        nextStep: denial.nextStep,
      },
      HttpStatus.PAYMENT_REQUIRED
    );
  }
}

export class AuthorizationException extends HttpException {
  constructor(message: { section: Sections; action: AuthorizationActions }) {
    super(message, HttpStatus.FORBIDDEN);
  }
}
