import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import {
  AuthorizationActions,
  Sections,
} from '@gitroom/backend/services/auth/permissions/permission.exception.class';
import { ApiCredentialService } from '@gitroom/nestjs-libraries/database/prisma/api-credentials/api.credential.service';
import { CreateApiCredentialDto } from '@gitroom/nestjs-libraries/dtos/api-credentials/create.api.credential.dto';

@ApiTags('API Credentials')
@Controller('/user/api-credentials')
export class ApiCredentialsController {
  constructor(private _apiCredentialService: ApiCredentialService) {}

  @Get('/')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  list(@GetOrgFromRequest() org: Organization) {
    return this._apiCredentialService.list(org.id);
  }

  @Post('/')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  create(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: CreateApiCredentialDto
  ) {
    return this._apiCredentialService.create(org.id, user.id, body);
  }

  @Delete('/:id')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  revoke(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string
  ) {
    return this._apiCredentialService.revoke(org.id, id, user.id);
  }
}
