# Mobile calendar and list view

The desktop calendar remains the primary operational view. Customers can
switch to a bounded list view from the labelled calendar/list toggle; the list
requests at most 100 items per page and supports all, scheduled, draft and
failed status filters.

At narrow widths, pagination and status filters stack to the available width
instead of relying on a 200 px fixed label beside other controls. Previous and
next are native disabled buttons with 44 px targets. Status and view selectors
are grouped toggle buttons with `aria-pressed`, visible focus and non-colour
selection state.

Each post card exposes its edit surface as a labelled keyboard button. Failed
cards retain a visible ring and `!` marker, show and announce their bounded error
text, and tell the customer to open the post, review it and check the platform
before retrying. The edit button is linked to that status description, so
failure and recovery are not conveyed by red alone.

## Verification

Run the source-level, 64 MB bounded audit:

```bash
pnpm check:calendar-mobile
```

The release gate must still exercise keyboard navigation and capture the list
at 360, 768, 1024 and 1440 CSS pixels in both themes. That browser/visual gate
has not been run on the resource-constrained workstation and is not claimed.
