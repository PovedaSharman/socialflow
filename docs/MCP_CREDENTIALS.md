# MCP and API credentials

Status: **partial** — Bearer-only instructions, production URL-secret denial,
hashed credentials, MCP tool scopes and public REST scope enforcement are in
source. Live create/use/revoke proofs remain pending. Schema generate/migrate
must run on an approved host.

## Required end state

- Credentials have a name, organisation, creator, hashed secret, prefix, scopes,
  creation time, optional expiry, last-used time and revocation time.
- Secrets are shown once; lists expose only the prefix and metadata.
- Streamable HTTP accepts `Authorization: Bearer …` only. Credentials are never
  accepted in the URL for new clients.
- Initial scopes: `audit:read`, `channels:read`, `posts:read`, `posts:draft`,
  `posts:schedule`, `posts:publish`, `media:generate`.
- `posts:publish` and `media:generate` stay off unless explicitly granted.
- Client instructions cover Cursor, Claude, ChatGPT-compatible remote clients
  and a generic Bearer HTTP client without embedding secrets in URLs.

## Scope enforcement

MCP tool handlers and `/public/v1` REST routes both enforce scopes. MCP-only
checks do **not** protect the REST API.

| Surface     | Mechanism                                        |
| ----------- | ------------------------------------------------ |
| MCP tools   | `missingMcpScope` per tool                       |
| Public REST | `PublicApiScopeGuard` + `evaluatePublicApiScope` |

Post create scope is taken from `body.type`:

- `draft` → `posts:draft`
- `schedule` → `posts:schedule`
- `now` → `posts:publish`

Missing, non-array or unknown scope context denies the request (fail closed).
Allowed and denied public API calls write sanitised `AuditEvent` rows without
content, secrets or bodies.

## Legacy credential compatibility

| Credential                   | `authKind` | Scopes                                               |
| ---------------------------- | ---------- | ---------------------------------------------------- |
| Hashed `sf_live_…`           | `scoped`   | Stored scopes on the credential                      |
| Legacy organisation `apiKey` | `legacy`   | `DEFAULT_MCP_SCOPES` (no publish, no media:generate) |
| OAuth `pos_…` tokens         | `oauth`    | `DEFAULT_MCP_SCOPES`                                 |

Operators should migrate clients to scoped `sf_live_` credentials. Legacy keys
remain usable for default-deny scopes until revoked, but cannot immediate-publish
or generate media.

## Current source controls

- `ApiCredential` Prisma model stores only `secretHash` and a display `prefix`.
- `POST/GET/DELETE /user/api-credentials` create, list and revoke credentials
  for organisation admins. Create responses include the plaintext secret once.
- MCP and public API Bearer auth resolve `sf_live_…` secrets through the hashed
  table first, then fall back to the legacy organisation `apiKey`.
- `areMcpUrlSecretsAllowed` denies `/mcp/:id`, `/sse/:id` and `/message/:id` in
  production unless `ALLOW_MCP_URL_SECRETS=true`.

## Operator notes

1. On an approved host, generate Prisma client and apply reviewed migrations
   (`docs/SCHEMA_APPLY.md`) before enabling new tables against a database.
2. Keep `ALLOW_MCP_URL_SECRETS` unset in production.
3. Prefer creating scoped `sf_live_` credentials over rotating the legacy shared
   organisation API key.

```bash
pnpm check:mcp-credentials
```

Runtime create/use/revoke tests and client connection proofs remain pending on
an approved host.
