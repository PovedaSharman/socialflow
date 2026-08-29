# Social provider release gates

Production provider discovery and connection initiation are fail-closed.
SocialFlow exposes a provider only when all of the following are true:

1. Its identifier is an exact, comma-separated entry in
   `SOCIAL_PROVIDER_ALLOWLIST`.
2. `FRONTEND_URL` is configured.
3. Every credential required by that adapter is non-blank. Google Business
   Profile may use its dedicated Google credentials or the configured YouTube
   OAuth client pair.
4. The operator has verified the platform application, callback URL, requested
   scopes, privacy/terms URLs and production approval before adding the entry
   to the allowlist.

The allowlist is the operator's explicit approval attestation; setting client
credentials alone does not advertise a provider. Matching is case-insensitive
but exact, so `linkedin` does not enable `linkedin-page`.

Discovery, connection initiation, plug discovery and provider tool/rule
metadata use the same filtered set. Existing stored connections can still be
resolved internally so operators can recover, reconnect or migrate them after
a flag change. The simulated `socialflow-test` provider is governed separately
by `ENABLE_TEST_PROVIDER=true` and can never be enabled in production.

Non-production environments keep ordinary adapters visible for development.
This does not constitute platform approval or a successful OAuth test.

## Release procedure

For each provider proposed for production:

1. Record the platform application owner and approval evidence outside the
   repository; never commit credentials or approval artifacts containing
   secrets.
2. Verify exact production callback URLs and least-privilege scopes.
3. Configure the adapter's required environment variables in the secret store.
4. Exercise connect, callback, refresh/reconnect, publish and disconnect in the
   platform sandbox/test account. Confirm whether official media alternative
   text is transmitted; only then may the adapter declare
   `mediaAlternativeText = 'official-api'`.
5. Add the exact identifier to `SOCIAL_PROVIDER_ALLOWLIST` and deploy.
6. Confirm the provider appears while an unlisted or incompletely configured
   provider remains absent.

Removing an identifier prevents new connections and discovery immediately; it
does not delete tenant data or revoke a platform token. Follow the provider's
revocation procedure when emergency credential invalidation is required.
