import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { hashApiCredentialSecret } from './api.credential.secret';

@Injectable()
export class ApiCredentialRepository {
  constructor(private _apiCredential: PrismaRepository<'apiCredential'>) {}

  create(data: {
    organizationId: string;
    createdByUserId: string;
    name: string;
    prefix: string;
    secretHash: string;
    scopes: string[];
    expiresAt?: Date | null;
  }) {
    return this._apiCredential.model.apiCredential.create({
      data: {
        organizationId: data.organizationId,
        createdByUserId: data.createdByUserId,
        name: data.name,
        prefix: data.prefix,
        secretHash: data.secretHash,
        scopes: data.scopes,
        expiresAt: data.expiresAt || null,
      },
    });
  }

  listForOrganization(organizationId: string) {
    return this._apiCredential.model.apiCredential.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
        createdByUserId: true,
      },
    });
  }

  findActiveBySecret(secret: string) {
    const secretHash = hashApiCredentialSecret(secret);
    const now = new Date();
    return this._apiCredential.model.apiCredential.findFirst({
      where: {
        secretHash,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    });
  }

  touchLastUsed(organizationId: string, id: string) {
    return this._apiCredential.model.apiCredential.updateMany({
      where: { id, organizationId, revokedAt: null },
      data: { lastUsedAt: new Date() },
    });
  }

  revoke(organizationId: string, id: string) {
    return this._apiCredential.model.apiCredential.updateMany({
      where: { id, organizationId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
