import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const articles = read('apps/frontend/src/components/help/help.articles.ts');
const centre = read('apps/frontend/src/components/help/help.centre.tsx');
const page = read('apps/frontend/src/app/(app)/(site)/help/page.tsx');
const menu = read('apps/frontend/src/components/layout/top.menu.tsx');
const onboarding = read('docs/ONBOARDING.md');
const helpReadme = read('docs/help/README.md');
const checklist = read(
  'apps/frontend/src/components/onboarding/onboarding.checklist.tsx'
);
const launches = read(
  'apps/frontend/src/components/launches/launches.component.tsx'
);

const invariants = [
  [
    articles.includes("id: 'first-schedule'") &&
      articles.includes("id: 'mcp-credentials'") &&
      articles.includes("id: 'privacy-export'") &&
      articles.includes("id: 'faq'") &&
      articles.includes('searchHelpArticles') &&
      articles.includes('British'),
    'help articles must cover first schedule, MCP, privacy and FAQ with British English guidance',
  ],
  [
    centre.includes('htmlFor="help-search"') &&
      centre.includes('id="help-search"') &&
      centre.includes('type="search"') &&
      centre.includes('searchHelpArticles(query)') &&
      centre.includes("searchParams.get('article')"),
    'help centre must provide a labelled searchable catalogue and deep links',
  ],
  [
    page.includes('HelpCentre') &&
      menu.includes("path: '/help'") &&
      menu.includes("t('help', 'Help')"),
    'help must be routed and linked from the main menu',
  ],
  [
    onboarding.includes('Schedule the first post') &&
      onboarding.includes('sf-onboarding-checklist') &&
      checklist.includes('OnboardingChecklist') &&
      checklist.includes('sf-onboarding-checklist:') &&
      launches.includes('OnboardingChecklist') &&
      helpReadme.includes('Email catalogue') &&
      helpReadme.includes('Registration verification'),
    'onboarding checklist, email catalogue and help docs must exist',
  ],
];

for (const [condition, message] of invariants) assert.ok(condition, message);
console.log(`Onboarding/help audit passed (${invariants.length} invariants).`);
