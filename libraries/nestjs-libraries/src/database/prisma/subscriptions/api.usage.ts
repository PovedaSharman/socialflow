import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';
import dayjs from 'dayjs';
import { pricing } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import {
  isWithinHardLimit,
  usageLimitDenial,
  usageLimitWarningThreshold,
} from '@gitroom/nestjs-libraries/database/prisma/subscriptions/usage.limit';
import { SubscriptionService } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service';

const KEY_PREFIX = 'usage:api:';

export function apiUsageKey(organizationId: string, periodStart: Date) {
  return `${KEY_PREFIX}${organizationId}:${dayjs(periodStart).format(
    'YYYY-MM'
  )}`;
}

export async function incrementApiCallCount(
  organizationId: string,
  periodStart: Date = new Date()
) {
  const id = String(organizationId || '').trim();
  if (!id) {
    return null;
  }
  const key = apiUsageKey(id, periodStart);
  const count = await ioRedis.incr(key);
  if (count === 1) {
    await ioRedis.expire(key, 60 * 60 * 24 * 40);
  }
  return count;
}

export type ApiBudgetDecision = {
  allowed: boolean;
  warning?: string;
  denial?: ReturnType<typeof usageLimitDenial>;
  used?: number;
  limit?: number;
};

export async function enforceApiCallBudget(
  subscriptionService: SubscriptionService,
  organizationId: string
): Promise<ApiBudgetDecision> {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    await incrementApiCallCount(organizationId);
    return { allowed: true };
  }

  const subscription =
    await subscriptionService.getSubscriptionByOrganizationId(organizationId);
  const tier = subscription?.subscriptionTier || 'FREE';
  const limit = pricing[tier]?.api_calls_per_month ?? 0;
  const used = await incrementApiCallCount(organizationId);
  if (used === null) {
    return { allowed: true };
  }

  if (!isWithinHardLimit(used - 1, limit)) {
    return {
      allowed: false,
      used,
      limit,
      denial: usageLimitDenial('api_calls', 'create'),
    };
  }

  const warningThreshold = usageLimitWarningThreshold(limit);
  return {
    allowed: true,
    used,
    limit,
    warning:
      used >= warningThreshold
        ? `API usage is at ${used} of ${limit} calls this period.`
        : undefined,
  };
}
