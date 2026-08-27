import assert from 'node:assert/strict';
import { PrismaClient, Provider, Role } from '@prisma/client';
import { hashSync } from 'bcrypt';

assert.equal(
  process.env.ALLOW_LOCAL_SEED,
  'true',
  'Set ALLOW_LOCAL_SEED=true to acknowledge local database writes'
);
assert.notEqual(
  process.env.NODE_ENV,
  'production',
  'The local seed is disabled in production'
);

const databaseUrl = new URL(process.env.DATABASE_URL);
assert.ok(
  ['localhost', '127.0.0.1'].includes(databaseUrl.hostname),
  `Refusing to seed non-local database host: ${databaseUrl.hostname}`
);

const email = process.env.SEED_EMAIL ?? 'developer@socialflow.local';
const password = process.env.SEED_PASSWORD;
assert.ok(
  password && password.length >= 12,
  'SEED_PASSWORD must be at least 12 characters'
);
assert.ok(
  email.endsWith('.local'),
  'SEED_EMAIL must use the reserved .local suffix'
);

const prisma = new PrismaClient();

try {
  const user = await prisma.user.upsert({
    where: {
      email_providerName: { email, providerName: Provider.LOCAL },
    },
    update: {
      activated: true,
      password: hashSync(password, 10),
    },
    create: {
      email,
      password: hashSync(password, 10),
      providerName: Provider.LOCAL,
      name: 'Local Developer',
      timezone: 0,
      activated: true,
    },
  });

  let organization = await prisma.organization.findFirst({
    where: { name: 'SocialFlow Local Workspace' },
  });
  organization ??= await prisma.organization.create({
    data: { name: 'SocialFlow Local Workspace' },
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: { disabled: false, role: Role.SUPERADMIN },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: Role.SUPERADMIN,
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: { totalChannels: 10 },
    create: {
      organizationId: organization.id,
      subscriptionTier: 'TEAM',
      period: 'MONTHLY',
      totalChannels: 10,
    },
  });

  await prisma.integration.upsert({
    where: {
      organizationId_internalId: {
        organizationId: organization.id,
        internalId: 'socialflow-local-test-account',
      },
    },
    update: { disabled: false, name: 'Local test account' },
    create: {
      organizationId: organization.id,
      internalId: 'socialflow-local-test-account',
      name: 'Local test account',
      providerIdentifier: 'socialflow-test',
      type: 'social',
      token: 'socialflow-test-provider-local-only',
      refreshToken: 'socialflow-test-provider-local-only',
      tokenExpiration: new Date('2126-01-01T00:00:00.000Z'),
    },
  });

  console.log(
    `Local seed ready for ${email}; password was supplied through the environment`
  );
} finally {
  await prisma.$disconnect();
}
