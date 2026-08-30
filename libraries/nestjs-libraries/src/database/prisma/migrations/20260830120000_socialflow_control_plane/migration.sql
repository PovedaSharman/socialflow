-- SocialFlow control-plane tables and media size column.
-- Additive and safe for existing tenants. Do not run on the development laptop;
-- apply on an approved host with: pnpm prisma-migrate-deploy

-- Media.fileSize: existing rows receive 0 (unknown size). Operators must treat 0
-- as "unknown" for quota enforcement until a backfill from object storage
-- metadata is completed. New uploads must persist a trusted byte length.
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ApiCredential" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApiCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ApiCredential_secretHash_key" ON "ApiCredential"("secretHash");
CREATE INDEX IF NOT EXISTS "ApiCredential_organizationId_revokedAt_idx" ON "ApiCredential"("organizationId", "revokedAt");
CREATE INDEX IF NOT EXISTS "ApiCredential_prefix_idx" ON "ApiCredential"("prefix");
CREATE INDEX IF NOT EXISTS "ApiCredential_createdByUserId_idx" ON "ApiCredential"("createdByUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ApiCredential_organizationId_fkey'
  ) THEN
    ALTER TABLE "ApiCredential"
      ADD CONSTRAINT "ApiCredential_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ApiCredential_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "ApiCredential"
      ADD CONSTRAINT "ApiCredential_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "outcome" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "requestId" TEXT,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditEvent_organizationId_createdAt_idx" ON "AuditEvent"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditEvent_actorUserId_idx" ON "AuditEvent"("actorUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AuditEvent_organizationId_fkey'
  ) THEN
    ALTER TABLE "AuditEvent"
      ADD CONSTRAINT "AuditEvent_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AuditEvent_actorUserId_fkey'
  ) THEN
    ALTER TABLE "AuditEvent"
      ADD CONSTRAINT "AuditEvent_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ConsentPreference" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsentPreference_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ConsentPreference_organizationId_purpose_createdAt_idx"
  ON "ConsentPreference"("organizationId", "purpose", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConsentPreference_organizationId_fkey'
  ) THEN
    ALTER TABLE "ConsentPreference"
      ADD CONSTRAINT "ConsentPreference_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
