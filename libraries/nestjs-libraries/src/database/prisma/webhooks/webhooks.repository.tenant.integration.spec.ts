import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { WebhooksRepository } from './webhooks.repository';

const databaseDescribe =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

databaseDescribe('webhooks repository tenant isolation', () => {
  let prisma: PrismaClient;
  let repository: WebhooksRepository;
  const suffix = randomUUID();
  const organizationA = `webhook-tenant-a-${suffix}`;
  const organizationB = `webhook-tenant-b-${suffix}`;
  const integrationA = `webhook-tenant-a-channel-${suffix}`;
  const integrationB = `webhook-tenant-b-channel-${suffix}`;
  const webhookB = `webhook-tenant-b-endpoint-${suffix}`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const model = { model: prisma } as never;
    repository = new WebhooksRepository(model, model);

    await prisma.organization.createMany({
      data: [
        { id: organizationA, name: 'Webhook tenant A' },
        { id: organizationB, name: 'Webhook tenant B' },
      ],
    });
    await prisma.integration.createMany({
      data: [
        {
          id: integrationA,
          internalId: integrationA,
          organizationId: organizationA,
          name: 'Tenant A channel',
          providerIdentifier: 'socialflow-test',
          type: 'social',
          token: 'webhook-test-token-a',
        },
        {
          id: integrationB,
          internalId: integrationB,
          organizationId: organizationB,
          name: 'Tenant B channel',
          providerIdentifier: 'socialflow-test',
          type: 'social',
          token: 'webhook-test-token-b',
        },
      ],
    });
    await prisma.webhooks.create({
      data: {
        id: webhookB,
        organizationId: organizationB,
        name: 'Tenant B webhook',
        url: 'https://webhook.example/tenant-b',
        integrations: { create: { integrationId: integrationB } },
      },
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    await prisma.integrationsWebhooks.deleteMany({
      where: {
        webhook: { organizationId: { in: [organizationA, organizationB] } },
      },
    });
    await prisma.webhooks.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.integration.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [organizationA, organizationB] } },
    });
    await prisma.$disconnect();
  });

  it('rejects another organization channel without creating a webhook', async () => {
    await expect(
      repository.createWebhook(organizationA, {
        id: '',
        name: 'Cross-tenant webhook',
        url: 'https://webhook.example/rejected',
        integrations: [{ id: integrationB }],
      })
    ).rejects.toThrow('One or more selected channels are unavailable.');
    await expect(repository.getTotal(organizationA)).resolves.toBe(0);
  });

  it('cannot update or delete another organization webhook', async () => {
    await expect(
      repository.createWebhook(organizationA, {
        id: webhookB,
        name: 'Cross-tenant replacement',
        url: 'https://webhook.example/replacement',
        integrations: [{ id: integrationA }],
      })
    ).rejects.toBeDefined();
    await expect(
      repository.deleteWebhook(organizationA, webhookB)
    ).rejects.toBeDefined();

    await expect(
      prisma.webhooks.findUnique({ where: { id: webhookB } })
    ).resolves.toMatchObject({
      name: 'Tenant B webhook',
      organizationId: organizationB,
      deletedAt: null,
    });
  });

  it('creates only de-duplicated relationships to owned channels', async () => {
    const created = await repository.createWebhook(organizationA, {
      id: '',
      name: 'Tenant A webhook',
      url: 'https://webhook.example/tenant-a',
      integrations: [{ id: integrationA }, { id: integrationA }],
    });

    await expect(
      prisma.integrationsWebhooks.count({
        where: { webhookId: created.id, integrationId: integrationA },
      })
    ).resolves.toBe(1);
    await expect(repository.getWebhooks(organizationA)).resolves.toEqual([
      expect.objectContaining({
        id: created.id,
        organizationId: organizationA,
      }),
    ]);
  });
});
