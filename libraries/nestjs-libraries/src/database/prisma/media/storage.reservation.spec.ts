import {
  claimStorageReservation,
  getReservedStorageBytes,
  releaseStorageReservation,
} from './storage.reservation';

type RedisEval = (
  script: string,
  numKeys: number,
  ...args: Array<string | number>
) => Promise<unknown>;

const store = new Map<string, { value: string; expiresAt?: number }>();

jest.mock('@gitroom/nestjs-libraries/redis/redis.service', () => {
  const evalImpl: RedisEval = async (script, _numKeys, key, ...argv) => {
    const now = Date.now();
    const entry = store.get(String(key));
    if (entry?.expiresAt && entry.expiresAt <= now) {
      store.delete(String(key));
    }

    if (script.includes('INCRBY')) {
      const incoming = Number(argv[0]);
      const used = Number(argv[1]);
      const limit = Number(argv[2]);
      const ttl = Number(argv[3]);
      const reserved = Number(store.get(String(key))?.value || 0);
      if (used + reserved + incoming > limit) {
        return 0;
      }
      const next = reserved + incoming;
      store.set(String(key), {
        value: String(next),
        expiresAt: now + ttl * 1000,
      });
      return next;
    }

    if (script.includes('DECRBY')) {
      const amount = Number(argv[0]);
      const current = Number(store.get(String(key))?.value || 0);
      if (current <= amount) {
        store.delete(String(key));
        return 0;
      }
      const next = current - amount;
      store.set(String(key), { value: String(next) });
      return next;
    }

    return 0;
  };

  return {
    ioRedis: {
      get: async (key: string) => store.get(key)?.value ?? null,
      eval: evalImpl,
    },
  };
});

describe('storage.reservation', () => {
  beforeEach(() => {
    store.clear();
  });

  it('claims the first reservation within the limit', async () => {
    await expect(
      claimStorageReservation({
        organizationId: 'org-a',
        usedBytes: 0,
        incomingBytes: 40,
        limitBytes: 100,
      })
    ).resolves.toBe(true);
    await expect(getReservedStorageBytes('org-a')).resolves.toBe(40);
  });

  it('denies a concurrent claim that would exceed the limit', async () => {
    await claimStorageReservation({
      organizationId: 'org-b',
      usedBytes: 50,
      incomingBytes: 40,
      limitBytes: 100,
    });
    await expect(
      claimStorageReservation({
        organizationId: 'org-b',
        usedBytes: 50,
        incomingBytes: 20,
        limitBytes: 100,
      })
    ).resolves.toBe(false);
    await expect(getReservedStorageBytes('org-b')).resolves.toBe(40);
  });

  it('releases a reservation so a later claim can succeed', async () => {
    await claimStorageReservation({
      organizationId: 'org-c',
      usedBytes: 0,
      incomingBytes: 80,
      limitBytes: 100,
    });
    await releaseStorageReservation('org-c', 80);
    await expect(getReservedStorageBytes('org-c')).resolves.toBe(0);
    await expect(
      claimStorageReservation({
        organizationId: 'org-c',
        usedBytes: 0,
        incomingBytes: 90,
        limitBytes: 100,
      })
    ).resolves.toBe(true);
  });

  it('isolates reservations by organisation', async () => {
    await claimStorageReservation({
      organizationId: 'org-1',
      usedBytes: 0,
      incomingBytes: 100,
      limitBytes: 100,
    });
    await expect(
      claimStorageReservation({
        organizationId: 'org-2',
        usedBytes: 0,
        incomingBytes: 100,
        limitBytes: 100,
      })
    ).resolves.toBe(true);
  });
});
