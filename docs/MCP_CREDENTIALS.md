# MCP and API credentials

Status: **partial** — Bearer-only instructions and production URL-secret denial
are in place. Hashed multi-credential records, one-time secret display,
revocation UI, tool-level enforcement and connection testing remain pending.

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

- `libraries/nestjs-libraries/src/chat/mcp.scopes.ts` defines the product scope
  set, defaults and publish/media helpers.
- `areMcpUrlSecretsAllowed` denies `/mcp/:id`, `/sse/:id` and `/message/:id` in
  production unless `ALLOW_MCP_URL_SECRETS=true` for a temporary compatibility
  window.
- Public API MCP instructions render Bearer header examples only.
- Organisation `apiKey` remains a legacy single shared secret until the hashed
  credential model lands; treat rotation and hashing as a follow-up slice.

## Operator notes

Keep `ALLOW_MCP_URL_SECRETS` unset in production. Enable it only while migrating
existing remote clients, then remove it. Never commit live secrets.

```bash
pnpm check:mcp-credentials
```

Runtime create/use/revoke tests, tool-level scope enforcement and client
connection proofs remain pending on an approved host.
