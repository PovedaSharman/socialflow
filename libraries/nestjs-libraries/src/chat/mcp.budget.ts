import { pricing } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import {
  isWithinHardLimit,
  usageLimitDenial,
  usageLimitWarningThreshold,
} from '@gitroom/nestjs-libraries/database/prisma/subscriptions/usage.limit';
import { incrementMcpCallCount } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/mcp.usage';
import { SubscriptionService } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service';

export type McpBudgetDecision = {
  allowed: boolean;
  warning?: string;
  denial?: ReturnType<typeof usageLimitDenial>;
  used?: number;
  limit?: number;
};

/**
 * Counts one MCP HTTP session against the organisation monthly budget.
 * When Stripe is unset (local/dev without billing), limits are not applied.
 */
export async function enforceMcpCallBudget(
  subscriptionService: SubscriptionService,
  organizationId: string
): Promise<McpBudgetDecision> {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    await incrementMcpCallCount(organizationId);
    return { allowed: true };
  }

  const subscription =
    await subscriptionService.getSubscriptionByOrganizationId(organizationId);
  const tier =
    subscription?.subscriptionTier ||
    (!process.env.STRIPE_PUBLISHABLE_KEY ? 'PRO' : 'FREE');
  const limit = pricing[tier]?.mcp_calls_per_month ?? 0;
  const used = await incrementMcpCallCount(organizationId);

  if (used === null) {
    return { allowed: true };
  }

  // incr returns the post-increment value; deny when that value exceeds limit.
  if (!isWithinHardLimit(used - 1, limit)) {
    return {
      allowed: false,
      used,
      limit,
      denial: usageLimitDenial('mcp_calls', 'create'),
    };
  }

  const warningThreshold = usageLimitWarningThreshold(limit);
  return {
    allowed: true,
    used,
    limit,
    warning:
      used >= warningThreshold
        ? `MCP usage is at ${used} of ${limit} calls this period.`
        : undefined,
  };
}
