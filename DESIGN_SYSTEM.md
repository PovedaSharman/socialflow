# SocialFlow design system

SocialFlow is a working brand name supplied by one configuration module and public environment variables. Product code must not make the name, support URL or logo difficult to replace.

## Direction

The visual language is light-first and operational: white and cool grey surfaces, deep ink text and one accessible green accent for primary actions and focus. Purple and indigo brand colours are retired. Dark mode remains available as an optional charcoal theme with a lighter green accent on dark surfaces.

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

Light primary `#047857` on white foreground `#FFFFFF` meets at least **4.5:1** contrast for normal text (WCAG 2.2 AA). Do not lighten the light-theme primary without re-checking contrast. Prefer `bg-btnPrimary` / `text-white` or semantic brand tokens over hard-coded hex pairs.

Spacing follows a 4px base: 4, 8, 12, 16, 24, 32, 48 and 64. Controls are at least 44px on touch layouts. Corners use 8px for controls and 12px for panels. Shadows are limited to menus/dialogues; borders and surface contrast carry normal grouping.

Typography uses Plus Jakarta Sans where loaded and a system sans-serif fallback. Body text is 14–16px with at least 1.45 line height. Page headings remain 28–32px on desktop and 24–28px on mobile. Labels use sentence case and British English.

## Interaction and accessibility

### Focus and keyboard

- Visible keyboard focus uses the green focus token (`--sf-focus`) at least 2px.
- Interactive controls are reachable by Tab and operable with Enter/Space.
- Dialogues trap focus while open and restore focus to the opener on close.
- Skip links or landmark regions identify primary navigation and main content.

### Motion

- Honour `prefers-reduced-motion: reduce` by removing non-essential animation.
- Loading indicators may remain if they do not rely solely on motion for meaning.

### Forms and status

- Errors are announced with text (and preferably `aria-describedby`), not colour alone.
- Required fields are labelled; validation messages use British English.
- Charts expose text summaries or data tables for non-visual access where practical.

### Responsive shell

- Breakpoints of interest: 360, 768, 1024 and 1440 CSS pixels.
- Primary operational views remain usable at 360px with a list alternative where calendars are dense.

### Component showcase

- Route: `/design-system` (internal reference). Source presence is not WCAG evidence.

## Verification status

| Item                                    | Source                        | Runtime evidence                       |
| --------------------------------------- | ----------------------------- | -------------------------------------- |
| Semantic tokens                         | Implemented                   | Pending browser review                 |
| Theme contrast ≥ 4.5:1 for primary CTAs | Static audit calculates ratio | Pending axe/Playwright on release host |
| Reduced motion                          | Partial CSS                   | Pending                                |
| Viewport matrix 360/768/1024/1440       | Documented                    | Pending                                |

Visible keyboard focus uses the green focus token. Prefer non-colour status cues (icons or labels) alongside colour. New surfaces should use semantic tokens (`bg-canvas`, `bg-surface`, `bg-brand`, `text-content`, `border-subtleBorder`) rather than deprecated `--color-custom*` values.
