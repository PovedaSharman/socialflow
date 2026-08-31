import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { MediaRepository } from './media.repository';

const databaseDescribe =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

databaseDescribe('media repository tenant isolation', () => {
  let prisma: PrismaClient;
  let repository: MediaRepository;
  const suffix = randomUUID();
  const organizationA = `media-tenant-a-${suffix}`;
  const organizationB = `media-tenant-b-${suffix}`;
  const mediaA = `media-tenant-a-file-${suffix}`;
  const mediaB = `media-tenant-b-file-${suffix}`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new MediaRepository({ model: prisma } as never);

    await prisma.organization.createMany({
      data: [
        { id: organizationA, name: 'Media tenant A' },
        { id: organizationB, name: 'Media tenant B' },
      ],
    });
    await prisma.media.createMany({
      data: [
        {
          id: mediaA,
          organizationId: organizationA,
          name: 'tenant-a.png',
          originalName: 'Tenant A image',
          path: '/tenant-a.png',
        },
        {
          id: mediaB,
          organizationId: organizationB,
          name: 'tenant-b.png',
          originalName: 'Tenant B image',
          path: '/tenant-b.png',
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    await prisma.media.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [organizationA, organizationB] } },
    });
    await prisma.$disconnect();
  });

  it('returns only active media owned by the selected organization', async () => {
    await expect(repository.getMediaById(organizationA, mediaB)).resolves.toBe(
      null
    );

    const page = await repository.getMedia(organizationA, 1);
    expect(page.pages).toBe(1);
    expect(page.results).toEqual([
      expect.objectContaining({ id: mediaA, name: 'tenant-a.png' }),
    ]);
  });

  it('does not edit or delete another organization media', async () => {
    await expect(
      repository.saveMediaInformation(organizationA, {
        id: mediaB,
        alt: 'Cross-tenant alt text',
        thumbnail: '',
        thumbnailTimestamp: 0,
      })
    ).rejects.toBeDefined();
    await expect(
      repository.deleteMedia(organizationA, mediaB)
    ).resolves.toEqual({ count: 0 });

    await expect(
      prisma.media.findUnique({ where: { id: mediaB } })
    ).resolves.toMatchObject({
      alt: null,
      deletedAt: null,
      organizationId: organizationB,
    });
  });

  it('does not resolve soft-deleted media for post attachment', async () => {
    await repository.deleteMedia(organizationA, mediaA);
    await expect(repository.getMediaById(organizationA, mediaA)).resolves.toBe(
      null
    );
  });
});
