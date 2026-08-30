# $0 staging deployment

This directory deploys the reviewed ARM64 image to one OCI Always Free VM. It
does not build on the VM and it never enables live Stripe or unapproved social
providers.

## Before provisioning

1. Push this branch to a public GitHub repository. Public visibility is also
   consistent with the corresponding-source obligation described in
   `docs/LICENSING.md`.
2. Run the **SocialFlow staging release** workflow with the final HTTPS URL and
   `publish_image=false`. Resolve every failing source/runtime gate.
3. Run it again with `publish_image=true`. Record the resulting immutable
   `staging-<git-sha>` GHCR tag.
4. Confirm the OCI console labels the selected 2 OCPU/12 GB ARM VM and its 100 GB
   boot disk Always Free. Do not upgrade the account or select a paid shape.

## Server preparation

Install Docker Engine and the Compose plugin on Ubuntu ARM64. Permit inbound 80
and 443; restrict SSH to the operator IP. Do not expose application or data
service ports.

Copy this directory to `/srv/socialflow/deploy/staging`, then:

```bash
cd /srv/socialflow/deploy/staging
cp staging.env.example staging.env
chmod 600 staging.env
```

Replace every placeholder. `SOCIALFLOW_IMAGE` must be the immutable image from
the green workflow. Use a stable hostname that resolves to the VM before Caddy
starts. An IP-derived `sslip.io` hostname is acceptable only for disposable
testing and has no availability guarantee.

Create a hard-capped 8 GB upload filesystem rather than allowing media to fill
the VM boot disk. These commands target only the explicit staging paths shown:

```bash
sudo mkdir -p /srv/socialflow
sudo truncate -s 8G /srv/socialflow/uploads.img
sudo mkfs.ext4 /srv/socialflow/uploads.img
sudo mkdir -p /srv/socialflow/uploads
sudo mount -o loop,nosuid,nodev,noexec \
  /srv/socialflow/uploads.img /srv/socialflow/uploads
sudo chown 1000:1000 /srv/socialflow/uploads
```

Add the loopback mount to `/etc/fstab` only after confirming the mount and
permissions. `UPLOAD_HOST_PATH` in `staging.env` must remain
`/srv/socialflow/uploads`.

Validate without starting anything:

```bash
docker compose --env-file staging.env -f docker-compose.staging.yml config --quiet
```

## First clean staging database

Start private dependencies:

```bash
docker compose --env-file staging.env -f docker-compose.staging.yml \
  up -d postgres redis temporal --wait
```

Bootstrap only the clean disposable staging database:

```bash
docker compose --env-file staging.env -f docker-compose.staging.yml \
  run --rm \
  -e ALLOW_DISPOSABLE_DATABASE_BOOTSTRAP=true \
  migrate pnpm prisma-bootstrap-disposable
```

The command refuses databases whose name does not contain `test` or `staging`.
Never run it against an existing or production database.

## Start and verify

```bash
docker compose --env-file staging.env -f docker-compose.staging.yml up -d --wait
docker compose --env-file staging.env -f docker-compose.staging.yml ps
curl --fail --show-error "https://<staging-hostname>/api/monitor/ready"
curl --fail --show-error --head "https://<staging-hostname>/"
```

Run the acceptance matrix in `docs/FREE_ONLINE_TEST_LAUNCH_PLAN.md`. Keep the
cohort to five invited testers and synthetic data.

## Subsequent reviewed releases

```bash
docker compose --env-file staging.env -f docker-compose.staging.yml pull
docker compose --env-file staging.env -f docker-compose.staging.yml \
  run --rm migrate pnpm prisma-migrate-deploy
docker compose --env-file staging.env -f docker-compose.staging.yml up -d --wait
```

Change `SOCIALFLOW_IMAGE` only to a SHA whose workflow is green. Never use
`latest`.

## Evidence and rollback

Record the Git SHA, image reference, migration output, health output and test
date. Before each release, create an encrypted `pg_dump` and copy it off the VM.
If health checks fail, restore the previous immutable image tag; do not reverse a
database migration without its reviewed recovery procedure.

Inspect bounded logs with:

```bash
docker compose --env-file staging.env -f docker-compose.staging.yml \
  logs --tail=200 backend orchestrator frontend
```

Never attach full environment output, database dumps or unredacted Temporal
histories to GitHub.
