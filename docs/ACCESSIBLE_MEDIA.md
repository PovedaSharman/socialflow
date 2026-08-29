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
automatically determine whether a description is meaningful. Provider sandbox
verification must confirm which official APIs transmit alt text and document
any platform limitation before production enablement.

Run the 64 MB bounded source audit:

```bash
pnpm check:media-accessibility
```

The pure rule specification is included in the guarded release-host manifest.
Browser, screen-reader and live-provider verification remain pending on the
approved host and are not claimed by the source audit.
