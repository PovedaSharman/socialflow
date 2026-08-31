import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const currentBillingCycleStart = (
  subscriptionCreatedAt: Date,
  now: Dayjs = dayjs()
) => {
  const createdAt = dayjs(subscriptionCreatedAt).utc();
  const currentTime = now.utc();
  const elapsedBillingCycles = Math.max(
    0,
    Math.ceil(currentTime.diff(createdAt, 'month', true))
  );
  return createdAt.add(elapsedBillingCycles - 1, 'month');
};
