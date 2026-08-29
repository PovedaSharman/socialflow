import {
  isWithinHardLimit,
  resolveChannelLimit,
  usageLimitDenial,
  usageLimitWarningThreshold,
} from './usage.limit';

describe('usage limits', () => {
  it('resolves channel allowance from plan and purchased allotments', () => {
    expect(resolveChannelLimit(5, 0)).toBe(5);
    expect(resolveChannelLimit(5, 12)).toBe(12);
    expect(resolveChannelLimit(undefined, 3)).toBe(3);
    expect(resolveChannelLimit(-10, 4)).toBe(4);
  });

  it('enforces hard limits and warns at eighty percent', () => {
    expect(isWithinHardLimit(4, 5)).toBe(true);
    expect(isWithinHardLimit(5, 5)).toBe(false);
    expect(usageLimitWarningThreshold(10)).toBe(8);
    expect(usageLimitWarningThreshold(0)).toBe(0);
  });

  it('explains the next step when a limit blocks an action', () => {
    expect(usageLimitDenial('channel', 'create')).toMatchObject({
      section: 'channel',
      action: 'create',
      message: 'You have reached the channel limit for your plan.',
      nextStep:
        'Upgrade your plan or remove an unused channel, then try again.',
    });
  });
});
