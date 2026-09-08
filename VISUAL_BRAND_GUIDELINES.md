# SocialFlow visual brand guidelines

## Brand idea

SocialFlow is an operational workspace for planning, approving and publishing
social content. The interface should feel composed, dependable and precise.
Confidence comes from order, readable information and predictable behaviour—not
decoration.

## Principles

1. **Calm under load.** Dense schedules and channel states remain easy to scan.
2. **One visual voice.** Reuse the same spacing, type, surface and interaction
   rules everywhere.
3. **Action has hierarchy.** Each view has one obvious primary action. Routine
   controls remain quiet until needed.
4. **Status is explicit.** Pair colour with a label or icon. Never make colour
   carry meaning alone.
5. **Platforms stay recognisable.** Platform brand colours belong to their icons,
   not to whole cards or backgrounds.

## Logo and name

- Write the product name as **SocialFlow** with a capital S and F.
- Keep clear space around the mark equal to the height of its capital S.
- Use the full wordmark in wide contexts and the configured symbol in compact
  navigation.
- Do not add gradients, glow, outlines or platform colours to the product mark.
- Product name, logo and support links remain configurable rather than embedded
  in feature components.

## Colour

The light theme is primary. It uses neutral white and cool grey surfaces with a
single accessible emerald action colour.

| Role          | Light     | Dark      | Use                      |
| ------------- | --------- | --------- | ------------------------ |
| Canvas        | `#F4F6F5` | `#121416` | Page background          |
| Surface       | `#FFFFFF` | `#1A1D21` | Shell and major panels   |
| Soft surface  | `#F5F7F6` | `#202429` | Cards and grouped rows   |
| Soft hover    | `#F0F3F1` | `#272C32` | Interactive card hover   |
| Soft selected | `#E8F3EE` | `#17372C` | Selected card or row     |
| Text          | `#15201B` | `#F4F5F4` | Primary content          |
| Muted text    | `#5F6B64` | `#A3ABA6` | Metadata and help        |
| Border        | `#E2E7E4` | `#2E3431` | Structural separators    |
| Soft border   | `#EDF0EE` | `#292E34` | Card boundaries          |
| Primary       | `#047857` | `#34D399` | Primary action and focus |

Semantic success, warning, error and information colours are defined in
`apps/frontend/src/app/colors.scss`. Platform colours are permitted only in a
platform logo, a narrow identifying edge or an official preview.

Do not use decorative gradients, rainbow metric cards or arbitrary tints. A
screen should still feel coherent when every platform icon is hidden.

## Typography

Use Plus Jakarta Sans with Inter and the system sans stack as fallbacks.

| Style         | Size    | Weight  | Use                                |
| ------------- | ------- | ------- | ---------------------------------- |
| Page title    | 28–32px | 700     | One per page                       |
| Section title | 18–20px | 600     | Major content group                |
| Card title    | 14–16px | 600     | Card identity                      |
| Body          | 14–16px | 400–500 | Main copy                          |
| Metadata      | 12–13px | 400–500 | Time, source and supporting detail |
| Label         | 12–13px | 600     | Controls and compact status        |

Use sentence case. Keep headings compact and use tabular numerals for metrics,
dates and times. Avoid serif display type, all-caps navigation and oversized
marketing headings inside the product.

## Spacing and layout

- Base unit: 4px.
- Preferred sequence: 4, 8, 12, 16, 24, 32, 48 and 64px.
- Card padding: 16px compact, 20–24px standard.
- Grid gap: 12px compact, 16–24px standard.
- Controls: at least 44px on touch layouts.
- Align related titles, values and actions to a shared grid.
- Use whitespace before adding separators or containers.

## Soft Surface cards

Soft Surface is the default card language. It groups information with a quiet
tonal fill instead of conspicuous outlines or shadows.

### Standard card

- Background: `--sf-soft-surface`.
- Border: 1px `--sf-soft-border`.
- Radius: 12px.
- Padding: 16–24px.
- Shadow: none.

### Compact row

- Background: `--sf-soft-surface`.
- Border: transparent.
- Radius: 8px.
- Minimum height: 44px.
- Horizontal padding: 12–16px.

### Interactive card

- Hover changes the surface by one tonal step and reveals existing actions.
- Keyboard focus uses the global 2px focus ring with a 2px offset.
- Selected state uses a soft emerald fill plus border or icon; do not rely on
  fill alone.
- Pressed state may darken one additional tonal step.
- Motion lasts 120–180ms and is removed under reduced-motion preferences.

Use the shared `sf-soft-card`, `sf-soft-card-interactive` and `sf-soft-row`
classes. Do not reproduce their values in individual components.

## Buttons and controls

- One solid primary button per view or task group.
- Secondary actions use neutral soft fills or simple text treatment.
- Destructive actions use the error token and explicit wording.
- Control radius is 8px; panel radius is 12px.
- Icons supplement labels unless the action is universally understood and has
  an accessible name.

## Icons and imagery

- Use one outline icon family and a consistent optical size.
- Product icons inherit the interface colour; platform logos retain official
  colours.
- Content thumbnails use a consistent aspect ratio and subtle 8px radius.
- Avoid mascots, decorative 3D objects, generic AI illustrations and stock
  imagery in operational views.

## Data and status

- Metrics use a label, tabular value and one short comparison or timeframe.
- Calendar items prioritise platform, title, time and state in that order.
- Approval cards identify the content, channels, scheduled time and required
  decision.
- Activity and audit rows describe a real recorded event and actor. Do not imply
  live agent monitoring unless the system stores that state.
- Charts use direct labels or accessible summaries and do not depend on colour
  alone.

## Voice in the interface

Use short, direct language: “Create post”, “Review”, “Schedule” and “Reconnect
channel”. Prefer concrete states such as “Awaiting approval” over vague labels.
Error messages say what happened and the next useful action.

## Accessibility

- Normal text and controls meet WCAG 2.2 AA contrast.
- Focus is always visible.
- Status includes text or an icon in addition to colour.
- Touch controls are at least 44px.
- Layouts support 360, 768, 1024 and 1440px viewports.
- Non-essential transitions respect `prefers-reduced-motion`.

## Reference implementation

- Tokens: `apps/frontend/src/app/colors.scss`
- Tailwind aliases: `apps/frontend/tailwind.config.cjs`
- Shared Soft Surface classes: `apps/frontend/src/app/global.scss`
- Live component reference: authenticated `/design-system`
- Broader interaction and accessibility rules: `DESIGN_SYSTEM.md`
