# Publishing retries and idempotency

Every provider publication receives a deterministic key with the prefix
`sfpub:v1:`. The key is a SHA-256 digest of the organisation, channel, internal
post ID, scheduled publication time and previous platform release ID. It does
not contain post content or credentials.

The same logical attempt receives the same key when an activity is retried. A
reschedule changes the scheduled time, and an intentional repeat includes the
previous release ID, producing a new key. Providers with a native idempotency or
client-reference field should send this value unchanged. The local SocialFlow
test provider uses it as its simulated platform post ID, so repeating the same
attempt returns the same publication rather than creating another one.

Automatic publication retry is opt-in. A provider must declare
`publicationRetry = 'idempotency-key'` after its adapter has been verified to
apply the key to the platform mutation. The local test provider is currently the
only enabled adapter. An unaudited provider may still refresh its credential,
but the workflow stops the current attempt rather than risking a duplicate.

Retry history stores a redacted message of at most 1,000 characters and a
content-free summary of at most 50 root/comment attempts. The summary retains
post, integration and provider identifiers, state and attempt kind; it excludes
post content, media, settings and integration credentials. Debug export reads
at most the newest 100 history rows for the selected post group. Legacy rows
created before this boundary may still contain full payloads and require a
reviewed data-maintenance cleanup before production readiness is claimed.

## Unknown outcomes

Irreversible publish and finalisation activities have one Temporal attempt. The
workflow retries a publish only when the provider explicitly reports that the
credential expired before publication. A timeout or unknown mutation error may
mean the platform accepted the post, so the workflow does not retry. It marks
the channel attempt as unconfirmed and tells the user to inspect the platform
before taking another action.

This is deliberately different from status polling: status checks are
read-only, use durable 20-second timers and have a finite 90-check horizon.

## Immediate publication

“Post Now” is a separate, always-visible keyboard and touch control for roles
that may approve publication. It requires an explicit confirmation immediately
before validation/submission begins. The confirmation states that every
selected channel will receive the content immediately and that SocialFlow
cannot recall it. Cancelling returns to the composer without starting a request.

## Recovery sweep

The missing-post sweep selects at most 100 overdue root posts at a time, oldest
first, and starts or signals their deterministic Temporal workflow IDs
sequentially. Subsequent scheduled sweeps handle later batches. This prevents a
large backlog from being loaded or launched in parallel.

## Release verification

On the approved release host, use the local test provider to schedule one post,
inject one explicit pre-publication credential-refresh response and confirm the
retry has the same `sfpub:v1:` key and one simulated release URL. Separately
inject a timeout and an unknown post-mutation failure; both must stop with the
unconfirmed recovery message and must not call the provider again. Retain the
Temporal history and test output. These scenarios have not been executed on
this workstation and are not claimed as passing.

The prepared gate connects to an existing non-production Temporal service; it
does not start one. Create or select a namespace whose name contains `test`,
then run on the approved release host:

```bash
NODE_ENV=test \
RUN_TEMPORAL_INTEGRATION_TESTS=true \
ALLOW_TEMPORAL_TEST_HISTORY=true \
TEMPORAL_ADDRESS='127.0.0.1:7233' \
TEMPORAL_NAMESPACE='socialflow-test' \
TEMPORAL_TEST_ARTIFACT_DIR='artifacts/temporal-post-safety' \
pnpm test:publish-workflow:release
```

The runner refuses non-test namespaces and artifact paths outside the
repository. It starts one Jest process and one Temporal worker, caps the Jest
heap at 1 GB and terminates the command after 90 seconds. The integration suite
runs refresh, unknown-outcome and 500 ms timeout scenarios sequentially and
writes one JSON history for each scenario. Preserve those histories with the
command output as the milestone evidence.
