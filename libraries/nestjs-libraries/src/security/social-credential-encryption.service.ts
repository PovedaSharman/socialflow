import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

const ENVELOPE_PREFIX = 'sfenc:v1:';
const KEY_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

type CredentialFields = {
  token: string;
  refreshToken?: string | null;
};

@Injectable()
export class SocialCredentialEncryptionService {
  private readonly keys = new Map<string, Buffer>();
  private readonly activeKeyId?: string;
  private readonly production = process.env.NODE_ENV === 'production';

  constructor() {
    const serializedKeys = process.env.SOCIAL_CREDENTIAL_ENCRYPTION_KEYS;
    const activeKeyId =
      process.env.SOCIAL_CREDENTIAL_ENCRYPTION_ACTIVE_KEY_ID?.trim();

    if (!serializedKeys || !activeKeyId) {
      if (this.production) {
        throw new Error(
          'Social credential encryption keys are required in production.'
        );
      }
      return;
    }

    if (!KEY_ID_PATTERN.test(activeKeyId)) {
      throw new Error('The active social credential key ID is invalid.');
    }

    let configuredKeys: Record<string, unknown>;
    try {
      configuredKeys = JSON.parse(serializedKeys) as Record<string, unknown>;
    } catch {
      throw new Error('Social credential encryption keys must be valid JSON.');
    }

    for (const [keyId, encodedKey] of Object.entries(configuredKeys)) {
      if (!KEY_ID_PATTERN.test(keyId) || typeof encodedKey !== 'string') {
        throw new Error('A social credential encryption key is invalid.');
      }
      const key = Buffer.from(encodedKey, 'base64');
      if (key.length !== 32) {
        throw new Error(
          `Social credential encryption key ${keyId} must decode to 32 bytes.`
        );
      }
      this.keys.set(keyId, key);
    }

    if (!this.keys.has(activeKeyId)) {
      throw new Error(
        'The active social credential key ID is not present in the key ring.'
      );
    }
    this.activeKeyId = activeKeyId;
  }

  isEncrypted(value: string | null | undefined) {
    return !!value?.startsWith(ENVELOPE_PREFIX);
  }

  encrypt(value: string) {
    if (!value || !this.activeKeyId) {
      if (this.production && value) {
        throw new Error('Social credential encryption is unavailable.');
      }
      return value;
    }

    if (this.isEncrypted(value)) {
      const [keyId] = this.envelopeParts(value);
      if (keyId === this.activeKeyId) {
        return value;
      }
      value = this.decrypt(value);
    }

    const key = this.keys.get(this.activeKeyId)!;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(this.aad(this.activeKeyId)));
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
      'sfenc',
      'v1',
      this.activeKeyId,
      iv.toString('base64url'),
      encrypted.toString('base64url'),
      tag.toString('base64url'),
    ].join(':');
  }

  decrypt(value: string) {
    if (!value) {
      return value;
    }
    if (!this.isEncrypted(value)) {
      if (this.production) {
        throw new Error('Unencrypted social credentials are not accepted.');
      }
      return value;
    }

    const [keyId, iv, encrypted, tag] = this.envelopeParts(value);
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Social credential encryption key ${keyId} is missing.`);
    }

    try {
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAAD(Buffer.from(this.aad(keyId)));
      decipher.setAuthTag(tag);
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new Error('A stored social credential could not be authenticated.');
    }
  }

  encryptFields<T extends CredentialFields>(fields: T): T {
    return {
      ...fields,
      token: this.encrypt(fields.token),
      refreshToken:
        fields.refreshToken == null
          ? fields.refreshToken
          : this.encrypt(fields.refreshToken),
    } as T;
  }

  decryptFields<T extends CredentialFields>(fields: T): T {
    return {
      ...fields,
      token: this.decrypt(fields.token),
      refreshToken:
        fields.refreshToken == null
          ? fields.refreshToken
          : this.decrypt(fields.refreshToken),
    } as T;
  }

  private aad(keyId: string) {
    return `socialflow:credential:v1:${keyId}`;
  }

  private envelopeParts(value: string) {
    const parts = value.split(':');
    if (
      parts.length !== 6 ||
      parts[0] !== 'sfenc' ||
      parts[1] !== 'v1' ||
      !KEY_ID_PATTERN.test(parts[2])
    ) {
      throw new Error('The stored social credential envelope is invalid.');
    }

    const iv = Buffer.from(parts[3], 'base64url');
    const encrypted = Buffer.from(parts[4], 'base64url');
    const tag = Buffer.from(parts[5], 'base64url');
    if (iv.length !== 12 || tag.length !== 16) {
      throw new Error('The stored social credential envelope is invalid.');
    }
    return [parts[2], iv, encrypted, tag] as const;
  }
}
