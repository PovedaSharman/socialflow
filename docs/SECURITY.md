# Security model and launch checklist

## Trust boundaries

Customer browsers, public API/MCP clients, social providers, Stripe and email providers are untrusted networks. PostgreSQL, Redis, Temporal and object storage stay private. Organisation membership and credential scope are checked server-side on every operation.

## Required controls

- Argon2id or an approved adaptive password hash; short-lived signed sessions; rotation and revocation for security changes.
- CSRF protection for cookie-authenticated mutations; strict origin/CORS policy; secure, HTTP-only, same-site cookies.
- OAuth state, nonce and PKCE where supported; exact redirect URIs; provider
  tokens protected by the separately managed authenticated key ring documented
  in [SOCIAL_CREDENTIAL_ENCRYPTION.md](SOCIAL_CREDENTIAL_ENCRYPTION.md).
- Hashed API/MCP secrets, scope checks per handler, rate limiting and one-time secret display.
- Validated Stripe signatures, event idempotency and account/mode checks before mutation.
- MIME/content inspection, size and quota checks, random object names and malware scanning hook for uploads.
- SSRF protections for customer-provided endpoints; outbound allow-listing where practical.
- Secret/content redaction in structured logs; no credentials used as request IDs.
- Dependency, static-analysis, tenant-isolation and authorisation tests in CI.

## Incident readiness

The operator must define severity, on-call contacts, customer notification and regulator assessment procedures. No response-time or breach-notification claim is approved in this repository.
