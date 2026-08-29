import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiCredentialRepository } from './api.credential.repository';
import {
  apiCredentialPublicView,
  createApiCredentialSecret,
  resolveApiCredentialScopes,
} from './api.credential.secret';
import { isMcpScope } from '@gitroom/nestjs-libraries/chat/mcp.scopes';
import { PrivacyRepository } from '@gitroom/nestjs-libraries/database/prisma/privacy/privacy.repository';

@Injectable()
export class ApiCredentialService {
  constructor(
    private _apiCredentialRepository: ApiCredentialRepository,
    private _privacyRepository: PrivacyRepository
  ) {}

  async create(
    organizationId: string,
    createdByUserId: string,
    body: { name: string; scopes?: string[]; expiresAt?: string }
  ) {
    const name = body.name.trim();
    if (!name) {
      throw new BadRequestException('Credential name is required');
    }

    const invalid = (body.scopes || []).filter((scope) => !isMcpScope(scope));
    if (invalid.length) {
      throw new BadRequestException(
        `Unsupported scopes: ${invalid.join(', ')}`
      );
    }

    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt);
      if (
        Number.isNaN(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now()
      ) {
        throw new BadRequestException('Expiry must be a future date');
      }
    }

    const created = createApiCredentialSecret();
    const scopes = resolveApiCredentialScopes(body.scopes);
    const row = await this._apiCredentialRepository.create({
      organizationId,
      createdByUserId,
      name,
      prefix: created.prefix,
      secretHash: created.secretHash,
      scopes,
      expiresAt,
    });

    await this._privacyRepository.createAuditEvent({
      organizationId,
      actorUserId: createdByUserId,
      action: 'api_credential.create',
      targetType: 'api_credential',
      targetId: row.id,
      outcome: 'success',
      source: 'website',
      metadata: {
        prefix: created.prefix,
        scopes,
        expiresAt: expiresAt?.toISOString() || null,
      },
    });

    return {
      ...apiCredentialPublicView(row),
      secret: created.secret,
    };
  }

  async list(organizationId: string) {
    const rows = await this._apiCredentialRepository.listForOrganization(
      organizationId
    );
    return rows.map(apiCredentialPublicView);
  }

  async revoke(
    organizationId: string,
    id: string,
    actorUserId?: string | null
  ) {
    const result = await this._apiCredentialRepository.revoke(
      organizationId,
      id
    );
    if (!result.count) {
      throw new BadRequestException('Credential not found or already revoked');
    }

    await this._privacyRepository.createAuditEvent({
      organizationId,
      actorUserId: actorUserId || null,
      action: 'api_credential.revoke',
      targetType: 'api_credential',
      targetId: id,
      outcome: 'success',
      source: 'website',
      metadata: { revoked: true },
    });

    return { id, revoked: true };
  }

  async resolveOrganizationBySecret(secret: string) {
    const credential = await this._apiCredentialRepository.findActiveBySecret(
      secret
    );
    if (!credential) {
      return null;
    }

    await this._apiCredentialRepository.touchLastUsed(
      credential.organizationId,
      credential.id
    );

    return {
      organization: credential.organization,
      scopes: credential.scopes,
      credentialId: credential.id,
    };
  }
}
