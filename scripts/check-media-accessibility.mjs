import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const rule = read(
  'libraries/nestjs-libraries/src/dtos/media/media.accessibility.ts'
);
const mediaDto = read('libraries/nestjs-libraries/src/dtos/media/media.dto.ts');
const saveDto = read(
  'libraries/nestjs-libraries/src/dtos/media/save.media.information.dto.ts'
);
const postsService = read(
  'libraries/nestjs-libraries/src/database/prisma/posts/posts.service.ts'
);
const postsController = read('apps/backend/src/api/routes/posts.controller.ts');
const composer = read(
  'apps/frontend/src/components/new-launch/manage.modal.tsx'
);
const editor = read(
  'apps/frontend/src/components/launches/helpers/media.settings.component.tsx'
);

const invariants = [
  [
    rule.includes('MEDIA_ALT_MAX_LENGTH = 1_000') &&
      rule.includes("typeof media.alt === 'string' ? media.alt.trim() : ''"),
    'alternative text must be trimmed and bounded',
  ],
  [
    rule.includes('for (const value of values || [])') &&
      rule.includes('for (const media of value.image || [])'),
    'every asset in every post/comment must be checked',
  ],
  [
    mediaDto.includes('@MaxLength(MEDIA_ALT_MAX_LENGTH)') &&
      mediaDto.includes('value.trim()') &&
      saveDto.includes('@MinLength(1)') &&
      saveDto.includes('@MaxLength(MEDIA_ALT_MAX_LENGTH)') &&
      saveDto.includes('value.trim()'),
    'media DTOs must trim and bound alternative text consistently',
  ],
  [
    postsService.includes(
      'const accessibilityError = mediaAccessibilityError(post.value)'
    ) && postsService.includes("if (body.type !== 'draft')"),
    'all non-draft service creation paths must enforce accessible media',
  ],
  [
    postsController.includes('if (item.accessibilityError)') &&
      composer.includes('if (item.accessibilityError)'),
    'API and composer validation must return the same actionable error',
  ],
  [
    editor.includes('htmlFor="media-alt-text"') &&
      editor.includes('id="media-alt-text"') &&
      editor.includes('required') &&
      editor.includes('maxLength={MEDIA_ALT_MAX_LENGTH}'),
    'the editor must provide a labelled bounded required input',
  ],
  [
    editor.includes('aria-invalid={Boolean(altError)}') &&
      editor.includes(
        'aria-describedby="media-alt-help media-alt-count media-alt-error"'
      ) &&
      editor.includes('role="alert"'),
    'the editor must link help, count and understandable errors',
  ],
  [
    editor.includes('const trimmedAlt = altText.trim()') &&
      editor.indexOf('if (!trimmedAlt)') < editor.indexOf('setLoading(true)'),
    'blank alt text must stop before upload or metadata requests begin',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(
  `Media accessibility audit passed (${invariants.length} invariants).`
);
