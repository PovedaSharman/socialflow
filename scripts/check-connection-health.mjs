import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const health = read(
  'libraries/nestjs-libraries/src/integrations/integration.connection-health.ts'
);
const healthSpec = read(
  'libraries/nestjs-libraries/src/integrations/integration.connection-health.spec.ts'
);
const repository = read(
  'libraries/nestjs-libraries/src/database/prisma/integrations/integration.repository.ts'
);
const controller = read(
  'apps/backend/src/api/routes/integrations.controller.ts'
);
const launches = read(
  'apps/frontend/src/components/launches/launches.component.tsx'
);
const guide = read('docs/CONNECTION_HEALTH.md');

const requirements = [
  [
    ['healthy', 'connecting', 'action_required', 'expiring', 'disabled'].every(
      (status) => health.includes(`'${status}'`)
    ) &&
      health.includes('EXPIRING_WINDOW_MS') &&
      health.includes('Number.isNaN(parsedExpiration.getTime())'),
    'Connection health must cover every state, proactive expiry and malformed expiry.',
  ],
  [
    healthSpec.includes('prioritises plan, reconnect') &&
      healthSpec.includes('expired, expiring and healthy') &&
      healthSpec.includes('fails closed'),
    'Connection-health specifications must cover precedence, expiry boundaries and malformed values.',
  ],
  [
    /getIntegrationsList\(org: string\)[\s\S]*?tokenExpiration: true/.test(
      repository
    ) &&
      !/getIntegrationsList\(org: string\)[\s\S]*?select: \{[\s\S]*?token: true/.test(
        repository
      ) &&
      controller.includes('health: integrationConnectionHealth(p)'),
    'Channel lists must expose expiry-derived health without credential fields.',
  ],
  [
    launches.includes('health.requiredAction') &&
      launches.includes('type="button"') &&
      launches.includes(
        'aria-label={`${integration.name}: ${health.message}`}'
      ) &&
      launches.includes('h-[44px] w-[44px]') &&
      launches.includes('focus-visible:ring-2') &&
      launches.includes('{health.message}'),
    'Connection recovery must be labelled, keyboard-focusable, touch-sized and visible in text.',
  ],
  [
    /never\s+returns access or refresh tokens/.test(guide) &&
      guide.includes('360, 768, 1024 and 1440'),
    'Connection-health guidance must retain the secret boundary and responsive release check.',
  ],
];

const failures = requirements
  .filter(([passed]) => !passed)
  .map(([, message]) => message);

if (failures.length > 0) {
  process.stderr.write(
    `Connection-health audit failed:\n${failures.join('\n')}\n`
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Connection-health audit passed (${requirements.length} invariants).\n`
  );
}
