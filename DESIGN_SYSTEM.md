# SocialFlow design system

SocialFlow is a working brand name supplied by one configuration module and public environment variables. Product code must not make the name, support URL or logo difficult to replace.

## Direction

The visual language is calm, editorial and operational: warm neutral surfaces, deep ink text and one distinctive indigo primary. Accent and semantic colours are reserved for action and status. The calendar, composer, connection health, approval state and next action receive the strongest hierarchy.

## Tokens

| Purpose     | Light     | Dark      |
| ----------- | --------- | --------- |
| Canvas      | `#F7F7F8` | `#0D1017` |
| Surface     | `#FFFFFF` | `#151923` |
| Elevated    | `#FCFCFD` | `#1C2230` |
| Text        | `#171923` | `#F4F5F7` |
| Muted text  | `#626776` | `#A9AFBC` |
| Border      | `#E3E5EA` | `#303746` |
| Primary     | `#4F46E5` | `#818CF8` |
| Success     | `#18794E` | `#4ADE80` |
| Warning     | `#9A6700` | `#FBBF24` |
| Error       | `#B42318` | `#FB7185` |
| Information | `#175CD3` | `#60A5FA` |

Spacing follows a 4px base: 4, 8, 12, 16, 24, 32, 48 and 64. Controls are at least 44px on touch layouts. Corners use 8px for controls and 12px for panels. Shadows are limited to menus/dialogues; borders and surface contrast carry normal grouping.

Typography uses Plus Jakarta Sans where loaded and a system sans-serif fallback. Body text is 14–16px with at least 1.45 line height. Page headings remain 28–32px on desktop and 24–28px on mobile. Labels use sentence case and British English.

## Interaction and accessibility

- Every interactive element has a visible 2px focus ring with a 2px offset. Never globally suppress outlines.
- Hover is an enhancement; focus, pressed, selected, disabled, loading and error states are independently recognisable.
- Status uses icon/label plus colour. Charts include a text summary, accessible name, direct values/tooltip and patterns or shapes when series might be confused.
- Forms associate labels, hints and errors through IDs and announce submission outcomes.
- Skeletons preserve layout and expose a suitable busy state. Empty states state what is empty and offer one primary next action.
- Motion is brief (120–180ms) and disabled or reduced under `prefers-reduced-motion`.
- Dialogues trap focus, name themselves and restore focus on close.

## Responsive shell

- Mobile (`≤1025px`): compact top bar, labelled fixed bottom navigation and touch targets of at least 44px; the calendar still requires an agenda view in the content-workflow milestone.
- Tablet (`1026–1300px`): compact navigation and flexible content panels.
- Desktop: persistent navigation with text labels, page toolbar and optional contextual inspector.

## Component showcase

The authenticated `/design-system` route is the component reference surface. It currently showcases semantic colours, buttons, inputs, badges, alerts, skeletons and empty states in both themes. Calendar cells and chart treatments remain tied to their product milestones rather than being represented by disconnected mock components.

The Playwright specification covers the authentication shell and design-system route at 360, 768, 1024 and 1440 CSS pixels in dark and light modes. It runs Axe rules tagged for WCAG 2.0, 2.1 and 2.2 at levels A and AA, checks horizontal overflow, and checks the mobile navigation position. The specification exists but its post-change runtime result is not yet verified on the resource-constrained development machine; documentation must not describe it as passing until CI or a suitable host records the result.
