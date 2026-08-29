export type UsageLimitDenial = {
  section: string;
  action: string;
  message: string;
  nextStep: string;
};

const denials: Record<string, { message: string; nextStep: string }> = {
  channel: {
    message: 'You have reached the channel limit for your plan.',
    nextStep: 'Upgrade your plan or remove an unused channel, then try again.',
  },
  posts_per_month: {
    message: 'You have reached the monthly post limit for your plan.',
    nextStep: 'Upgrade your plan or wait until your billing period renews.',
  },
  videos_per_month: {
    message: 'You have no video generation credits remaining this period.',
    nextStep: 'Upgrade your plan or wait until credits renew.',
  },
  webhooks: {
    message: 'You have reached the webhook limit for your plan.',
    nextStep: 'Upgrade your plan or remove an unused webhook.',
  },
  team_members: {
    message: 'Team members are not included in your current plan.',
    nextStep: 'Upgrade to a plan that includes team collaboration.',
  },
  ai: {
    message: 'AI features are not included in your current plan.',
    nextStep: 'Upgrade your plan to enable AI assistance.',
  },
  import_from_channels: {
    message: 'Importing from channels is not included in your current plan.',
    nextStep: 'Upgrade your plan to enable channel imports.',
  },
  community_features: {
    message: 'Community features are not included in your current plan.',
    nextStep: 'Upgrade your plan to unlock community features.',
  },
  mcp_calls: {
    message: 'You have reached the MCP call limit for your plan this period.',
    nextStep: 'Upgrade your plan or wait until the period renews.',
  },
  api_calls: {
    message: 'You have reached the API call limit for your plan this period.',
    nextStep: 'Upgrade your plan or wait until the period renews.',
  },
  storage_bytes: {
    message: 'You have reached the media storage limit for your plan.',
    nextStep: 'Upgrade your plan or remove unused media, then try again.',
  },
};

export function usageLimitDenial(
  section: string,
  action = 'create'
): UsageLimitDenial {
  const denial = denials[section] || {
    message: 'This action exceeds your plan limits.',
    nextStep: 'Review billing and upgrade your plan, then try again.',
  };

  return {
    section,
    action,
    message: denial.message,
    nextStep: denial.nextStep,
  };
}

/**
 * Effective channel allowance is the greater of the plan default and any
 * purchased channel allotment stored on the subscription.
 */
export function resolveChannelLimit(
  planChannel: number | undefined,
  purchasedChannels: number | undefined
) {
  const plan = Math.max(0, Number(planChannel) || 0);
  const purchased = Math.max(0, Number(purchasedChannels) || 0);
  return Math.max(plan, purchased);
}

export function isWithinHardLimit(used: number, limit: number) {
  return used < Math.max(0, limit);
}

export function usageLimitWarningThreshold(limit: number) {
  if (limit <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(limit * 0.8));
}
