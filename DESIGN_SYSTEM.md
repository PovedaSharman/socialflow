# SocialFlow design system

SocialFlow is a working brand name supplied by one configuration module and public environment variables. Product code must not make the name, support URL or logo difficult to replace.

## Direction

The visual language is light-first and operational: white and cool grey surfaces, deep ink text and one accessible green accent for primary actions and focus. Purple and indigo brand colours are retired. Dark mode remains available as an optional charcoal theme with a lighter green accent on dark surfaces.

The calendar, composer, connection health, approval state and next action receive the strongest hierarchy. Prefer calm surfaces over decorative gradients; do not reintroduce purple/indigo brand accents.

## Tokens

| Purpose     | Light     | Dark      |
| ----------- | --------- | --------- |
| Canvas      | `#F4F6F5` | `#121416` |
| Surface     | `#FFFFFF` | `#1A1D21` |
| Elevated    | `#FBFCFB` | `#22262B` |
| Text        | `#15201B` | `#F4F5F4` |
| Muted text  | `#5F6B64` | `#A3ABA6` |
| Border      | `#E2E7E4` | `#2E3431` |
| Primary     | `#047857` | `#34D399` |
| On primary  | `#FFFFFF` | `#052E1C` |
| Success     | `#047857` | `#4ADE80` |
| Warning     | `#9A6700` | `#FBBF24` |
| Error       | `#B42318` | `#FB7185` |
| Information | `#175CD3` | `#60A5FA` |

Light primary `#047857` on white foreground `#FFFFFF` meets at least **4.5:1** contrast for normal text (WCAG 2.2 AA). Do not lighten the light-theme primary without re-checking contrast. Prefer `bg-btnPrimary` / `text-white` or semantic brand tokens over hard-coded hex pairs. New surfaces should use semantic tokens (`bg-canvas`, `bg-surface`, `bg-brand`, `text-content`, `border-subtleBorder`) rather than deprecated `--color-custom*` values.

Spacing follows a 4px base: 4, 8, 12, 16, 24, 32, 48 and 64. Controls are at least 44px on touch layouts. Corners use 8px for controls and 12px for panels. Shadows are limited to menus/dialogues; borders and surface contrast carry normal grouping.

Typography uses Plus Jakarta Sans where loaded and a system sans-serif fallback. Body text is 14–16px with at least 1.45 line height. Page headings remain 28–32px on desktop and 24–28px on mobile. Labels use sentence case and British English.

## Interaction states

Every interactive control must be independently recognisable in these states:

| State    | Expectation                                                                   |
| -------- | ----------------------------------------------------------------------------- |
| Default  | Clear affordance without relying on colour alone                              |
| Hover    | Enhancement only; never the sole way to discover an action                    |
| Focus    | Visible 2px green focus ring (`--sf-focus`) with at least 2px offset          |
| Pressed  | Distinct pressed treatment for buttons and toggles                            |
| Selected | Selected tabs/list rows use border/background plus a non-colour cue           |
| Disabled | Reduced contrast is allowed, but the control remains readable as disabled     |
| Loading  | Busy state announced; layout preserved (skeletons where appropriate)          |
| Error    | Text (and preferably `aria-describedby`) plus optional icon; not colour alone |

Never globally suppress outlines. Prefer non-colour status cues (icons or labels) alongside colour.

## Keyboard and focus

- Interactive controls are reachable by Tab and operable with Enter/Space.
- Skip links or landmark regions identify primary navigation and main content.
- Dialogues trap focus while open, expose an accessible name, and restore focus to the opener on close.
- Menus and listboxes follow the same restore-focus rule when dismissed.
- Calendar and composer actions that were historically hover-only must keep a visible, keyboard-operable control.

## Forms and error semantics

- Labels, hints and errors are associated through stable IDs.
- Required fields are labelled; validation messages use British English.
- Submission outcomes are announced (success or failure) without relying on toast colour alone.
- Password and one-time secret fields remain compatible with password managers where applicable.

## Charts and data visualisation

- Charts include an accessible name and a text summary or data table where practical.
- Direct values or tooltips expose figures; series that might be confused also use patterns or shapes, not colour alone.
- Empty chart states say what is missing and offer one primary next action.

## Motion and reduced motion

- Motion is brief (about 120–180ms) and purposeful.
- Honour `prefers-reduced-motion: reduce` by removing non-essential animation and transitions.
- Loading indicators may remain if meaning does not depend solely on motion.

## Responsive shell

| Band                   | Behaviour                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Mobile (`≤1025px`)     | Compact top bar, labelled fixed bottom navigation, ≥44px touch targets; dense calendars need a list/agenda path |
| Tablet (`1026–1300px`) | Compact navigation and flexible content panels                                                                  |
| Desktop (`>1300px`)    | Persistent navigation with text labels, page toolbar and optional contextual inspector                          |

Breakpoints of interest for evidence: **360, 768, 1024 and 1440** CSS pixels, in both light and dark themes.

## Component showcase

The authenticated `/design-system` route is the component reference surface. It currently showcases semantic colours, buttons, inputs, badges, alerts, skeletons and empty states in both themes. Calendar cells and chart treatments remain tied to their product milestones rather than disconnected mock components.

Source presence of the showcase route is **not** WCAG or responsive evidence.

## WCAG and viewport test matrix

| Check                                      | Tooling / method                            | Source status       | Runtime evidence             |
| ------------------------------------------ | ------------------------------------------- | ------------------- | ---------------------------- |
| WCAG 2.0–2.2 A/AA (axe tags)               | Playwright + Axe on auth + `/design-system` | Spec present        | Pending release host         |
| Horizontal overflow                        | Playwright viewport pass                    | Spec present        | Pending                      |
| Mobile navigation position                 | Playwright                                  | Spec present        | Pending                      |
| Keyboard focus visibility                  | Manual + Playwright                         | CSS focus tokens    | Pending                      |
| Primary CTA contrast ≥ 4.5:1               | `check:theme-palette` calculates ratio      | Static audit passes | Pending browser confirmation |
| Reduced motion                             | CSS `prefers-reduced-motion`                | Partial             | Pending                      |
| Viewports 360 / 768 / 1024 / 1440 × themes | Playwright matrix                           | Documented          | Pending                      |

The Playwright specification covers the authentication shell and design-system route at those widths in dark and light modes. It must not be described as passing until CI or an approved host records the result.

## Implemented source vs verified runtime

| Item                                   | Implemented in source                   | Verified at runtime                    |
| -------------------------------------- | --------------------------------------- | -------------------------------------- |
| Semantic light/dark tokens             | Yes                                     | Pending browser review                 |
| Theme contrast calculation for primary | Yes (`scripts/check-theme-palette.mjs`) | Pending axe/Playwright on release host |
| Focus, landmarks, reduced-motion CSS   | Yes (partial motion)                    | Pending                                |
| `/design-system` showcase              | Yes                                     | Pending                                |
| Responsive shell rules                 | Yes                                     | Pending 360–1440 visual review         |
| Chart accessibility patterns           | Documented; product charts vary         | Pending per analytics surfaces         |

Do not claim SocialFlow is production-ready or WCAG-complete from this document alone.
