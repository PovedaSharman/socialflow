import { mcpUsageKey } from './mcp.usage';
import {
  isWithinHardLimit,
  usageLimitDenial,
  usageLimitWarningThreshold,
} from './usage.limit';

describe('MCP usage counters', () => {
  it('builds a stable monthly key and reuses hard-limit helpers', () => {
    expect(mcpUsageKey('org-a', new Date('2026-08-15T12:00:00.000Z'))).toBe(
      'usage:mcp:org-a:2026-08'
    );
    expect(isWithinHardLimit(99, 100)).toBe(true);
    expect(isWithinHardLimit(100, 100)).toBe(false);
    expect(usageLimitWarningThreshold(100)).toBe(80);
    expect(usageLimitDenial('mcp_calls', 'create').nextStep).toContain(
      'Upgrade'
    );
  });
});
