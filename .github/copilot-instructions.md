
# Copilot Coding Agent Instructions for Postiz

## Project Architecture
- Monorepo managed by NX, with apps in `apps/` and shared code in `libraries/`.
- Main services: `frontend` (Next.js), `backend` (NestJS), `cron`, `commands`, `extension`, `sdk`, and `workers`.
- Data layer uses Prisma ORM (`libraries/nestjs-libraries/src/database/prisma/schema.prisma`) with PostgreSQL as the default database.
- Redis (BullMQ) is used for queues and caching.
- Email notifications via Resend.
- Social login integrations (Instagram, Facebook) and Make.com/N8N integrations.

## Developer Workflows
- Use Node.js 22 (see `.nvmrc`) and pnpm 10.6.1.
- Follow `CURSOR_HANDOFF.md` resource limits on the development laptop: only bounded static audits (64 MB) and explicit-path formatting (128 MB).
- Run installs, builds, Jest, type-checks, Prisma and Docker only on CI or a suitably provisioned release host; see `docs/RELEASE_HOST_EVIDENCE.md`.
- The root `pnpm run dev` prints a safety notice and does not launch services.
- Individual app scripts are in each app's `package.json`.
- Apply production schema changes with `pnpm prisma-migrate-deploy`; follow `docs/SCHEMA_APPLY.md`.

## Conventions & Patterns
- Use conventional commits (`feat:`, `fix:`, `chore:`).
- PRs should include clear descriptions, related issue links, and UI screenshots/GIFs if relevant.
- Comments are required for complex logic.
- Shared code lives in `libraries/` (e.g., helpers, React shared libraries, NestJS modules).
- Environment variables are managed via `.env` and referenced in Docker and scripts.
- Make sure to keep the `.env.example` file updated with new environment variables.

## Integration Points
- External APIs: Social media (Instagram, Facebook), Make.com, N8N, Resend, Stripe, etc.
- SDK (`apps/sdk`) provides programmatic access to Postiz features.
- Extension (`apps/extension`) is built with Vite, React, TypeScript, and Tailwind CSS.

## Key Files & Directories
- `apps/` — Main services and applications
- `libraries/` — Shared code and modules
- `docker-compose.dev.yaml` — Local development Docker setup
- `.env` — Environment configuration
- `jest.config.ts` — Test configuration
- `pnpm-workspace.yaml` — Workspace package management
- `README.md` — General project overview
- `libraries/nestjs-libraries/src/database/prisma/schema.prisma` — Database schema

## Documentation
- Main docs: https://docs.postiz.com/
- Developer guide: https://docs.postiz.com/developer-guide
- Public API: https://docs.postiz.com/public-api

---

# Logs

- Where logs are used, ensure Sentry is imported using `import * as Sentry from "@sentry/nextjs"`
- Enable logging in Sentry using `Sentry.init({ enableLogs: true })`
- Reference the logger using `const { logger } = Sentry`
- Sentry offers a `consoleLoggingIntegration` that can be used to log specific console error types automatically without instrumenting the individual logger calls

## Configuration

The Sentry initialization needs to be updated to enable the logs feature.

### Baseline

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enableLogs: true,
});
```

### Logger Integration

```javascript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    // send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],
});
```

## Logger Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```javascript
import * as Sentry from "@sentry/nextjs";

const { logger } = Sentry;

logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached for endpoint", {
  endpoint: "/api/results/",
  isEnterprise: false,
});
logger.error("Failed to process payment", {
  orderId: "order_123",
  amount: 99.99,
});
logger.fatal("Database connection pool exhausted", {
  database: "users",
  activeConnections: 100,
});
```

---

For questions or unclear conventions, check the main README or ask for clarification in your PR description.

