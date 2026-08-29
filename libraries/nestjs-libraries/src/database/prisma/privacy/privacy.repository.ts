import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import {
  AuditEventInput,
  hashAuditIp,
  sanitizeAuditMetadata,
} from './audit.event';

@Injectable()
export class PrivacyRepository {
  constructor(
    private _auditEvent: PrismaRepository<'auditEvent'>,
    private _consentPreference: PrismaRepository<'consentPreference'>,
    private _organization: PrismaRepository<'organization'>,
    private _post: PrismaRepository<'post'>,
    private _media: PrismaRepository<'media'>,
    private _integration: PrismaRepository<'integration'>,
    private _userOrganization: PrismaRepository<'userOrganization'>
  ) {}

  createAuditEvent(input: AuditEventInput) {
    return this._auditEvent.model.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId || null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId || null,
        outcome: input.outcome,
        source: input.source,
        requestId: input.requestId || null,
        metadata: sanitizeAuditMetadata(input.metadata) as object | undefined,
        ipHash: hashAuditIp(input.ip),
      },
    });
  }

  listAuditEvents(organizationId: string, take = 100) {
    return this._auditEvent.model.auditEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(take, 1), 100),
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        outcome: true,
        source: true,
        requestId: true,
        metadata: true,
        ipHash: true,
        createdAt: true,
        actorUserId: true,
      },
    });
  }

  recordConsent(data: {
    organizationId: string;
    purpose: string;
    version: string;
    granted: boolean;
    recordedByUserId?: string | null;
  }) {
    return this._consentPreference.model.consentPreference.create({
      data: {
        organizationId: data.organizationId,
        purpose: data.purpose,
        version: data.version,
        granted: data.granted,
        recordedByUserId: data.recordedByUserId || null,
      },
    });
  }

  listConsent(organizationId: string) {
    return this._consentPreference.model.consentPreference.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async buildOrganizationExport(organizationId: string) {
    const [organization, members, posts, media, integrations] =
      await Promise.all([
        this._organization.model.organization.findFirst({
          where: { id: organizationId },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this._userOrganization.model.userOrganization.findMany({
          where: { organizationId },
          select: {
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
              },
            },
          },
        }),
        this._post.model.post.findMany({
          where: { organizationId, deletedAt: null },
          select: {
            id: true,
            content: true,
            publishDate: true,
            state: true,
            createdAt: true,
          },
          take: 1_000,
          orderBy: { createdAt: 'desc' },
        }),
        this._media.model.media.findMany({
          where: { organizationId, deletedAt: null },
          select: {
            id: true,
            name: true,
            path: true,
            alt: true,
            type: true,
            createdAt: true,
          },
          take: 1_000,
          orderBy: { createdAt: 'desc' },
        }),
        this._integration.model.integration.findMany({
          where: { organizationId, deletedAt: null },
          select: {
            id: true,
            name: true,
            providerIdentifier: true,
            profile: true,
            disabled: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      organization,
      members,
      posts,
      media,
      integrations,
      note: 'OAuth tokens, API secrets and raw credentials are excluded from exports.',
    };
  }
}
