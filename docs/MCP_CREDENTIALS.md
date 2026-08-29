# MCP and API credentials

Status: **partial** — Bearer-only instructions, production URL-secret denial,
product scope defaults and hashed `ApiCredential` create/list/revoke APIs are
in source. Tool-level enforcement, one-time UI display and connection proofs
remain pending. Schema push/generate must run on an approved host.

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

## Current source controls

- `ApiCredential` Prisma model stores only `secretHash` and a display `prefix`.
- `POST/GET/DELETE /user/api-credentials` create, list and revoke credentials
  for organisation admins. Create responses include the plaintext secret once.
- MCP Bearer auth resolves `sf_live_…` secrets through the hashed table first,
  then falls back to the legacy organisation `apiKey` with default-deny scopes.
- `areMcpUrlSecretsAllowed` denies `/mcp/:id`, `/sse/:id` and `/message/:id` in
  production unless `ALLOW_MCP_URL_SECRETS=true`.
- Public API MCP instructions render Bearer header examples only.

## Operator notes

1. On an approved host, run `pnpm prisma-generate` then apply the schema with the
   documented disposable/non-production push procedure before enabling the new
   endpoints against a database.
2. Keep `ALLOW_MCP_URL_SECRETS` unset in production.
3. Prefer creating scoped `sf_live_` credentials over rotating the legacy shared
   organisation API key.

```bash
pnpm check:mcp-credentials
```

Runtime create/use/revoke tests, tool-level scope enforcement and client
connection proofs remain pending on an approved host. The Access page includes
a one-time secret create/list/revoke UI for hashed credentials.
