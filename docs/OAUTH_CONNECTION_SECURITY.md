# Social connection transaction security

Social account connections use one short-lived server-side transaction rather
than independent Redis values. The transaction expires after ten minutes and
is written with `NX`, so an outstanding state cannot be overwritten.

## User-initiated connections

The authenticated initiation route binds the provider, organisation, user,
PKCE verifier (when supplied by the provider), refresh target and optional
instance details into the transaction. Ordinary OAuth `state` query or
fragment values are replaced at this trust boundary with 32 random bytes. A
custom-field provider whose returned URL is its nonce receives the same
hardening.

The public callback atomically consumes the provider-scoped transaction before
exchanging the authorization code or mutating an integration. It then confirms
that the initiating user still has an active membership in the bound
organisation. A wrong provider, expired state, replay, disabled membership or
deleted organisation fails closed.

OAuth 1.0 providers such as X use a platform-issued request token as the
callback correlation value. Those opaque values are preserved because
replacing them would invalidate the protocol exchange; they still receive the
same provider-scoped, expiring, one-use server transaction.

## Enterprise connections and two-step providers

The enterprise initiation is authorised by its existing signed request and is
recorded as a distinct enterprise actor type. Webhook and return metadata live
inside the claimed transaction rather than in reusable state keys.

If an enterprise connection requires a second page/company selection, the
callback issues a separate 256-bit continuation token bound to the tenant,
provider and new integration. The public selection route consumes this token
once and verifies current tenant-scoped integration metadata before saving.
OAuth state is never reused as a continuation credential.

Authenticated web return URLs are restricted to the configured frontend
origin (relative paths are resolved against it). The existing mobile client
may use only the exact `postiz://integrations` deep link. Signed enterprise
flows may return to an external HTTPS URL; plain HTTP is accepted only outside
production. Invalid destinations are rejected before a transaction is stored.

## Verification

Run the bounded source audit:

```bash
pnpm check:oauth-connection-safety
```

The unit specification for transaction collision, provider isolation,
single-use consumption, state hardening and continuation-token replay is
`oauth.connect.transaction.spec.ts`. It must be run on the approved release
host; it is not part of the low-memory workstation audit.

Provider authorization and token endpoints must still be exercised with each
platform's approved sandbox/test credentials before that provider is enabled
in production. The source audit does not claim platform approval or a live
OAuth exchange.
