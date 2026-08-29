# Account and tenant test matrix

This matrix defines the milestone-4 authentication and tenant-isolation gate.
The low-memory source audit confirms that every named boundary has a maintained
specification; it does not claim that Jest or database integration tests ran on
this workstation.

| Boundary                      | Allowed case                                                                         | Denied or competing case                                                                         | Evidence                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Session identity              | Signed token ID resolves to an active database user                                  | Missing user, inactive database user, or forged token claims                                     | `auth.middleware.spec.ts`                                                                                                           |
| Workspace selection           | Enabled membership in the explicitly selected workspace                              | Missing, disabled, malformed, array-valued, or other-tenant selection                            | `organization.selection.spec.ts`, `auth.middleware.spec.ts`                                                                         |
| Support impersonation         | Enabled target membership, narrowed to the target user                               | Disabled target membership or unrelated organisation users                                       | `auth.middleware.spec.ts`                                                                                                           |
| Role policy                   | Owner/admin management, approver review, editor content, viewer read                 | Unknown roles and disallowed mutations fail closed                                               | `permissions.service.spec.ts`, `organization.role.spec.ts`                                                                          |
| Registration/login disclosure | Stable public recovery guidance                                                      | Existing-account and internal failure reasons are not disclosed                                  | `public.auth.error.spec.ts`                                                                                                         |
| Password reset                | Unexpired local-user token with current password fingerprint wins one atomic update  | Malformed, expired, non-local, stale, reused, or racing token                                    | `auth.service.spec.ts`, `auth.service.spec.ts` in helpers                                                                           |
| Invitation creation           | New opaque token supersedes an older active invitation for the same tenant/email     | Raw token persistence or two current invitations                                                 | `invitation.token.spec.ts`, `organization.repository.invitation.tenant.integration.spec.ts`                                         |
| Invitation acceptance         | Matching email atomically claims a valid tenant invitation once                      | Expired, revoked, reused, wrong-email, concurrent, or cross-tenant claim                         | `auth.service.spec.ts`, `organization.repository.invitation.tenant.integration.spec.ts`                                             |
| Tenant-owned mutations        | Active tenant predicate and role policy both pass                                    | Cross-tenant identifier or insufficient role                                                     | `posts.repository.tenant.integration.spec.ts`, `permissions.route-coverage.spec.ts`, repository specifications, tenant-policy audit |
| Media ownership               | Active media can be listed, described, attached and deleted by its tenant            | Another tenant's ID or a soft-deleted media row is supplied for attachment                       | `media.repository.tenant.integration.spec.ts`, account/tenant coverage audit                                                        |
| Social connection ownership   | Channel reads, profile changes and credential rotation stay inside the active tenant | Another tenant reuses the same provider account ID or supplies its channel ID                    | `integration.repository.tenant.integration.spec.ts`, account/tenant coverage audit                                                  |
| Webhook ownership             | A bounded channel set is validated and saved atomically for its owning tenant        | Another tenant's channel/webhook ID, duplicates, or an inactive channel at validation            | `webhooks.repository.tenant.integration.spec.ts`, account/tenant coverage audit                                                     |
| Reusable content sets         | A bounded template is listed, created, updated and deleted inside its tenant         | Another tenant's set ID is supplied for update or deletion                                       | `sets.repository.tenant.integration.spec.ts`, account/tenant coverage audit                                                         |
| Signatures                    | Bounded signatures and the default selection remain inside their owning tenant       | Another tenant's signature ID is supplied or its default is affected                             | `signature.repository.tenant.integration.spec.ts`, account/tenant coverage audit                                                    |
| Billing routing               | Unique Stripe keys route updates, credits and deletion to one tenant                 | A duplicate customer/subscription key or another tenant's billing state is targeted              | `subscription.repository.tenant.integration.spec.ts`, `BILLING_TENANT_KEYS.md`                                                      |
| Social credentials            | Tenant-scoped internal read authenticates an encrypted envelope                      | Plaintext production row, unknown key, tampering, public projection or workflow-history exposure | `social-credential-encryption.service.spec.ts`, credential-safety audit                                                             |
| OAuth callback binding        | Provider, tenant and initiating user resolve through one expiring transaction        | Wrong provider, inactive member, expired/replayed state or unsafe return destination             | `oauth.connect.transaction.spec.ts`, OAuth connection safety audit                                                                  |
| Provider release gate         | Explicitly approved and fully configured production provider is discoverable         | Unlisted, partially configured or simulated production provider                                  | `social.provider.availability.spec.ts`, provider release-gate audit                                                                 |

## Bounded local audit

Run `pnpm check:account-tenant-coverage`. It reads a fixed set of source files
under a 64 MB heap ceiling and performs no network or database work.

## Release-host gate

On a suitable isolated host, generate the Prisma client, apply the reviewed
schema changes to a disposable PostgreSQL database, set
`RUN_DATABASE_INTEGRATION_TESTS=true`, and run the relevant Jest suites in one
process. The current opt-in database suites seed two organisations and prove
cross-tenant post reads, deletion and approval submission fail without changing
the owning tenant. They also verify channel reads and mutations fail across the
tenant boundary, public channel projections omit credentials, and reconnecting
one tenant cannot rotate another tenant's credentials when both use the same
provider account ID. Media-library reads and mutations are also isolated, and
post attachment resolution rejects cross-tenant and soft-deleted media IDs.
Webhook writes additionally validate a maximum of 100 active, tenant-owned
channels in the same transaction as relationship replacement. Billing coverage
verifies unique Stripe routing keys, collision rejection, webhook updates,
credits and subscription deletion. The source matrix is now assembled; execute
it, retain command output and confirm database cleanup on the approved release
host. Until that evidence exists, the milestone integration gate remains
pending.

The fixed-path runner refuses to start unless `NODE_ENV=test`,
`RUN_DATABASE_INTEGRATION_TESTS=true` and
`ALLOW_DISPOSABLE_DATABASE_TESTS=true`; the database name must also contain
`test`. After preparing that disposable database, run:

```bash
NODE_ENV=test \
RUN_DATABASE_INTEGRATION_TESTS=true \
ALLOW_DISPOSABLE_DATABASE_TESTS=true \
DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/socialflow_tenant_test' \
pnpm test:account-tenant:release
```

The runner starts one Jest process with `--runInBand`, a fixed 1 GB heap ceiling
and an explicit 20-file manifest. It does not create or migrate a database.
`.github/workflows/account-tenant-gate.yml` supplies a disposable PostgreSQL
service, applies the schema, enforces a 20-minute job timeout and retains the
gate log for 14 days. A workflow definition is not passing evidence; record the
completed run and artifact before changing this milestone's status.
