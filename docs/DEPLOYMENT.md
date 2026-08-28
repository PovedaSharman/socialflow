# Deployment

This is a target runbook. It is not evidence of a completed deployment.

## Required services

- Node.js 22.12–22.x and pnpm 10.6.1 for builds
- PostgreSQL with encrypted storage, point-in-time recovery and tested backups
- Redis with authentication and private networking
- Temporal server/cloud namespace and registered search attributes
- S3-compatible private object storage with controlled public delivery
- TLS-terminating ingress for frontend and backend

Build the frontend, backend and orchestrator from the same Git commit. Run Prisma migrations as a one-off release job before traffic shift. Do not run `prisma db push --accept-data-loss` in production.

## Release order

1. Validate configuration and secret references without printing values.
2. Back up the database and record the restore point.
3. Apply reviewed database migrations once. For the first encrypted-credential
   release or a key rotation, complete the bounded maintenance procedure in
   [SOCIAL_CREDENTIAL_ENCRYPTION.md](SOCIAL_CREDENTIAL_ENCRYPTION.md) before
   starting application processes, and account for legacy Temporal histories
   using that guide's drain and retention requirements.
4. Deploy backend and orchestrator with the complete social-credential key
   ring, then verify liveness/readiness and Temporal worker registration.
5. Deploy frontend and run account, connection, scheduling, MCP and Stripe-test smoke tests.
6. Shift traffic gradually, monitor error rate, publish latency, queue depth and provider failures.
7. Record the running commit and expose its corresponding-source link.

## Backups and recovery

Back up PostgreSQL and customer media independently. Encryption keys and infrastructure configuration require a separate protected recovery procedure. Define RPO/RTO with the service owner; no values have been approved. Quarterly restore drills are recommended but must not be claimed until recorded.

## Missing production decisions

Hosting provider/region, domain, secret manager, managed data services, retention, RPO/RTO, on-call owner, alert destinations and source-offer URL remain undecided.
