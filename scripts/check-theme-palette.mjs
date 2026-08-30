import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const srgbChannel = (value) => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const relativeLuminance = (hex) => {
  const normalized = hex.replace('#', '');
  const r = srgbChannel(parseInt(normalized.slice(0, 2), 16));
  const g = srgbChannel(parseInt(normalized.slice(2, 4), 16));
  const b = srgbChannel(parseInt(normalized.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (foreground, background) => {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const colors = read('apps/frontend/src/app/colors.scss');
const brand = read('libraries/helpers/src/utils/brand.ts');
const design = read('DESIGN_SYSTEM.md');
const envExample = read('.env.example');
const help = read('apps/frontend/src/components/help/help.centre.tsx');
const mode = read('apps/frontend/src/components/layout/mode.component.tsx');
const layout = read('apps/frontend/src/app/(app)/layout.tsx');

const lightPrimaryMatch = colors.match(
  /\.light\s*{[\s\S]*?--sf-primary:\s*(#[0-9a-fA-F]{6})/
);
const lightOnPrimaryMatch = colors.match(
  /\.light\s*{[\s\S]*?--sf-on-primary:\s*(#[0-9a-fA-F]{6})/
);
const brandPrimaryMatch = brand.match(/'#([0-9a-fA-F]{6})'/);
const envPrimaryMatch = envExample.match(
  /NEXT_PUBLIC_BRAND_PRIMARY="#([0-9a-fA-F]{6})"/
);

assert.ok(lightPrimaryMatch, 'light --sf-primary must be defined');
assert.ok(lightOnPrimaryMatch, 'light --sf-on-primary must be defined');
assert.ok(brandPrimaryMatch, 'brand default primary must be defined');
assert.ok(envPrimaryMatch, 'env example primary must be defined');

const lightPrimary = lightPrimaryMatch[1].toLowerCase();
const lightOnPrimary = lightOnPrimaryMatch[1].toLowerCase();
const brandPrimary = `#${brandPrimaryMatch[1]}`.toLowerCase();
const envPrimary = `#${envPrimaryMatch[1]}`.toLowerCase();
const ratio = contrastRatio(lightOnPrimary, lightPrimary);

const invariants = [
  [
    ratio >= 4.5,
    `primary/on-primary contrast must be at least 4.5:1 (got ${ratio.toFixed(
      2
    )}:1 for ${lightOnPrimary} on ${lightPrimary})`,
  ],
  [
    lightPrimary === brandPrimary && lightPrimary === envPrimary,
    'brand default, env example and light --sf-primary must match',
  ],
  [
    colors.includes('--sf-canvas: #f4f6f5') &&
      !colors.includes('--sf-primary: #4f46e5') &&
      !colors.includes('--sf-primary: #818cf8'),
    'light theme must use white/grey canvas without indigo primary',
  ],
  [
    design.includes(lightPrimary) &&
      design.toLowerCase().includes('4.5:1') &&
      design.includes('light-first') &&
      design.includes('## Interaction states') &&
      design.includes('## Keyboard and focus') &&
      design.includes('## Forms and error semantics') &&
      design.includes('## Charts and data visualisation') &&
      design.includes('prefers-reduced-motion') &&
      design.includes('## Responsive shell') &&
      design.includes('/design-system') &&
      design.includes('## WCAG and viewport test matrix') &&
      design.includes('Implemented source vs verified runtime'),
    'design system must document accessible green primary and restored a11y sections',
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
console.log(
  `Theme palette audit passed (${
    invariants.length
  } invariants, contrast ${ratio.toFixed(2)}:1).`
);
