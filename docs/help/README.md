# Help centre source

These articles are mirrored in
`apps/frontend/src/components/help/help.articles.ts` for the searchable in-app
help centre. Edit both when changing customer guidance.

## Articles

- first-schedule — Schedule your first post
- connect-channel — Connect a social channel
- accessible-media — Add accessible media descriptions
- mcp-credentials — Use MCP and API credentials safely
- billing-limits — Understand plans and limits
- failed-posts — Recover a failed post

## Email catalogue

Transactional emails should stay branded, concise and British English:

| Email                            | Purpose                                  |
| -------------------------------- | ---------------------------------------- |
| Registration verification        | Confirm the address after signup         |
| Password reset                   | Time-limited reset link                  |
| Team invitation                  | Join an organisation with a role         |
| Post failure                     | Bounded failure notice with recovery cue |
| Billing receipt / failed payment | Stripe-driven subscription notices       |

Do not invent legal or retention policy text in emails; flag undecided legal
items instead.
