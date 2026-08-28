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
| Invitation creation           | New opaque token supersedes an older active invitation for the same tenant/email     | Raw token persistence or two current invitations                                                 | `invitation.token.spec.ts`, organisation repository transaction                                                                     |
| Invitation acceptance         | Matching email atomically claims a valid tenant invitation once                      | Expired, revoked, reused, wrong-email, or concurrent claim                                       | `auth.service.spec.ts`, organisation repository transaction                                                                         |
| Tenant-owned mutations        | Active tenant predicate and role policy both pass                                    | Cross-tenant identifier or insufficient role                                                     | `posts.repository.tenant.integration.spec.ts`, `permissions.route-coverage.spec.ts`, repository specifications, tenant-policy audit |
| Media ownership               | Active media can be listed, described, attached and deleted by its tenant            | Another tenant's ID or a soft-deleted media row is supplied for attachment                       | `media.repository.tenant.integration.spec.ts`, account/tenant coverage audit                                                        |
| Social connection ownership   | Channel reads, profile changes and credential rotation stay inside the active tenant | Another tenant reuses the same provider account ID or supplies its channel ID                    | `integration.repository.tenant.integration.spec.ts`, account/tenant coverage audit                                                  |
| Social credentials            | Tenant-scoped internal read authenticates an encrypted envelope                      | Plaintext production row, unknown key, tampering, public projection or workflow-history exposure | `social-credential-encryption.service.spec.ts`, credential-safety audit                                                             |

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
Extend the request-level matrix to webhooks, sets, signatures, invitations and
billing, recording command output and database cleanup. Until that evidence
exists, the milestone integration gate remains pending.
