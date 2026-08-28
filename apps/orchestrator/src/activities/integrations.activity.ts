import { Injectable } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { Integration } from '@prisma/client';
import { RefreshIntegrationService } from '@gitroom/nestjs-libraries/integrations/refresh.integration.service';

@Injectable()
@Activity()
export class IntegrationsActivity {
  constructor(
    private _integrationService: IntegrationService,
    private _refreshIntegrationService: RefreshIntegrationService
  ) {}

  @ActivityMethod()
  async getIntegrationsById(id: string, orgId: string) {
    return this._integrationService.getIntegrationById(orgId, id);
  }

  @ActivityMethod()
  async getIntegrationMetadataById(orgId: string, id: string) {
    return this._integrationService.getIntegrationMetadataById(orgId, id);
  }

  async refreshToken(integration: Integration) {
    return this._refreshIntegrationService.refresh(integration);
  }

  @ActivityMethod()
  async refreshTokenById(orgId: string, id: string) {
    const integration = await this._integrationService.getIntegrationById(
      orgId,
      id
    );
    if (!integration) {
      return false;
    }
    return !!(await this._refreshIntegrationService.refresh(integration));
  }
}
