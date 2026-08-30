import {
  fitsStorageQuota,
  resolveTrustedByteLength,
  UNKNOWN_FILE_SIZE_POLICY,
} from './storage.quota';

describe('storage.quota', () => {
  describe('resolveTrustedByteLength', () => {
    it('accepts positive integers from numbers, numeric strings and bigint', () => {
      expect(resolveTrustedByteLength(1)).toBe(1);
      expect(resolveTrustedByteLength(4096)).toBe(4096);
      expect(resolveTrustedByteLength('2048')).toBe(2048);
      expect(resolveTrustedByteLength(10n)).toBe(10);
    });

    it('rejects missing, zero, negative, non-integer and malformed values', () => {
      expect(resolveTrustedByteLength(undefined)).toBeNull();
      expect(resolveTrustedByteLength(null)).toBeNull();
      expect(resolveTrustedByteLength(0)).toBeNull();
      expect(resolveTrustedByteLength(-1)).toBeNull();
      expect(resolveTrustedByteLength(1.5)).toBeNull();
      expect(resolveTrustedByteLength('')).toBeNull();
      expect(resolveTrustedByteLength('abc')).toBeNull();
      expect(resolveTrustedByteLength({})).toBeNull();
    });
  });

  describe('fitsStorageQuota', () => {
    it('allows a first write within the limit', () => {
      expect(
        fitsStorageQuota({
          usedBytes: 0,
          reservedBytes: 0,
          incomingBytes: 100,
          limitBytes: 100,
        })
      ).toBe(true);
    });

    it('denies when used plus incoming exceeds the limit', () => {
      expect(
        fitsStorageQuota({
          usedBytes: 90,
          reservedBytes: 0,
          incomingBytes: 20,
          limitBytes: 100,
        })
      ).toBe(false);
    });

    it('counts reserved bytes so concurrent claims cannot both fit', () => {
      expect(
        fitsStorageQuota({
          usedBytes: 50,
          reservedBytes: 40,
          incomingBytes: 20,
          limitBytes: 100,
        })
      ).toBe(false);
      expect(
        fitsStorageQuota({
          usedBytes: 50,
          reservedBytes: 40,
          incomingBytes: 10,
          limitBytes: 100,
        })
      ).toBe(true);
    });

    it('denies unknown or zero incoming sizes', () => {
      expect(
        fitsStorageQuota({
          usedBytes: 0,
          reservedBytes: 0,
          incomingBytes: 0,
          limitBytes: 100,
        })
      ).toBe(false);
    });

    it('denies any write when the plan storage limit is zero', () => {
      expect(
        fitsStorageQuota({
          usedBytes: 0,
          reservedBytes: 0,
          incomingBytes: 1,
          limitBytes: 0,
        })
      ).toBe(false);
    });
  });

  it('documents unknown historical fileSize rows', () => {
    expect(UNKNOWN_FILE_SIZE_POLICY).toMatch(/unknown/i);
    expect(UNKNOWN_FILE_SIZE_POLICY).toMatch(/0/);
  });
});
