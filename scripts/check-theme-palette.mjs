import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const colors = read('apps/frontend/src/app/colors.scss');
const brand = read('libraries/helpers/src/utils/brand.ts');
const design = read('DESIGN_SYSTEM.md');
const envExample = read('.env.example');
const help = read('apps/frontend/src/components/help/help.centre.tsx');
const mode = read('apps/frontend/src/components/layout/mode.component.tsx');
const layout = read('apps/frontend/src/app/(app)/layout.tsx');

const invariants = [
  [
    colors.includes('--sf-primary: #059669') &&
      colors.includes('--sf-canvas: #f4f6f5') &&
      !colors.includes('--sf-primary: #4f46e5') &&
      !colors.includes('--sf-primary: #818cf8'),
    'light theme must use white/grey canvas with green primary',
  ],
  [
    brand.includes("'#059669'") &&
      envExample.includes('NEXT_PUBLIC_BRAND_PRIMARY="#059669"') &&
      design.includes('#059669') &&
      design.includes('light-first'),
    'brand defaults and design system must document the green accent',
  ],
  [
    mode.includes("useCookie('mode', 'light')") &&
      layout.includes("=== 'dark' ? 'dark' : 'light'"),
    'the product must default to the light theme',
  ],
  [
    help.includes('bg-btnPrimary') && !help.includes('#612BD3'),
    'help centre active states must use the brand primary token',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(`Theme palette audit passed (${invariants.length} invariants).`);
