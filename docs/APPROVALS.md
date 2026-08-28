# Post approvals

SocialFlow keeps content creation separate from publication authority.

## Roles

- Editors can create and update drafts, then request approval. They cannot
  schedule, update a scheduled post, or publish immediately.
- Approvers can review drafts, approve them or request changes, then schedule
  approved content.
- Owners and admins retain the approver capabilities.
- Viewers have read-only access.

Legacy `USER` memberships behave as editors and legacy `SUPERADMIN`
memberships behave as owners during the documented role migration.

## Workflow

1. Save the post as a draft.
2. Select **Request approval**. Each selected channel receives its own durable
   approval request because each channel can have different content.
3. An approver opens the pending drafts from the calendar banner, reviews the
   channel-specific preview, and chooses **Approve** or **Request changes**.
4. An approved draft remains a draft until an approver deliberately schedules
   it or chooses immediate publication. Approval never publishes content by
   itself.

Only one request can be pending for an organisation and post group. Decisions
are claimed atomically, so two reviewers cannot decide the same request twice.
Editing or deleting a draft cancels its pending request. Previous decisions are
retained as history, and the UI marks an older approval as outdated when the
content changed after it was requested. The server rechecks the draft version
when a reviewer decides, and cancels a stale request instead of approving
changed or non-draft content.

The calendar summary returns an accurate pending total but loads at most the
oldest 50 request records at once. This keeps the reviewer entry point bounded;
the composer currently displays the first six and reviewers continue through
the draft calendar.

Approval endpoints always scope reads and writes to the active organisation.
Requesters may cancel their own pending request; only an owner, admin or
approver may approve or reject it.

## Notifications and recovery

The pending-approval banner is the durable in-product notification. It exposes
loading and failure states and does not depend on email delivery. Decision and
cancellation failures leave the request pending and show an understandable
retry message. Approval email preferences will be introduced with the
transactional-email catalogue; this release does not claim that approval email
is sent.
