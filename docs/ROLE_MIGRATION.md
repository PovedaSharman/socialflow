# Organisation role migration

The application accepts both the current role vocabulary and the two legacy
values during a rolling deployment:

| Stored role | Effective role | Purpose |
| --- | --- | --- |
| `OWNER` | Owner | Workspace ownership, billing and administration |
| `ADMIN` | Admin | Workspace and team administration |
| `APPROVER` | Approver | Content review and approval |
| `EDITOR` | Editor | Content creation and editing |
| `VIEWER` | Viewer | Read-only access |
| `SUPERADMIN` | Owner | Legacy compatibility only |
| `USER` | Editor | Legacy compatibility only |

Do not rewrite existing rows before deploying code that understands both sets
of values. Back up the database and record the restore point first.

## Phase 1: extend the PostgreSQL enum

Run the enum additions as a reviewed release migration. PostgreSQL versions
that prohibit using a newly added enum value in the same transaction require
this phase to commit before phase 2.

```sql
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'APPROVER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'EDITOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VIEWER';
```

Deploy the compatibility release, generate its Prisma client, and verify that
legacy memberships still authorise as expected before continuing.

## Phase 2: rewrite legacy rows

Run these statements in a separate reviewed migration after every running
application instance uses the compatibility release:

```sql
UPDATE "UserOrganization" SET "role" = 'OWNER' WHERE "role" = 'SUPERADMIN';
UPDATE "UserOrganization" SET "role" = 'EDITOR' WHERE "role" = 'USER';
```

Verify the result:

```sql
SELECT "role", COUNT(*) FROM "UserOrganization" GROUP BY "role" ORDER BY "role";
SELECT COUNT(*) AS legacy_roles
FROM "UserOrganization"
WHERE "role" IN ('SUPERADMIN', 'USER');
```

The second query must return zero before legacy values are considered unused.
Keep the compatibility branches for at least one complete rollback window.
Removing values from a PostgreSQL enum requires replacing the enum type and is
a later, separately reviewed migration; it is intentionally not part of this
change.
