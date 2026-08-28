import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { IntegrationRepository } from './integration.repository';

const databaseDescribe =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

databaseDescribe('integration repository tenant isolation', () => {
  let prisma: PrismaClient;
  let repository: IntegrationRepository;
  const suffix = randomUUID();
  const organizationA = `integration-tenant-a-${suffix}`;
  const organizationB = `integration-tenant-b-${suffix}`;
  const integrationA = `integration-tenant-a-channel-${suffix}`;
  const integrationB = `integration-tenant-b-channel-${suffix}`;
  const sharedInternalId = `shared-provider-account-${suffix}`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const model = { model: prisma } as never;
    const credentialEncryption = {
      encrypt: (value: string) => value,
      decryptFields: <T>(value: T) => value,
    } as never;
    repository = new IntegrationRepository(
      model,
      model,
      model,
      model,
      model,
      model,
      credentialEncryption
    );

    await prisma.organization.createMany({
      data: [
        { id: organizationA, name: 'Integration tenant A' },
        { id: organizationB, name: 'Integration tenant B' },
      ],
    });
    await prisma.integration.createMany({
      data: [
        {
          id: integrationA,
          internalId: sharedInternalId,
          rootInternalId: sharedInternalId,
          organizationId: organizationA,
          name: 'Tenant A channel',
          providerIdentifier: 'socialflow-test',
          type: 'social',
          token: 'tenant-a-original-token',
          refreshToken: 'tenant-a-original-refresh',
        },
        {
          id: integrationB,
          internalId: sharedInternalId,
          rootInternalId: sharedInternalId,
          organizationId: organizationB,
          name: 'Tenant B channel',
          providerIdentifier: 'socialflow-test',
          type: 'social',
          token: 'tenant-b-original-token',
          refreshToken: 'tenant-b-original-refresh',
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    await prisma.integration.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [organizationA, organizationB] } },
    });
    await prisma.$disconnect();
  });

  it('does not expose another organization channel by ID or list', async () => {
    await expect(
      repository.getIntegrationById(organizationA, integrationB)
    ).resolves.toBeNull();
    await expect(
      repository.getIntegrationMetadataById(organizationA, integrationB)
    ).resolves.toBeNull();

    const channels = await repository.getIntegrationsList(organizationA);
    expect(channels).toEqual([
      expect.objectContaining({
        id: integrationA,
        organizationId: organizationA,
      }),
    ]);
    expect(channels[0]).not.toHaveProperty('token');
    expect(channels[0]).not.toHaveProperty('refreshToken');
  });

  it('does not mutate another organization channel', async () => {
    await expect(
      repository.updateProviderSettings(
        organizationA,
        integrationB,
        '{"crossTenant":true}'
      )
    ).rejects.toBeDefined();
    await expect(
      repository.disconnectChannel(organizationA, integrationB)
    ).rejects.toBeDefined();
    await expect(
      repository.updateNameAndUrl(
        organizationA,
        integrationB,
        'Cross-tenant nickname',
        'https://invalid.example/cross-tenant.png'
      )
    ).rejects.toBeDefined();
    await expect(
      repository.deleteChannel(organizationA, integrationB)
    ).rejects.toBeDefined();

    await expect(
      prisma.integration.findUnique({ where: { id: integrationB } })
    ).resolves.toMatchObject({
      additionalSettings: '[]',
      deletedAt: null,
      name: 'Tenant B channel',
      refreshNeeded: false,
    });
  });

  it('rotates one-time credentials only inside the active organization', async () => {
    await repository.createOrUpdateIntegration(
      undefined,
      true,
      organizationA,
      'Tenant A reconnected channel',
      undefined,
      'social',
      sharedInternalId,
      'socialflow-test',
      'tenant-a-rotated-token',
      'tenant-a-rotated-refresh'
    );

    await expect(
      prisma.integration.findUnique({ where: { id: integrationB } })
    ).resolves.toMatchObject({
      token: 'tenant-b-original-token',
      refreshToken: 'tenant-b-original-refresh',
      organizationId: organizationB,
    });
  });
});
