import { PostsRepository } from './posts.repository';

const createRepository = (
  transaction: Record<string, any>,
  postApproval: Record<string, any> = {}
) =>
  new PostsRepository(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { model: { postApprovalRequest: postApproval } } as never,
    {
      model: {
        $transaction: (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      },
    } as never
  );

describe('post approval persistence', () => {
  it('bounds the pending review queue while returning an accurate total', async () => {
    const postApproval = {
      count: jest.fn().mockResolvedValue(81),
      findMany: jest.fn().mockResolvedValue([{ id: 'approval' }]),
    };
    const repository = createRepository({}, postApproval);

    await expect(
      repository.getPendingPostApprovals('organization')
    ).resolves.toEqual({ items: [{ id: 'approval' }], total: 81 });
    expect(postApproval.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });

  it('creates one tenant-scoped pending request only for draft posts', async () => {
    const transaction = {
      post: {
        findMany: jest.fn().mockResolvedValue([{ state: 'DRAFT' }]),
      },
      postApprovalRequest: {
        upsert: jest.fn().mockResolvedValue({ id: 'approval' }),
      },
    };
    const repository = createRepository(transaction);

    await repository.requestPostApproval(
      'organization',
      'group',
      'requester',
      'Please review'
    );

    expect(transaction.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'organization',
          group: 'group',
          deletedAt: null,
        }),
      })
    );
    expect(transaction.postApprovalRequest.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { activeKey: 'organization:group' },
        create: expect.objectContaining({
          organizationId: 'organization',
          postGroup: 'group',
          requestedByUserId: 'requester',
        }),
      })
    );
  });

  it('rejects approval requests when any post is no longer a draft', async () => {
    const transaction = {
      post: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ state: 'DRAFT' }, { state: 'QUEUE' }]),
      },
      postApprovalRequest: { upsert: jest.fn() },
    };
    const repository = createRepository(transaction);

    await expect(
      repository.requestPostApproval('organization', 'group', 'requester')
    ).resolves.toBeNull();
    expect(transaction.postApprovalRequest.upsert).not.toHaveBeenCalled();
  });

  it('claims a pending decision atomically within its organization', async () => {
    const transaction = {
      post: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { state: 'DRAFT', updatedAt: new Date('2026-08-27T09:00:00Z') },
          ]),
      },
      postApprovalRequest: {
        findFirst: jest.fn().mockResolvedValue({
          postGroup: 'group',
          requestedAt: new Date('2026-08-27T10:00:00Z'),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'approval',
          status: 'APPROVED',
        }),
      },
    };
    const repository = createRepository(transaction);

    await repository.decidePostApproval(
      'organization',
      'approval',
      'approver',
      'APPROVED'
    );

    expect(transaction.postApprovalRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'approval',
          organizationId: 'organization',
          status: 'PENDING',
        }),
        data: expect.objectContaining({
          activeKey: null,
          decidedByUserId: 'approver',
          status: 'APPROVED',
        }),
      })
    );
  });

  it('cancels a pending decision when its draft changed after submission', async () => {
    const transaction = {
      post: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { state: 'DRAFT', updatedAt: new Date('2026-08-27T11:00:00Z') },
          ]),
      },
      postApprovalRequest: {
        findFirst: jest.fn().mockResolvedValue({
          postGroup: 'group',
          requestedAt: new Date('2026-08-27T10:00:00Z'),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
      },
    };
    const repository = createRepository(transaction);

    await expect(
      repository.decidePostApproval(
        'organization',
        'approval',
        'approver',
        'APPROVED'
      )
    ).resolves.toBeNull();
    expect(transaction.postApprovalRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'organization' }),
        data: expect.objectContaining({
          activeKey: null,
          status: 'CANCELLED',
        }),
      })
    );
    expect(transaction.postApprovalRequest.findUnique).not.toHaveBeenCalled();
  });

  it('only lets the tenant-scoped requester cancel a pending request', async () => {
    const postApproval = {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    };
    const repository = createRepository({}, postApproval);

    await repository.cancelPostApproval(
      'organization',
      'approval',
      'requester'
    );

    expect(postApproval.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'approval',
          organizationId: 'organization',
          requestedByUserId: 'requester',
          status: 'PENDING',
        }),
      })
    );
  });
});
