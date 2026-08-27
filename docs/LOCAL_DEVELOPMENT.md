# Local development

## Prerequisites

- Docker Desktop or another Docker Engine with Compose 2.20+
- `nvm` (recommended); `.nvmrc` selects Node 22.23.2
- Corepack/pnpm 10.6.1

## First start

```sh
nvm use
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev:services
pnpm prisma-db-push
pnpm dev
```

The app is served at `http://localhost:4200`, the API at `http://localhost:3000`, PostgreSQL at port 5432, Redis at 6379, Temporal at 7233 and the Mailpit inbox at `http://localhost:8025`. The default Compose project is `socialflow-dev`; data is kept in project-scoped named volumes.

`prisma-db-push` is for disposable local development only. Production uses reviewed migrations and must never use `--accept-data-loss`.

## Optional deterministic seed

The seed is guarded against production and non-loopback databases. It creates or updates one `.local` developer account, workspace, subscription and simulated social connection. Supply the password at runtime so no credential is stored in Git:

```sh
ALLOW_LOCAL_SEED=true SEED_PASSWORD='choose-at-least-12-characters' pnpm seed:local
```

Set `ENABLE_TEST_PROVIDER=true` in `.env` to expose the simulated provider. It is forcibly disabled when `NODE_ENV=production` and its publish implementation performs no network request.

## Optional inspection tools

```sh
pnpm dev:services:tools
```

This additionally exposes Temporal UI on port 8080, pgAdmin on 8081 and RedisInsight on 5540. Their credentials are local-development placeholders and the profile must not be published to the internet.

## Local HTTP and email

For browser sessions over plain localhost HTTP, set `NOT_SECURED=true` in the ignored `.env`. This relaxes cookie transport only for local development and must never be enabled in production.

Mailpit captures all local mail without delivering it externally. To exercise account activation and password reset, add these values to `.env`:

```dotenv
EMAIL_PROVIDER=nodemailer
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_SECURE=false
EMAIL_FROM_ADDRESS=no-reply@socialflow.local
EMAIL_FROM_NAME=SocialFlow
```

Leave `EMAIL_USER` and `EMAIL_PASS` unset because local Mailpit does not require SMTP authentication. Leave social, AI and Stripe keys empty; unavailable integrations must render as unavailable rather than making real calls.

## Checks

```sh
pnpm format:check
pnpm typecheck
pnpm test --runInBand
pnpm build
```

With the app and local services running, exercise frontend health, API health, captured verification email, activation, login and an authenticated session:

```sh
pnpm verify:local
```

The smoke check creates a uniquely named local test account and never prints its password or authentication token.

Stop services without deleting data using `pnpm dev:services:down`. Deleting named volumes is intentionally not part of a package script because it destroys local data.
