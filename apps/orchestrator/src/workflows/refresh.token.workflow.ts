import {
  continueAsNew,
  patched,
  proxyActivities,
  sleep,
} from '@temporalio/workflow';
import { IntegrationsActivity } from '@gitroom/orchestrator/activities/integrations.activity';

const {
  getIntegrationsById,
  getIntegrationMetadataById,
  refreshToken,
  refreshTokenById,
} = proxyActivities<IntegrationsActivity>({
  startToCloseTimeout: '10 minute',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 1,
    initialInterval: '2 minutes',
  },
});

export async function refreshTokenWorkflow({
  organizationId,
  integrationId,
}: {
  integrationId: string;
  organizationId: string;
}) {
  if (patched('social-credential-refresh-history-boundary-v1')) {
    let integration = await getIntegrationMetadataById(
      organizationId,
      integrationId
    );
    if (
      !integration ||
      integration.deletedAt ||
      integration.inBetweenSteps ||
      integration.refreshNeeded
    ) {
      return false;
    }

    const wait = Math.max(
      0,
      new Date(integration.tokenExpiration).getTime() - new Date().getTime()
    );
    if (!wait) {
      return false;
    }
    await sleep(wait);

    integration = await getIntegrationMetadataById(
      organizationId,
      integrationId
    );
    if (
      !integration ||
      integration.deletedAt ||
      integration.inBetweenSteps ||
      integration.refreshNeeded
    ) {
      return false;
    }

    if (!(await refreshTokenById(organizationId, integrationId))) {
      return false;
    }
    return await continueAsNew({ organizationId, integrationId });
  }

  while (true) {
    let integration = await getIntegrationsById(integrationId, organizationId);
    if (
      !integration ||
      integration.deletedAt ||
      integration.inBetweenSteps ||
      integration.refreshNeeded
    ) {
      return false;
    }

    const today = new Date();
    const endDate = new Date(integration.tokenExpiration);

    const minMax = Math.max(0, endDate.getTime() - today.getTime());
    if (!minMax) {
      return false;
    }

    await sleep(minMax as number);

    // while we were sleeping, the integration might have been deleted
    integration = await getIntegrationsById(integrationId, organizationId);
    if (
      !integration ||
      integration.deletedAt ||
      integration.inBetweenSteps ||
      integration.refreshNeeded
    ) {
      return false;
    }

    await refreshToken(integration);
  }
}
