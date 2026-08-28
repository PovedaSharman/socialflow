# Billing tenant-routing keys

Stripe customer IDs route customer and subscription webhooks to an organisation.
Stripe subscription identifiers route subscription-specific events. Both values
must identify at most one tenant; an ordinary non-unique index is insufficient
for that security boundary.

The Prisma schema therefore requires unique nullable values for
`Organization.paymentId` and `Subscription.identifier`. PostgreSQL permits
multiple `NULL` values in these unique indexes, so organisations without billing
remain supported.

## Pre-migration audit

Run these read-only queries against a reviewed backup or disposable restore:

```sql
SELECT "paymentId", COUNT(*) AS row_count, ARRAY_AGG(id ORDER BY id) AS organizations
FROM "Organization"
WHERE "paymentId" IS NOT NULL
GROUP BY "paymentId"
HAVING COUNT(*) > 1;

SELECT identifier, COUNT(*) AS row_count, ARRAY_AGG(id ORDER BY id) AS subscriptions
FROM "Subscription"
WHERE identifier IS NOT NULL
GROUP BY identifier
HAVING COUNT(*) > 1;
```

Both queries must return zero rows before applying the generated migration. If a
duplicate exists, compare it with Stripe test/live-mode records and the audit
trail. Do not choose a winner or delete a subscription automatically.

## Rollout

1. Stop billing webhook consumers or place them in a bounded queue.
2. Back up the database and record the restore point.
3. Generate and review the Prisma migration on the approved release host. It
   must add unique indexes for the two fields without changing unrelated data.
4. Re-run the duplicate audit, apply the migration, regenerate the Prisma client
   and run the opt-in billing tenant integration suite.
5. Replay signed Stripe test fixtures for create, update and delete events and
   confirm each event changes exactly one organisation.
6. Resume consumers and monitor unique-constraint and unknown-customer errors.

The migration and Stripe fixture replay have not run on this workstation and are
not claimed as verified.
