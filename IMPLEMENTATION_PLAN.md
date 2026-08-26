# Implementation plan

The plan uses evidence gates. Inherited Postiz behaviour is **available**, not **verified**, until its milestone gate passes.

| Milestone               | Work                                                                                                             | Verification gate                                                                | Status      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------- |
| 1. Import and audit     | Import stable upstream without nesting, record architecture/capabilities/gaps/licence, establish docs and remote | Clean baseline identified; upstream tag and commit recorded; audit docs reviewed | Complete    |
| 2. Local environment    | Node 22, pnpm, PostgreSQL, Redis, Temporal, storage and mail test path; safe seed/test provider                  | Fresh checkout can install, migrate, seed and start from documented commands     | In progress |
| 3. Design system        | Central branding, tokens, primitives, responsive shell, themes, component showcase                               | Automated WCAG checks plus visual review at 360/768/1024/1440                    | Pending     |
| 4. Auth and tenancy     | Account lifecycle, roles, invitations, tenant guards, encrypted tokens                                           | Cross-tenant matrix and account lifecycle integration tests pass                 | Pending     |
| 5. Content and OAuth    | Composer, approvals, calendar, media, retries, connection health and test provider                               | User schedules with documented test provider; retry produces one publish         | Pending     |
| 6. MCP and API          | Hashed scoped credentials, Bearer-only streamable HTTP, audit and client instructions                            | Create/use/revoke credential tests; default immediate publish denial             | Pending     |
| 7. Billing and usage    | Stripe test checkout/portal/webhooks, plan config, atomic quotas, cost caps                                      | Signed replay-safe webhook fixtures and limit boundary tests pass                | Pending     |
| 8. Onboarding and help  | Checklist, contextual recovery, MDX help/FAQ, email catalogue                                                    | New non-technical user completes first schedule; search and links tested         | Pending     |
| 9. Admin and operations | Audit viewer, privacy export/deletion, consent, rate limits, logs, health, backup/monitoring docs                | Security tests, restore drill record and operational smoke tests pass            | Pending     |
| 10. Release validation  | Full CI/build/accessibility/security/responsive/deployment review                                                | Readiness report lists evidence and all external blockers                        | Pending     |

## Working rules

- Update `PROGRESS.md` at every milestone boundary.
- Add tests with every behaviour change. Do not mark manual checks as automated.
- Run formatting, linting, type checking, tests, accessibility checks and production builds before each checkpoint.
- Use Stripe test mode, local/mail test transports and provider mocks until authorised credentials exist.
- Keep upstream changes mergeable; prefer additions and narrow adaptations over rewrites.
- Never commit `.env`, credentials, generated secrets, customer data, build artefacts or test claims without output.
