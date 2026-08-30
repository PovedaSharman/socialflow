# SocialFlow $0 Online Test Launch Plan

Status: planned, not deployed
Verified against provider documentation: 30 August 2026

## Objective

Put the current SocialFlow branch on a public HTTPS staging URL, run the release
and browser evidence on infrastructure other than the development laptop, and
keep the test deployment within free allowances. This is a disposable staging
environment, not a production-readiness claim.

## Recommended $0 architecture

| Concern          | Choice                                                                                    | Cost boundary                                                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source and CI    | Public GitHub repository, standard GitHub-hosted ARM/Linux runners                        | Standard runners are free for public repositories. Do not select larger runners.                                                                                                                     |
| Container images | Public GitHub Container Registry images                                                   | Public packages are free; retain only the latest staging image.                                                                                                                                      |
| Compute          | One OCI Always Free `VM.Standard.A1.Flex` instance in the account home region             | Configure no more than the current Always Free allowance: 2 OCPUs and 12 GB RAM in total. Never choose a paid shape.                                                                                 |
| Disk             | OCI Always Free block storage                                                             | Use a 100 GB boot volume and stay within the account's 200 GB total Always Free block-volume allowance.                                                                                              |
| Database         | PostgreSQL 17 container on a private Docker network                                       | One server, separate SocialFlow and Temporal databases and roles. No public database port.                                                                                                           |
| Cache/limits     | Redis 7 container with authentication and persistence                                     | Private Docker network; cap memory and use an eviction policy appropriate to non-durable cache data.                                                                                                 |
| Workflows        | Self-hosted Temporal with PostgreSQL visibility                                           | Do not run Elasticsearch or expose Temporal gRPC/UI publicly. Pin the image version.                                                                                                                 |
| App              | Frontend, backend and orchestrator containers from the same commit                        | Build once in GitHub Actions; do not compile on the VM or laptop.                                                                                                                                    |
| HTTPS            | Caddy on ports 80/443                                                                     | Use a stable hostname. For a strictly $0 trial, an IP-derived free DNS name such as `app.<public-ip>.sslip.io` can be used, but it has no SLA. Replace it with an owned domain before a real launch. |
| Media            | Local persistent volume for the first bounded test; optional Cloudflare R2 Standard proof | Local storage avoids metered overage. R2 currently includes 10 GB-month, 1M Class A and 10M Class B operations, but it is usage-billed above that allowance.                                         |
| Billing          | Stripe Sandbox/test keys only                                                             | No real payments or live keys.                                                                                                                                                                       |
| Email            | None for the first test cohort                                                            | Create a small fixed tester cohort; do not add an email vendor until account flows require it.                                                                                                       |
| Monitoring       | Container health checks, capped JSON logs, and a scheduled GitHub Actions HTTP probe      | Keep workflow artifacts short-lived and below the GitHub allowance.                                                                                                                                  |

The OCI allowance and capacity can change and free ARM capacity is not
guaranteed. Check that every selected resource is labelled **Always Free** before
creating it. Oracle may require a payment card for identity verification, but its
documentation says it is not charged unless the account is upgraded.

Official references:

- [OCI Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub Packages billing](https://docs.github.com/en/billing/concepts/product-billing/github-packages)
- [Temporal self-hosted deployment](https://docs.temporal.io/production-deployment/self-hosted-guide/deployment)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Stripe test environments](https://docs.stripe.com/testing-use-cases)

## Non-negotiable pre-deployment gate

Do not publish the staging URL until these source defects from the independent
review are fixed and covered by regression tests:

1. Require `posts:schedule` when the public status endpoint receives
   `status: "schedule"`.
2. Give Stripe webhook leases owner tokens and use atomic compare-and-set,
   completion and release operations. Do not return a successful acknowledgement
   merely because another delivery is still processing.
3. Implement real Cloudflare and local object cleanup after quota or persistence
   failure.
4. Stream remote media with a hard byte limit; never use an unrestricted
   `response.arrayBuffer()`.
5. Supply a tested database baseline/bootstrap path so a clean database can run
   `prisma migrate deploy`.
6. Fail quota enforcement closed while historical `fileSize = 0` rows remain.
7. Prevent reservation-release failure from turning a committed media save into
   a retryable response.
8. Record public API outcomes after the controller succeeds or fails.
9. Add an onboarding checklist restart/reset control.
10. Update `check-mcp-credentials.mjs` for the `enforceMcpScopeAudit` wrapper.

Merge only when the focused tests, all 64 MB static audits and
`git diff --check` pass.

## Phase 1: build and test away from the laptop

Create a GitHub Actions workflow with concurrency set to one. It must:

1. Check out the exact commit and install Node 22.12.x plus pnpm 10.6.1.
2. Restore a bounded pnpm cache; do not cache build output or secrets.
3. Run static audits first with their existing 64 MB heap caps.
4. Run format, type checks and Jest serially, never concurrently.
5. Start disposable PostgreSQL, Redis and PostgreSQL-backed Temporal services.
6. Run `prisma migrate deploy` against a clean database, then the account/tenant
   and publish-workflow release gates.
7. Build ARM64 frontend, backend and orchestrator images from the same Git SHA.
8. Run image smoke tests and publish immutable `staging-<short-sha>` tags to
   GHCR only after every gate passes.
9. Retain logs for 7 days and do not upload databases, `.env` files, OAuth
   credentials or Temporal histories containing secrets.

Required CI outcome: a clean database and clean Temporal namespace pass without
manual intervention. A failed check must prevent image publication.

## Phase 2: provision the free staging host

1. Create one Ubuntu ARM64 OCI Always Free VM in the account home region:
   2 OCPUs, 12 GB RAM, 100 GB boot volume.
2. Do not upgrade the OCI account. Create a budget alert at £0/US$0 if the
   console permits it and verify the cost estimator shows zero before creation.
3. Reserve the instance public IP. Permit inbound TCP 80 and 443 only. Restrict
   SSH to the operator IP; do not expose 3000, 4200, 5432, 6379, 7233 or 8080.
4. Install only Docker Engine, the Compose plugin and OS security updates.
5. Create a non-root deployment user and a dedicated `/srv/socialflow` tree.
6. Put secrets in a root-readable environment file outside the Git checkout.
   Generate independent high-entropy JWT, encryption, audit-HMAC, PostgreSQL,
   Redis and Temporal credentials.
7. Configure Docker log rotation and a host firewall. Enable unattended security
   updates.

Suggested container memory ceilings:

| Service      |  Limit |
| ------------ | -----: |
| PostgreSQL   | 1.5 GB |
| Redis        | 256 MB |
| Temporal     | 1.5 GB |
| Backend      |   1 GB |
| Orchestrator | 1.5 GB |
| Frontend     | 768 MB |
| Caddy        | 128 MB |

Keep at least 3 GB for the OS, Docker and short-lived spikes. Set container CPU
limits and health checks, and use restart-on-failure rather than unbounded rapid
restart loops.

## Phase 3: staging Compose and first deployment

Create a separate `docker-compose.staging.yml`; do not reuse the development
Compose file unchanged.

1. Use pinned image versions or digests. Remove Elasticsearch, pgAdmin,
   RedisInsight, Mailpit, Spotlight and Temporal UI.
2. Use one PostgreSQL container with separate databases and least-privilege roles
   for SocialFlow and Temporal. Mount a named persistent volume.
3. Run Temporal with PostgreSQL persistence and visibility. Run schema setup as a
   one-off job, then run the server privately.
4. Run the SocialFlow Prisma migration as a one-off job. It must complete before
   any application container starts.
5. Pull all three application images using the same immutable Git tag.
6. Set `NODE_ENV=staging`, Stripe test keys, `ALLOW_STRIPE_LIVE_MODE` unset,
   `ALLOW_MCP_URL_SECRETS` unset, and an empty production-provider allowlist.
7. Enable the simulated provider only for the private test cohort. It must remain
   impossible in `NODE_ENV=production`.
8. Mount an 8 GB-capped local upload area for the first test and enforce a much
   smaller application quota, such as 250 MB per tenant.
9. Proxy only the frontend/backend public routes through Caddy. Keep databases,
   Redis and Temporal on an internal Docker network.
10. Confirm `/monitor/ready`, frontend health and orchestrator Temporal health
    before enabling tester access.

Create two test organisations and at least three users: an owner in each tenant
and one non-owner member. Use synthetic data only.

## Phase 4: online acceptance matrix

Run the following in order and save dated evidence against the deployed Git SHA.

### Platform and tenant safety

- Register/login/logout, password recovery behavior and session expiry.
- Owner/member permission boundaries.
- Cross-tenant reads and writes for posts, media, credentials and audit events.
- Scoped API and MCP create/use/revoke, including every allow and deny case.
- Rate limits by client, organisation and credential.

### Publishing

- Draft, schedule, edit, cancel and retry through the simulated provider.
- Temporal worker restart while work is queued and while a retry is pending.
- Duplicate workflow start/signal behavior.
- Discord sandbox posting, including media alt text, after its source gate passes.
- Keep all other providers disabled until their own OAuth sandbox evidence exists.

### Billing and quotas

- Stripe Sandbox checkout, portal and webhook fixtures only.
- Duplicate, concurrent, failed and expired-lease webhook deliveries.
- Per-plan API/MCP limits.
- Concurrent uploads just below and above quota.
- Failed database save proves the uploaded object is removed.
- Oversized, chunked, missing-length and slow remote media responses are rejected
  without a memory spike.

### Browser and accessibility

- Chromium, Firefox and WebKit Playwright runs against the staging URL.
- Keyboard-only navigation, visible focus, labels, errors and modal focus traps.
- Automated WCAG checks on login, dashboard, composer, calendar, Access and Help.
- Screenshots at 320, 375, 768, 1280 and 1440 CSS pixels.
- Onboarding completion, skip/dismiss, persistence and restart.

### Recovery and operations

- Restart each application container independently.
- Restart Redis and PostgreSQL and confirm fail-closed readiness behavior.
- Take an encrypted `pg_dump`, restore it into a disposable database and compare
  tenant/account counts.
- Restore the uploads volume into a disposable directory.
- Confirm secrets and raw IP addresses do not appear in logs, audit metadata,
  GitHub artifacts or Temporal histories.
- Confirm logs rotate and disk/memory remain bounded during a 24-hour soak.

## Launch decision

Open the staging URL to a maximum of five invited testers only when all of these
are true:

- CI is green from a clean database and clean workflow namespace.
- The deployed image labels match one reviewed Git SHA.
- No P0/P1 findings remain; accepted P2 items have owners and dates.
- Tenant isolation, webhook concurrency, media limits and cleanup have passing
  runtime evidence.
- Browser/accessibility checks pass at the required viewports.
- Backup and restore have been demonstrated, not merely documented.
- Only Stripe test mode and explicitly approved sandbox/simulated providers are
  enabled.
- The running service links to the complete corresponding AGPL source for the
  exact deployed commit.
- OCI and any optional R2 usage dashboards still show zero projected cost.

## Stop conditions

Immediately disable public access if cross-tenant access succeeds, secrets appear
in output, a webhook is lost or duplicated, an upload bypasses limits, memory
exceeds 80% for ten minutes, disk exceeds 75%, or any provider begins making live
billable calls.

## Expected schedule

| Work                                  | Estimated focused time |
| ------------------------------------- | ---------------------: |
| Fix and test current blockers         |   2–4 engineering days |
| Add CI and build/publish images       |                  1 day |
| Provision and harden staging          |              0.5–1 day |
| Deploy and smoke test                 |                0.5 day |
| Acceptance, recovery and 24-hour soak |       2–3 days elapsed |

The first credible invited test is therefore approximately one week of focused
work away, assuming OCI ARM capacity is available and no new release blockers are
found.
