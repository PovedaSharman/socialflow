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

## Unknown outcomes

Irreversible publish and finalisation activities have one Temporal attempt. The
workflow retries a publish only when the provider explicitly reports that the
credential expired before publication. A timeout or unknown mutation error may
mean the platform accepted the post, so the workflow does not retry. It marks
the channel attempt as unconfirmed and tells the user to inspect the platform
before taking another action.

This is deliberately different from status polling: status checks are
read-only, use durable 20-second timers and have a finite 90-check horizon.

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
