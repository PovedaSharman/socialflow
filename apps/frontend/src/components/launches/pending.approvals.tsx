'use client';

import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import useSWR from 'swr';

type PendingApproval = {
  id: string;
  postGroup: string;
  requestNote: string | null;
  requestedAt: string;
  requestedBy: { name: string | null; email: string } | null;
};

type PendingApprovalQueue = {
  items: PendingApproval[];
  total: number;
};

export function PendingApprovals() {
  const fetch = useFetch();
  const user = useUser();
  const t = useT();
  const role =
    user?.role === 'SUPERADMIN'
      ? 'OWNER'
      : user?.role === 'USER'
      ? 'EDITOR'
      : user?.role;
  const canApprove =
    role === 'OWNER' || role === 'ADMIN' || role === 'APPROVER';
  const { data, error, isLoading } = useSWR<PendingApprovalQueue>(
    canApprove ? '/api/pending-post-approvals' : null,
    async () => {
      const response = await fetch('/posts/approvals/pending');
      if (!response.ok) {
        throw new Error('Could not load pending approvals');
      }
      return response.json();
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  if (!canApprove) {
    return null;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-[12px] border border-red-500/40 bg-red-500/10 p-[12px] text-[14px]"
      >
        {t(
          'could_not_load_pending_approvals',
          'Pending approvals could not be loaded. Refresh to try again.'
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="rounded-[12px] border border-newBorder p-[12px] text-[14px]"
      >
        {t('loading_pending_approvals', 'Loading pending approvals…')}
      </div>
    );
  }

  if (!data?.items.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="pending-approvals-title"
      className="rounded-[12px] border border-newBorder bg-newBgColor p-[12px]"
    >
      <div className="flex flex-col gap-[8px] sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h2 id="pending-approvals-title" className="font-[600]">
            {t('pending_approvals', 'Pending approvals')} ({data.total})
          </h2>
          <p className="text-[13px] text-customColor18">
            {t(
              'pending_approvals_help',
              'Open a draft to review its content, request changes or approve it.'
            )}
          </p>
        </div>
        <a
          href="/launches?state=draft"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[8px] bg-btnSimple px-[14px] font-[600] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {t('review_drafts', 'Review drafts')}
        </a>
      </div>
      <ul className="mt-[10px] grid gap-[8px] md:grid-cols-2 xl:grid-cols-3">
        {data.items.slice(0, 6).map((approval) => (
          <li
            key={approval.id}
            className="min-w-0 rounded-[8px] border border-newBorder px-[10px] py-[8px] text-[13px]"
          >
            <div className="truncate font-[600]">
              {approval.requestedBy?.name ||
                approval.requestedBy?.email ||
                t('deleted_user', 'Former team member')}
            </div>
            <div className="truncate text-customColor18">
              {approval.requestNote ||
                t('approval_requested_without_note', 'Approval requested')}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
