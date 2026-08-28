import dayjs from 'dayjs';
import { currentBillingCycleStart } from './subscription.service';

describe('billing cycle calculation', () => {
  const createdAt = new Date('2025-01-15T10:00:00.000Z');

  it('matches the previous cycle at the exact creation instant', () => {
    expect(
      currentBillingCycleStart(createdAt, dayjs('2025-01-15T10:00:00.000Z'))
        .toDate()
        .toISOString()
    ).toBe('2024-12-15T10:00:00.000Z');
  });

  it('returns the current cycle without month-by-month iteration', () => {
    expect(
      currentBillingCycleStart(createdAt, dayjs('2035-08-20T10:00:00.000Z'))
        .toDate()
        .toISOString()
    ).toBe('2035-08-15T10:00:00.000Z');
  });
});
