import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routeDirectory = join(process.cwd(), 'apps/backend/src/api/routes');
const protectedControllers = [
  'autopost.controller.ts',
  'billing.controller.ts',
  'copilot.controller.ts',
  'integrations.controller.ts',
  'media.controller.ts',
  'oauth-app.controller.ts',
  'posts.controller.ts',
  'sets.controller.ts',
  'settings.controller.ts',
  'signature.controller.ts',
  'third-party.controller.ts',
  'webhooks.controller.ts',
] as const;

const explicitlyNonMutatingOrSeparatelyAuthorised = new Set([
  "posts.controller.ts:@Post('/should-shortlink')",
  "posts.controller.ts:@Post('/valid')",
  "settings.controller.ts:@Post('/team/add')",
]);

describe('tenant mutation policy coverage', () => {
  it.each(protectedControllers)(
    'requires an explicit policy on every mutation in %s',
    (file) => {
      const source = readFileSync(join(routeDirectory, file), 'utf8');
      const lines = source.split('\n');
      const missing: string[] = [];

      lines.forEach((line, index) => {
        const route = line.trim();
        if (!/^@(Post|Put|Patch|Delete)\(/.test(route)) {
          return;
        }
        if (
          explicitlyNonMutatingOrSeparatelyAuthorised.has(`${file}:${route}`)
        ) {
          return;
        }

        const decoratorsAndSignature = lines
          .slice(index + 1, index + 8)
          .join('\n');
        if (!decoratorsAndSignature.includes('@CheckPolicies(')) {
          missing.push(`${index + 1}: ${route}`);
        }
      });

      expect(missing).toEqual([]);
    }
  );
});
