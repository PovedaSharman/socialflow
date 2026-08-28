const EXPIRING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type IntegrationConnectionHealth = {
  status:
    | 'healthy'
    | 'connecting'
    | 'action_required'
    | 'expiring'
    | 'disabled';
  requiredAction: 'none' | 'continue' | 'reconnect' | 'upgrade';
  message: string;
  expiresAt: string | null;
};

export const integrationConnectionHealth = (
  integration: {
    disabled: boolean;
    refreshNeeded: boolean;
    inBetweenSteps: boolean;
    tokenExpiration?: Date | string | null;
  },
  now = new Date()
): IntegrationConnectionHealth => {
  const parsedExpiration = integration.tokenExpiration
    ? new Date(integration.tokenExpiration)
    : null;
  const expiresAt =
    parsedExpiration && !Number.isNaN(parsedExpiration.getTime())
      ? parsedExpiration.toISOString()
      : null;

  if (integration.disabled) {
    return {
      status: 'disabled',
      requiredAction: 'upgrade',
      message: 'This channel is disabled by the current plan.',
      expiresAt,
    };
  }
  if (
    integration.refreshNeeded ||
    (parsedExpiration !== null && expiresAt === null)
  ) {
    return {
      status: 'action_required',
      requiredAction: 'reconnect',
      message: 'Reconnect this channel before publishing.',
      expiresAt: null,
    };
  }
  if (integration.inBetweenSteps) {
    return {
      status: 'connecting',
      requiredAction: 'continue',
      message: 'Finish connecting this channel.',
      expiresAt,
    };
  }
  if (parsedExpiration && parsedExpiration.getTime() <= now.getTime()) {
    return {
      status: 'action_required',
      requiredAction: 'reconnect',
      message: 'This channel connection has expired. Reconnect it to publish.',
      expiresAt,
    };
  }
  if (
    parsedExpiration &&
    parsedExpiration.getTime() <= now.getTime() + EXPIRING_WINDOW_MS
  ) {
    return {
      status: 'expiring',
      requiredAction: 'reconnect',
      message: 'This channel connection expires within seven days.',
      expiresAt,
    };
  }
  return {
    status: 'healthy',
    requiredAction: 'none',
    message: 'Channel connection is healthy.',
    expiresAt,
  };
};
