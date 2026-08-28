import { randomUUID } from 'node:crypto';
import { PrismaClient, Role } from '@prisma/client';
import { OrganizationRepository } from './organization.repository';

const databaseDescribe =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

databaseDescribe('team invitation tenant isolation', () => {
  let prisma: PrismaClient;
  let repository: OrganizationRepository;
  const suffix = randomUUID();
  const organizationA = `invitation-tenant-a-${suffix}`;
  const organizationB = `invitation-tenant-b-${suffix}`;
  const inviterA = `inviter-tenant-a-${suffix}`;
  const inviterB = `inviter-tenant-b-${suffix}`;
  const invitee = `invitee-${suffix}`;
  const targetEmail = `invitee-${suffix}@example.test`;
  const wrongEmail = `wrong-${suffix}@example.test`;
  const tokenA = `invitation-token-a-${suffix}`;
  const tokenB = `invitation-token-b-${suffix}`;
  let invitationAId: string;
  let invitationBId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const model = { model: prisma } as never;
    repository = new OrganizationRepository(model, model, model, model, model);

    await prisma.organization.createMany({
      data: [
        { id: organizationA, name: 'Invitation tenant A' },
        { id: organizationB, name: 'Invitation tenant B' },
      ],
    });
    await prisma.user.createMany({
      data: [
        {
          id: inviterA,
          email: `inviter-a-${suffix}@example.test`,
          providerName: 'LOCAL',
          timezone: 0,
        },
        {
          id: inviterB,
          email: `inviter-b-${suffix}@example.test`,
          providerName: 'LOCAL',
          timezone: 0,
        },
        {
          id: invitee,
          email: targetEmail,
          providerName: 'LOCAL',
          timezone: 0,
        },
      ],
    });

    invitationAId = (
      await repository.createTeamInvitation({
        organizationId: organizationA,
        email: targetEmail,
        role: Role.EDITOR,
        tokenHash: tokenA,
        invitedByUserId: inviterA,
        expiresAt: new Date(Date.now() + 3_600_000),
      })
    ).id;
    invitationBId = (
      await repository.createTeamInvitation({
        organizationId: organizationB,
        email: targetEmail,
        role: Role.VIEWER,
        tokenHash: tokenB,
        invitedByUserId: inviterB,
        expiresAt: new Date(Date.now() + 3_600_000),
      })
    ).id;
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    await prisma.userOrganization.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.teamInvitation.deleteMany({
      where: { organizationId: { in: [organizationA, organizationB] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [inviterA, inviterB, invitee] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [organizationA, organizationB] } },
    });
    await prisma.$disconnect();
  });

  it('lists and revokes invitations only inside the selected organization', async () => {
    await expect(
      repository.listTeamInvitations(organizationA)
    ).resolves.toEqual([
      expect.objectContaining({ id: invitationAId, email: targetEmail }),
    ]);
    await expect(
      repository.revokeTeamInvitation(organizationA, invitationBId)
    ).resolves.toMatchObject({ count: 0 });
    await expect(
      prisma.teamInvitation.findUnique({ where: { id: invitationBId } })
    ).resolves.toMatchObject({
      revokedAt: null,
      organizationId: organizationB,
    });
  });

  it('supersedes only the matching organization invitation', async () => {
    await repository.createTeamInvitation({
      organizationId: organizationA,
      email: targetEmail,
      role: Role.APPROVER,
      tokenHash: `invitation-token-a-replacement-${suffix}`,
      invitedByUserId: inviterA,
      expiresAt: new Date(Date.now() + 3_600_000),
    });

    await expect(
      prisma.teamInvitation.findUnique({ where: { id: invitationAId } })
    ).resolves.toEqual(
      expect.objectContaining({ revokedAt: expect.any(Date) })
    );
    await expect(
      prisma.teamInvitation.findUnique({ where: { id: invitationBId } })
    ).resolves.toMatchObject({
      revokedAt: null,
      organizationId: organizationB,
    });
  });

  it('binds acceptance to email and creates membership only in the invited tenant', async () => {
    await expect(
      repository.acceptTeamInvitation(tokenB, {
        id: invitee,
        email: wrongEmail,
      })
    ).resolves.toBeNull();
    await expect(
      repository.acceptTeamInvitation(tokenB, {
        id: invitee,
        email: targetEmail,
      })
    ).resolves.toMatchObject({
      userId: invitee,
      organizationId: organizationB,
      role: Role.VIEWER,
    });
    await expect(
      prisma.userOrganization.findMany({ where: { userId: invitee } })
    ).resolves.toEqual([
      expect.objectContaining({
        organizationId: organizationB,
        disabled: false,
      }),
    ]);
  });
});
