import { apiUsageKey } from './api.usage';
import {
  isWithinHardLimit,
  usageLimitDenial,
  usageLimitWarningThreshold,
} from './usage.limit';

describe('API usage counters', () => {
  it('builds a stable monthly key and reuses hard-limit helpers', () => {
    expect(apiUsageKey('org-a', new Date('2026-08-15T12:00:00.000Z'))).toBe(
      'usage:api:org-a:2026-08'
    );
    expect(isWithinHardLimit(49, 50)).toBe(true);
    expect(usageLimitWarningThreshold(50)).toBe(40);
    expect(usageLimitDenial('api_calls', 'create').message).toContain('API');
  });
});
