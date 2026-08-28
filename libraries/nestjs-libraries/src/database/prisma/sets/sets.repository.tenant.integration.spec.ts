import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { SetsRepository } from './sets.repository';

const databaseDescribe =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

databaseDescribe('sets repository tenant isolation', () => {
  let prisma: PrismaClient;
  let repository: SetsRepository;
  const suffix = randomUUID();
  const organizationA = `set-tenant-a-${suffix}`;
  const organizationB = `set-tenant-b-${suffix}`;
  const setA = `set-tenant-a-content-${suffix}`;
  const setB = `set-tenant-b-content-${suffix}`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new SetsRepository({ model: prisma } as never);

    await prisma.organization.createMany({
      data: [
        { id: organizationA, name: 'Set tenant A' },
        { id: organizationB, name: 'Set tenant B' },
      ],
    });
    await prisma.sets.createMany({
      data: [
        {
          id: setA,
          organizationId: organizationA,
          name: 'Tenant A template',
          content: 'Tenant A content',
        },
        {
          id: setB,
          organizationId: organizationB,
          name: 'Tenant B template',
          content: 'Tenant B content',
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    await prisma.sets.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [organizationA, organizationB] } },
    });
    await prisma.$disconnect();
  });

  it('lists and counts only the selected organization sets', async () => {
    await expect(repository.getTotal(organizationA)).resolves.toBe(1);
    await expect(repository.getSets(organizationA)).resolves.toEqual([
      expect.objectContaining({
        id: setA,
        organizationId: organizationA,
      }),
    ]);
  });

  it('cannot update or delete another organization set', async () => {
    await expect(
      repository.createSet(organizationA, {
        id: setB,
        name: 'Cross-tenant replacement',
        content: 'Cross-tenant content',
      })
    ).rejects.toBeDefined();
    await expect(
      repository.deleteSet(organizationA, setB)
    ).rejects.toBeDefined();

    await expect(
      prisma.sets.findUnique({ where: { id: setB } })
    ).resolves.toMatchObject({
      name: 'Tenant B template',
      content: 'Tenant B content',
      organizationId: organizationB,
    });
  });

  it('creates a new set inside the selected organization', async () => {
    const created = await repository.createSet(organizationA, {
      name: 'Tenant A second template',
      content: 'Tenant A second content',
    });

    await expect(
      prisma.sets.findUnique({ where: { id: created.id } })
    ).resolves.toMatchObject({ organizationId: organizationA });
  });
});
