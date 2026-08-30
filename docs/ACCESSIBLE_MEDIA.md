# Accessible media

Drafts may contain incomplete media metadata so work is never lost. Before a
post can be scheduled or published, every attached image or video in every
root/comment item must have 1–1,000 trimmed characters of alternative text.
The rule runs in both validation responses and the core post-creation service,
so a caller cannot bypass it by skipping the composer check.

The media settings editor uses an associated label, required and maximum-length
attributes, linked guidance, a character count and an announced error. A blank
save returns immediately before upload or metadata requests begin. Metadata
writes and post media DTOs also trim and validate the value server-side.

Alternative text should describe essential visual information and should not
repeat the post caption. This contract validates presence and bounds; it cannot
automatically determine whether a description is meaningful.

## Provider transmission capability

Adapters declare `mediaAlternativeText = 'official-api'` only after source
review shows they pass `MediaContent.alt` through an official platform field.
Absence of the flag means SocialFlow still stores the description for its own
accessibility contract, but does not claim the channel will receive it. The
media editor discloses selected channels that lack the capability.

Source-verified transmitters in this repository:

| Identifier                     | Official field used                |
| ------------------------------ | ---------------------------------- |
| `bluesky`                      | Bluesky embed `alt`                |
| `mastodon` / `mastodon-custom` | Mastodon media `description`       |
| `tumblr`                       | Tumblr image block `alt_text`      |
| `slack`                        | Slack image block `alt_text`       |
| `discord`                      | Discord attachment `description`   |
| `socialflow-test`              | Local simulation (no outbound API) |

All other adapters remain undisclosed transmitters until an official-API audit
and sandbox proof are recorded. Production enablement still follows
`docs/PROVIDER_RELEASE_GATES.md`, including alternative-text verification.

Run the 64 MB bounded source audit:

```bash
pnpm check:media-accessibility
```

The pure rule and disclosure specifications are included in the guarded
release-host manifest. Browser, screen-reader and live-provider verification
remain pending on the approved host and are not claimed by the source audit.
