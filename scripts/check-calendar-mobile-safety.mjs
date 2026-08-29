import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const context = read(
  'apps/frontend/src/components/launches/calendar.context.tsx'
);
const calendar = read('apps/frontend/src/components/launches/calendar.tsx');
const filters = read('apps/frontend/src/components/launches/filters.tsx');

const invariants = [
  [
    context.includes("display: 'week' | 'month' | 'day' | 'list'") &&
      context.includes("limit: '100'") &&
      context.includes("filters.display === 'list'"),
    'list view must be a bounded first-class calendar mode',
  ],
  [
    calendar.includes("display === 'list' ?") &&
      calendar.includes('<ListView />'),
    'the calendar must render its list alternative',
  ],
  [
    filters.includes('sm:flex-row sm:items-center') &&
      filters.includes('w-full flex-grow flex-col'),
    'the list toolbar must stack at narrow widths',
  ],
  [
    filters.includes("aria-label={t('previous_page', 'Previous page')}") &&
      filters.includes("aria-label={t('next_page', 'Next page')}") &&
      filters.includes('disabled={calendar.listPage <= 0}') &&
      filters.includes(
        'disabled={calendar.listPage >= calendar.listTotalPages - 1}'
      ),
    'pagination must use labelled buttons with native disabled state',
  ],
  [
    filters.includes(
      'role="group"\n            aria-label={t(\'filter_posts_by_status\''
    ) && filters.includes('aria-pressed={calendar.listState === option.value}'),
    'list state filters must expose grouped toggle state',
  ],
  [
    filters.includes("aria-label={t('calendar_view', 'Calendar view')}") &&
      filters.includes("aria-label={t('list_view', 'List view')}") &&
      filters.includes('aria-pressed={isListView}'),
    'calendar/list mode controls must be labelled toggle buttons',
  ],
  [
    filters.includes('min-h-[44px] min-w-[44px]') &&
      filters.includes('focus-visible:ring-btnPrimary'),
    'mobile controls must retain touch targets and visible focus',
  ],
  [
    calendar.includes("aria-label={`${t('edit_post', 'Edit post')}") &&
      calendar.includes(
        'focus-visible:ring-inset focus-visible:ring-btnPrimary'
      ),
    'each list/calendar card must expose a keyboard edit action',
  ],
  [
    calendar.includes('role="status"') &&
      calendar.includes("post.error || 'An error occurred while publishing"),
    'failed cards must expose their error without colour alone',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(`Mobile calendar audit passed (${invariants.length} invariants).`);
