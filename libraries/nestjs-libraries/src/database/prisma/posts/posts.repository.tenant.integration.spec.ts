import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PostsRepository } from './posts.repository';
import { SocialCredentialEncryptionService } from '@gitroom/nestjs-libraries/security/social-credential-encryption.service';

const databaseDescribe =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

databaseDescribe('posts repository tenant isolation', () => {
  let prisma: PrismaClient;
  let repository: PostsRepository;
  const suffix = randomUUID();
  const organizationA = `tenant-a-${suffix}`;
  const organizationB = `tenant-b-${suffix}`;
  const integrationA = `integration-a-${suffix}`;
  const integrationB = `integration-b-${suffix}`;
  const postA = `post-a-${suffix}`;
  const postB = `post-b-${suffix}`;
  const groupA = `group-a-${suffix}`;
  const groupB = `group-b-${suffix}`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const model = { model: prisma } as never;
    repository = new PostsRepository(
      model,
      model,
      model,
      model,
      model,
      model,
      model,
      model,
      new SocialCredentialEncryptionService()
    );

    await prisma.organization.createMany({
      data: [
        { id: organizationA, name: 'Tenant A' },
        { id: organizationB, name: 'Tenant B' },
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
          token: 'test-token-a',
        },
        {
          id: integrationB,
          internalId: integrationB,
          organizationId: organizationB,
          name: 'Tenant B channel',
          providerIdentifier: 'socialflow-test',
          type: 'social',
          token: 'test-token-b',
        },
      ],
    });
    await prisma.post.createMany({
      data: [
        {
          id: postA,
          organizationId: organizationA,
          integrationId: integrationA,
          publishDate: new Date('2030-01-01T10:00:00Z'),
          content: 'Tenant A draft',
          group: groupA,
          state: 'DRAFT',
        },
        {
          id: postB,
          organizationId: organizationB,
          integrationId: integrationB,
          publishDate: new Date('2030-01-01T11:00:00Z'),
          content: 'Tenant B draft',
          group: groupB,
          state: 'DRAFT',
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    await prisma.postApprovalRequest.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.post.deleteMany({
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

  it('returns no group or post when another organization owns it', async () => {
    await expect(
      repository.getPostsByGroup(organizationA, groupB)
    ).resolves.toEqual([]);
    await expect(repository.getPostById(postB, organizationA)).resolves.toBe(
      null
    );
  });

  it('cannot delete another organization post group', async () => {
    await expect(repository.deletePost(organizationA, groupB)).resolves.toBe(
      null
    );
    await expect(
      prisma.post.findUnique({ where: { id: postB } })
    ).resolves.toMatchObject({ deletedAt: null });
  });

  it('cannot create an approval request for another organization draft', async () => {
    await expect(
      repository.requestPostApproval(
        organizationA,
        groupB,
        `requester-${suffix}`
      )
    ).resolves.toBeNull();
    await expect(
      prisma.postApprovalRequest.count({
        where: { organizationId: organizationA, postGroup: groupB },
      })
    ).resolves.toBe(0);
  });
});
