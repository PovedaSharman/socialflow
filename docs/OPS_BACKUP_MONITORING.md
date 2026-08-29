# Operations: backups, monitoring and health

This is an operator runbook. It is not evidence that drills or production monitoring have been completed.

## Health endpoints

| Service      | Path                 | Purpose                                   |
| ------------ | -------------------- | ----------------------------------------- |
| Backend      | `GET /monitor/live`  | Process liveness (no dependency checks)   |
| Backend      | `GET /monitor/ready` | Dependency readiness (PostgreSQL + Redis) |
| Orchestrator | `GET /health/status` | Temporal namespace reachability           |

Ingress should route liveness probes to `/monitor/live` and readiness probes to `/monitor/ready`. Do not send traffic until readiness returns HTTP 200.

## Structured logging

Application logs must remain redacted: never emit passwords, Bearer tokens, OAuth secrets, API credential secrets or full post bodies. Prefer organisation ID, request ID, action and outcome fields for correlation with `AuditEvent` rows.

## Monitoring hooks

- Error monitoring: Sentry is wired in the Nest backend when configured.
- Metrics: record publish latency, queue depth, provider failure rate and webhook duplicate rate once destinations are authorised.
- Alert destinations, on-call contacts and severity definitions remain operator decisions (`docs/SECURITY.md`).

## Backup and restore drill (template)

Record each drill in an operator ticket; do not claim completion in this repository without the filled record.

1. Identify PostgreSQL and object-storage backup sets for the target environment.
2. Restore PostgreSQL to a disposable instance; verify schema version and a sample tenant read.
3. Restore a bounded media sample and confirm object access through the application path.
4. Confirm encryption-key recovery procedure without printing key material.
5. Note RPO/RTO observed versus the (still undecided) service-owner targets.
6. Destroy the disposable restore environment.

## Rate limits

Anonymous auth mutations (`/auth/login`, `/auth/register`, password reset and activation) are throttled by client IP. Authenticated public post writes are throttled by organisation (and credential prefix when present). Tune `API_LIMIT` only after measuring production traffic.

## Still required before production claims

- Authorised monitoring project and alert routing
- Recorded restore drill with date and owner
- Retention schedule for audit events versus product content
- Legal decisions listed in `docs/PRIVACY.md`
