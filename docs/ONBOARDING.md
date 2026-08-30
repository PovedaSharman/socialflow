# Onboarding checklist

Non-technical first-run path:

1. Register and verify email.
2. Create or join an organisation.
3. Connect at least one documented test or approved channel.
4. Upload or attach media and add alternative text.
5. Schedule the first post from Calendar.
6. Optional: create a scoped MCP credential from Access and revoke it after a
   connection test.
7. Open Help when stuck; search for schedule, MCP or billing.

## In-product checklist

Calendar shows a dismissible **Getting started** checklist per organisation.
Progress is stored in browser `localStorage` under
`sf-onboarding-checklist:<orgId>` so it survives reloads without a new API.
Connecting an enabled channel auto-completes the channel step. Each step links
to the matching Help article (`/help?article=…`).

The existing onboarding modal still covers channel connection. Help centre
articles and the FAQ entry provide recovery for later steps without requiring a
new modal for every case.
