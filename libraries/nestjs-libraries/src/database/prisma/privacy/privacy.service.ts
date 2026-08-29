import { BadRequestException, Injectable } from '@nestjs/common';
import { PrivacyRepository } from './privacy.repository';
import { AuthService } from '@gitroom/helpers/auth/auth.service';
import { UsersService } from '@gitroom/nestjs-libraries/database/prisma/users/users.service';

@Injectable()
export class PrivacyService {
  constructor(
    private _privacyRepository: PrivacyRepository,
    private _usersService: UsersService
  ) {}

  listAudit(organizationId: string) {
    return this._privacyRepository.listAuditEvents(organizationId);
  }

  listConsent(organizationId: string) {
    return this._privacyRepository.listConsent(organizationId);
  }

  async recordConsent(
    organizationId: string,
    userId: string,
    body: { purpose: string; version: string; granted: boolean },
    ip?: string
  ) {
    const purpose = body.purpose.trim();
    const version = body.version.trim();
    if (!purpose || !version) {
      throw new BadRequestException('Purpose and version are required');
    }

    const row = await this._privacyRepository.recordConsent({
      organizationId,
      purpose,
      version,
      granted: Boolean(body.granted),
      recordedByUserId: userId,
    });

    await this._privacyRepository.createAuditEvent({
      organizationId,
      actorUserId: userId,
      action: 'consent.record',
      targetType: 'consent',
      targetId: row.id,
      outcome: 'success',
      source: 'website',
      metadata: { purpose, version, granted: body.granted },
      ip,
    });

    return row;
  }

  async exportOrganization(
    organizationId: string,
    userId: string,
    ip?: string
  ) {
    const payload = await this._privacyRepository.buildOrganizationExport(
      organizationId
    );
    await this._privacyRepository.createAuditEvent({
      organizationId,
      actorUserId: userId,
      action: 'privacy.export',
      targetType: 'organization',
      targetId: organizationId,
      outcome: 'success',
      source: 'website',
      metadata: {
        members: payload.members.length,
        posts: payload.posts.length,
      },
      ip,
    });
    return payload;
  }

  async requestDeletion(
    organizationId: string,
    userId: string,
    password: string,
    ip?: string
  ) {
    const user = await this._usersService.getUserById(userId);
    if (
      !user?.password ||
      !AuthService.comparePassword(password, user.password)
    ) {
      await this._privacyRepository.createAuditEvent({
        organizationId,
        actorUserId: userId,
        action: 'privacy.deletion_request',
        targetType: 'organization',
        targetId: organizationId,
        outcome: 'denied',
        source: 'website',
        metadata: { reason: 'reauthentication_failed' },
        ip,
      });
      throw new BadRequestException('Re-authentication failed');
    }

    await this._privacyRepository.createAuditEvent({
      organizationId,
      actorUserId: userId,
      action: 'privacy.deletion_request',
      targetType: 'organization',
      targetId: organizationId,
      outcome: 'requested',
      source: 'website',
      metadata: {
        note: 'Manual operator completion required until automated purge lands.',
      },
      ip,
    });

    return {
      status: 'requested',
      message:
        'Deletion has been requested and audited. An operator must complete purge across app data, media, logs and backups once legal retention rules are decided.',
    };
  }
}
