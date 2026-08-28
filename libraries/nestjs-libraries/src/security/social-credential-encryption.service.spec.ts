import { SocialCredentialEncryptionService } from './social-credential-encryption.service';

const originalEnvironment = {
  nodeEnv: process.env.NODE_ENV,
  keys: process.env.SOCIAL_CREDENTIAL_ENCRYPTION_KEYS,
  activeKeyId: process.env.SOCIAL_CREDENTIAL_ENCRYPTION_ACTIVE_KEY_ID,
};

const configure = (
  keys: Record<string, Buffer>,
  activeKeyId: string,
  nodeEnv = 'test'
) => {
  process.env.NODE_ENV = nodeEnv;
  process.env.SOCIAL_CREDENTIAL_ENCRYPTION_KEYS = JSON.stringify(
    Object.fromEntries(
      Object.entries(keys).map(([id, key]) => [id, key.toString('base64')])
    )
  );
  process.env.SOCIAL_CREDENTIAL_ENCRYPTION_ACTIVE_KEY_ID = activeKeyId;
};

afterEach(() => {
  const restore = (name: string, value: string | undefined) => {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  };
  restore('NODE_ENV', originalEnvironment.nodeEnv);
  restore('SOCIAL_CREDENTIAL_ENCRYPTION_KEYS', originalEnvironment.keys);
  restore(
    'SOCIAL_CREDENTIAL_ENCRYPTION_ACTIVE_KEY_ID',
    originalEnvironment.activeKeyId
  );
});

describe('social credential encryption', () => {
  it('uses authenticated random AES-GCM envelopes', () => {
    configure({ current: Buffer.alloc(32, 1) }, 'current');
    const service = new SocialCredentialEncryptionService();

    const first = service.encrypt('provider-secret');
    const second = service.encrypt('provider-secret');

    expect(first).toMatch(/^sfenc:v1:current:/);
    expect(second).not.toBe(first);
    expect(service.decrypt(first)).toBe('provider-secret');
    expect(service.decrypt(second)).toBe('provider-secret');
  });

  it('rejects tampered ciphertext', () => {
    configure({ current: Buffer.alloc(32, 2) }, 'current');
    const service = new SocialCredentialEncryptionService();
    const parts = service.encrypt('provider-secret').split(':');
    parts[4] = `${parts[4][0] === 'A' ? 'B' : 'A'}${parts[4].slice(1)}`;

    expect(() => service.decrypt(parts.join(':'))).toThrow(
      'could not be authenticated'
    );
  });

  it('decrypts old keys and re-encrypts with the active rotation key', () => {
    const oldKey = Buffer.alloc(32, 3);
    const newKey = Buffer.alloc(32, 4);
    configure({ old: oldKey }, 'old');
    const oldEnvelope = new SocialCredentialEncryptionService().encrypt(
      'provider-secret'
    );

    configure({ old: oldKey, current: newKey }, 'current');
    const rotatedService = new SocialCredentialEncryptionService();
    const rotatedEnvelope = rotatedService.encrypt(oldEnvelope);

    expect(rotatedService.decrypt(oldEnvelope)).toBe('provider-secret');
    expect(rotatedEnvelope).toMatch(/^sfenc:v1:current:/);
    expect(rotatedService.decrypt(rotatedEnvelope)).toBe('provider-secret');
  });

  it('fails closed on missing keys and plaintext in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SOCIAL_CREDENTIAL_ENCRYPTION_KEYS;
    delete process.env.SOCIAL_CREDENTIAL_ENCRYPTION_ACTIVE_KEY_ID;
    expect(() => new SocialCredentialEncryptionService()).toThrow(
      'required in production'
    );

    configure({ current: Buffer.alloc(32, 5) }, 'current', 'production');
    const service = new SocialCredentialEncryptionService();
    expect(() => service.decrypt('legacy-plaintext')).toThrow(
      'Unencrypted social credentials are not accepted'
    );
  });
});
