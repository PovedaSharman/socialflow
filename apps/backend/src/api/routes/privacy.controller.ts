import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import {
  AuthorizationActions,
  Sections,
} from '@gitroom/backend/services/auth/permissions/permission.exception.class';
import { PrivacyService } from '@gitroom/nestjs-libraries/database/prisma/privacy/privacy.service';
import {
  RecordConsentDto,
  RequestDeletionDto,
} from '@gitroom/nestjs-libraries/dtos/privacy/privacy.dto';

@ApiTags('Privacy')
@Controller('/user/privacy')
export class PrivacyController {
  constructor(private _privacyService: PrivacyService) {}

  @Get('/audit')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  listAudit(@GetOrgFromRequest() org: Organization) {
    return this._privacyService.listAudit(org.id);
  }

  @Get('/consent')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  listConsent(@GetOrgFromRequest() org: Organization) {
    return this._privacyService.listConsent(org.id);
  }

  @Post('/consent')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  recordConsent(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: RecordConsentDto,
    @Req() req: { ip?: string }
  ) {
    return this._privacyService.recordConsent(org.id, user.id, body, req.ip);
  }

  @Get('/export')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  exportOrganization(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Req() req: { ip?: string }
  ) {
    return this._privacyService.exportOrganization(org.id, user.id, req.ip);
  }

  @Post('/deletion-request')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  requestDeletion(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: RequestDeletionDto,
    @Req() req: { ip?: string }
  ) {
    return this._privacyService.requestDeletion(
      org.id,
      user.id,
      body.password,
      req.ip
    );
  }
}
