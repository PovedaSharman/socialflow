import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const repository = read(
  'libraries/nestjs-libraries/src/database/prisma/posts/posts.repository.ts'
);
const controller = read('apps/backend/src/api/routes/posts.controller.ts');
const schema = read(
  'libraries/nestjs-libraries/src/database/prisma/schema.prisma'
);
const permissions = read(
  'apps/backend/src/services/auth/permissions/permissions.service.ts'
);

const section = (source, start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  return from >= 0 && to > from ? source.slice(from, to) : '';
};

const request = section(
  repository,
  'async requestPostApproval(',
  'async getLatestPostApproval('
);
const pending = section(
  repository,
  'async getPendingPostApprovals(',
  'decidePostApproval('
);
const decision = section(
  repository,
  'decidePostApproval(',
  'cancelPostApproval('
);
const cancellation = section(
  repository,
  'cancelPostApproval(',
  'searchForMissingThreeHoursPosts('
);

const requirements = [
  [
    schema.includes('model PostApprovalRequest') &&
      schema.includes('activeKey         String?            @unique'),
    'Approval persistence must retain a unique active request key.',
  ],
  [
    request.includes('$transaction') &&
      request.includes('organizationId') &&
      request.includes("post.state !== 'DRAFT'") &&
      request.includes('deletedAt: null'),
    'Approval requests must atomically validate tenant-scoped draft posts.',
  ],
  [
    pending.includes('count({') && pending.includes('take: 50'),
    'The pending approval queue must return a total and remain bounded.',
  ],
  [
    decision.includes('organizationId') &&
      decision.includes("post.state === 'DRAFT'") &&
      decision.includes('post.updatedAt <= pending.requestedAt') &&
      decision.includes('updateMany({'),
    'Approval decisions must revalidate current tenant-scoped draft content.',
  ],
  [
    cancellation.includes('organizationId') &&
      cancellation.includes('requestedByUserId') &&
      cancellation.includes("status: 'PENDING'"),
    'Cancellation must remain tenant-, requester-, and state-scoped.',
  ],
  [
    controller.includes("@Get('/approvals/pending')") &&
      controller.includes(
        '@CheckPolicies([AuthorizationActions.Read, Sections.APPROVAL])'
      ) &&
      controller.includes("@Post('/approvals/:id/decision')") &&
      controller.includes(
        '@CheckPolicies([AuthorizationActions.Update, Sections.APPROVAL])'
      ),
    'Approval review routes must retain explicit approval policies.',
  ],
  [
    permissions.indexOf('section === Sections.APPROVAL') <
      permissions.indexOf('action === AuthorizationActions.Read'),
    'Approval reads must be role-checked before the general read allowance.',
  ],
];

const failures = requirements
  .filter(([passed]) => !passed)
  .map(([, message]) => message);

if (failures.length > 0) {
  process.stderr.write(
    `Approval-safety audit failed:\n${failures.join('\n')}\n`
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Approval-safety audit passed (${requirements.length} invariants).\n`
  );
}
