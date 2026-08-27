import { expect, Page, test } from '@playwright/test';
import axe from 'axe-core';

const backendUrl = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';
const mailpitUrl = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';
const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

async function assertWcagAa(page: Page) {
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const result = (await (window as any).axe.run(document, {
      runOnly: {
        type: 'tag',
        values: [
          'wcag2a',
          'wcag2aa',
          'wcag21a',
          'wcag21aa',
          'wcag22a',
          'wcag22aa',
        ],
      },
    })) as {
      violations: Array<{
        id: string;
        impact: string | null;
        help: string;
        nodes: Array<{ target: string[] }>;
      }>;
    };
    return result.violations
      .filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? '')
      )
      .map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        targets: nodes.map((node) => node.target.join(' ')),
      }));
  });
  expect(violations).toEqual([]);
}

async function activateLocalAccount(page: Page) {
  const email = `a11y-${Date.now()}@socialflow.local`;
  const password = `local-${crypto.randomUUID()}`;
  const registration = await page.request.post(`${backendUrl}/auth/register`, {
    data: {
      email,
      password,
      provider: 'LOCAL',
      providerToken: '',
      company: 'Accessibility verification',
      datafast_visitor_id: '',
    },
  });
  expect(registration.ok()).toBeTruthy();
  expect(await registration.json()).toEqual({ activate: true });

  let messageId: string | undefined;
  await expect
    .poll(
      async () => {
        const inbox = await page.request.get(`${mailpitUrl}/api/v1/messages`);
        const messages = (await inbox.json()).messages as Array<{
          ID: string;
          To: Array<{ Address: string }>;
        }>;
        messageId = messages.find((message) =>
          message.To.some((recipient) => recipient.Address === email)
        )?.ID;
        return messageId;
      },
      { timeout: 30_000 }
    )
    .toBeTruthy();

  const message = await page.request.get(
    `${mailpitUrl}/api/v1/message/${messageId}`
  );
  const html = (await message.json()).HTML as string;
  const code = html.match(/\/auth\/activate\/([^"<\s]+)/)?.[1];
  expect(code).toBeTruthy();

  const activation = await page.request.post(`${backendUrl}/auth/activate`, {
    data: { code, datafast_visitor_id: '' },
  });
  expect(await activation.json()).toEqual({ can: true });

  const login = await page.request.post(`${backendUrl}/auth/login`, {
    data: {
      email,
      password,
      provider: 'LOCAL',
      providerToken: '',
      datafast_visitor_id: '',
    },
  });
  expect(login.ok()).toBeTruthy();
  const auth = login.headers().auth;
  const showorg = login.headers().showorg;
  expect(auth).toBeTruthy();
  expect(showorg).toBeTruthy();
  if (!auth || !showorg) {
    throw new Error('Local login did not return development session headers');
  }

  await page.context().addCookies([
    { name: 'auth', value: auth, domain: 'localhost', path: '/' },
    { name: 'showorg', value: showorg, domain: 'localhost', path: '/' },
  ]);
}

test('login is WCAG AA clean at key viewports', async ({ page }) => {
  for (const theme of ['dark', 'light']) {
    await page
      .context()
      .addCookies([
        { name: 'mode', value: theme, domain: 'localhost', path: '/' },
      ]);

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/auth/login');
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
      await expect(page.locator('body')).toHaveClass(new RegExp(theme));
      await assertWcagAa(page);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(viewport.width + 1);
    }
  }
});

test('design system is accessible and responsive in both themes', async ({
  page,
}) => {
  await activateLocalAccount(page);

  for (const theme of ['dark', 'light']) {
    await page
      .context()
      .addCookies([
        { name: 'mode', value: theme, domain: 'localhost', path: '/' },
      ]);

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/design-system');
      await expect(
        page.getByRole('heading', { name: 'SocialFlow design system' })
      ).toBeVisible();
      await expect(page.locator('body')).toHaveClass(new RegExp(theme));
      await assertWcagAa(page);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(viewport.width + 1);

      if (viewport.width <= 1025) {
        await expect(
          page.getByRole('navigation', { name: 'Primary navigation' })
        ).toHaveCSS('position', 'fixed');
      }
    }
  }
});
