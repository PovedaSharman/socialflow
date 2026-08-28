import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { SubscriptionRepository } from './subscription.repository';

const databaseDescribe =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

databaseDescribe('subscription repository tenant isolation', () => {
  let prisma: PrismaClient;
  let repository: SubscriptionRepository;
  const suffix = randomUUID();
  const organizationA = `billing-tenant-a-${suffix}`;
  const organizationB = `billing-tenant-b-${suffix}`;
  const customerA = `cus_tenant_a_${suffix}`;
  const customerB = `cus_tenant_b_${suffix}`;
  const subscriptionA = `subscription-tenant-a-${suffix}`;
  const subscriptionB = `subscription-tenant-b-${suffix}`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const model = { model: prisma } as never;
    repository = new SubscriptionRepository(model, model, model, model, model);

    await prisma.organization.createMany({
      data: [
        { id: organizationA, name: 'Billing tenant A', paymentId: customerA },
        { id: organizationB, name: 'Billing tenant B', paymentId: customerB },
      ],
    });
    await prisma.subscription.createMany({
      data: [
        {
          organizationId: organizationA,
          identifier: subscriptionA,
          subscriptionTier: 'STANDARD',
          period: 'MONTHLY',
          totalChannels: 3,
          isLifetime: false,
        },
        {
          organizationId: organizationB,
          identifier: subscriptionB,
          subscriptionTier: 'STANDARD',
          period: 'MONTHLY',
          totalChannels: 4,
          isLifetime: false,
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    await prisma.credits.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.subscription.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [organizationA, organizationB] } },
    });
    await prisma.$disconnect();
  });

  it('resolves subscriptions and Stripe customers to one organization', async () => {
    await expect(
      repository.getSubscription(organizationA)
    ).resolves.toMatchObject({
      organizationId: organizationA,
      identifier: subscriptionA,
    });
    await expect(
      repository.getOrganizationByCustomerId(customerB)
    ).resolves.toMatchObject({ id: organizationB });
    await expect(
      repository.getSubscriptionByIdentifier(subscriptionB)
    ).resolves.toMatchObject({ organizationId: organizationB });
  });

  it('rejects assigning another organization Stripe customer', async () => {
    await expect(
      repository.updateCustomerId(organizationA, customerB)
    ).rejects.toBeDefined();
    await expect(
      prisma.organization.findUnique({ where: { id: organizationA } })
    ).resolves.toMatchObject({ paymentId: customerA });
  });

  it('routes a webhook update only to the customer organization', async () => {
    await repository.createOrUpdateSubscription(
      false,
      subscriptionB,
      customerB,
      12,
      'PRO',
      'YEARLY',
      null
    );

    await expect(
      repository.getSubscription(organizationB)
    ).resolves.toMatchObject({
      subscriptionTier: 'PRO',
      totalChannels: 12,
      period: 'YEARLY',
    });
    await expect(
      repository.getSubscription(organizationA)
    ).resolves.toMatchObject({
      subscriptionTier: 'STANDARD',
      totalChannels: 3,
    });
  });

  it('counts credits and deletion only for the routed organization', async () => {
    await prisma.credits.createMany({
      data: [
        { organizationId: organizationA, credits: 2, type: 'ai_images' },
        { organizationId: organizationB, credits: 7, type: 'ai_images' },
      ],
    });
    await expect(
      repository.getCreditsFrom(organizationA, dayjs().subtract(1, 'minute'))
    ).resolves.toBe(2);

    await repository.deleteSubscriptionByCustomerId(customerB);
    await expect(repository.getSubscription(organizationB)).resolves.toBeNull();
    await expect(
      repository.getSubscription(organizationA)
    ).resolves.toMatchObject({
      organizationId: organizationA,
    });
  });
});
