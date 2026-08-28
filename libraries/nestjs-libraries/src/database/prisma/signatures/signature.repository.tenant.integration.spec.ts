import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { SignatureRepository } from './signature.repository';

const databaseDescribe =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

databaseDescribe('signature repository tenant isolation', () => {
  let prisma: PrismaClient;
  let repository: SignatureRepository;
  const suffix = randomUUID();
  const organizationA = `signature-tenant-a-${suffix}`;
  const organizationB = `signature-tenant-b-${suffix}`;
  const signatureA = `signature-tenant-a-content-${suffix}`;
  const signatureB = `signature-tenant-b-content-${suffix}`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new SignatureRepository({ model: prisma } as never);

    await prisma.organization.createMany({
      data: [
        { id: organizationA, name: 'Signature tenant A' },
        { id: organizationB, name: 'Signature tenant B' },
      ],
    });
    await prisma.signatures.createMany({
      data: [
        {
          id: signatureA,
          organizationId: organizationA,
          content: 'Tenant A signature',
          autoAdd: true,
        },
        {
          id: signatureB,
          organizationId: organizationB,
          content: 'Tenant B signature',
          autoAdd: true,
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    await prisma.signatures.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [organizationA, organizationB] } },
    });
    await prisma.$disconnect();
  });

  it('lists and resolves only the selected organization signatures', async () => {
    await expect(
      repository.getSignaturesByOrgId(organizationA)
    ).resolves.toEqual([
      expect.objectContaining({
        id: signatureA,
        organizationId: organizationA,
      }),
    ]);
    await expect(
      repository.getDefaultSignature(organizationA)
    ).resolves.toMatchObject({
      id: signatureA,
      organizationId: organizationA,
    });
  });

  it('cannot update or delete another organization signature', async () => {
    await expect(
      repository.createOrUpdateSignature(
        organizationA,
        { content: 'Cross-tenant replacement', autoAdd: false },
        signatureB
      )
    ).rejects.toBeDefined();
    await expect(
      repository.deleteSignature(organizationA, signatureB)
    ).rejects.toBeDefined();

    await expect(
      prisma.signatures.findUnique({ where: { id: signatureB } })
    ).resolves.toMatchObject({
      content: 'Tenant B signature',
      organizationId: organizationB,
      deletedAt: null,
    });
  });

  it('changes the default only within the selected organization', async () => {
    const created = await repository.createOrUpdateSignature(organizationA, {
      content: 'Tenant A new default',
      autoAdd: true,
    });

    await expect(
      prisma.signatures.findUnique({ where: { id: signatureA } })
    ).resolves.toMatchObject({ autoAdd: false });
    await expect(
      prisma.signatures.findUnique({ where: { id: signatureB } })
    ).resolves.toMatchObject({ autoAdd: true, organizationId: organizationB });
    await expect(
      prisma.signatures.findUnique({ where: { id: created.id } })
    ).resolves.toMatchObject({ autoAdd: true, organizationId: organizationA });
  });
});
