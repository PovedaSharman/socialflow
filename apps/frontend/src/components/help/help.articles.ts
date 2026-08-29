export type HelpArticle = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  body: string;
};

/**
 * Version-controlled help centre catalogue. Keep copy in British English and
 * update docs/help/*.md when changing published guidance.
 */
export const helpArticles: HelpArticle[] = [
  {
    id: 'first-schedule',
    title: 'Schedule your first post',
    summary: 'Connect a channel, write a draft, and schedule it safely.',
    tags: ['onboarding', 'calendar', 'schedule'],
    body: [
      '1. Open Calendar and connect at least one social channel.',
      '2. Create a post, add alternative text for every image or video, then choose Schedule.',
      '3. Confirm the date and channels. Drafts can be incomplete; scheduling cannot.',
      '4. Watch the calendar list for status, including failed posts with recovery guidance.',
    ].join('\n'),
  },
  {
    id: 'connect-channel',
    title: 'Connect a social channel',
    summary: 'Use official OAuth only. Never paste provider tokens.',
    tags: ['oauth', 'channels', 'security'],
    body: [
      'Start from Channels or the onboarding checklist and choose a provider.',
      'Approve access in the provider window. SocialFlow binds the callback to your organisation and the user who started the connection.',
      'If a channel shows unhealthy, reconnect from the same place. Production providers must be allowlisted by an operator.',
    ].join('\n'),
  },
  {
    id: 'accessible-media',
    title: 'Add accessible media descriptions',
    summary: 'Describe images and videos before scheduling or publishing.',
    tags: ['accessibility', 'media'],
    body: [
      'Open media settings and describe essential visual information.',
      'Do not repeat the caption. Keep descriptions between 1 and 1,000 characters.',
      'Some channels do not yet transmit alternative text through their official APIs; SocialFlow still stores it and tells you when a selected channel cannot send it.',
    ].join('\n'),
  },
  {
    id: 'mcp-credentials',
    title: 'Use MCP and API credentials safely',
    summary: 'Create scoped Bearer credentials and never put secrets in URLs.',
    tags: ['mcp', 'api', 'security'],
    body: [
      'Open Access and create a scoped API credential. Copy the secret once; SocialFlow stores only a hash.',
      'Configure clients with Authorization: Bearer on /mcp. URL-embedded keys are retired for new instructions and disabled in production by default.',
      'Immediate publishing and media generation stay off unless you grant those scopes explicitly. Revoke credentials you no longer need.',
    ].join('\n'),
  },
  {
    id: 'billing-limits',
    title: 'Understand plans and limits',
    summary: 'Hard limits block overages and explain the next step.',
    tags: ['billing', 'limits'],
    body: [
      'Plans control channels, posts, webhooks, AI and video credits.',
      'When a limit blocks an action, the API returns a clear message and next step such as upgrading or waiting for the period to renew.',
      'Stripe runs in test mode until an operator explicitly attests live mode.',
    ].join('\n'),
  },
  {
    id: 'failed-posts',
    title: 'Recover a failed post',
    summary: 'Review the error, fix the content, and retry safely.',
    tags: ['publishing', 'recovery'],
    body: [
      'Open the failed calendar card to read the bounded error message.',
      'Edit the post, check the platform connection, then retry. Retries are duplicate-safe when the provider supports an idempotency key.',
      'If the channel needs reconnecting, fix the connection before publishing again.',
    ].join('\n'),
  },
  {
    id: 'privacy-export',
    title: 'Export data or request deletion',
    summary:
      'Organisation admins can export data and request deletion with re-authentication.',
    tags: ['privacy', 'gdpr', 'audit'],
    body: [
      'Open Settings → Privacy and audit (organisation admins only).',
      'Download a machine-readable organisation export. OAuth tokens and API secrets are excluded.',
      'Record purpose-specific consent versions when marketing or optional processing changes.',
      'Deletion requests require your password, are audited, and wait for an operator purge until legal retention rules are decided.',
    ].join('\n'),
  },
];

export function searchHelpArticles(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return helpArticles;
  }

  return helpArticles.filter((article) => {
    const haystack = [
      article.title,
      article.summary,
      article.body,
      ...article.tags,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}
