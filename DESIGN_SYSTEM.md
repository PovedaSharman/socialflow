# SocialFlow design system

SocialFlow is a working brand name supplied by one configuration module and public environment variables. Product code must not make the name, support URL or logo difficult to replace.

## Direction

The visual language is light-first and operational: white and cool grey surfaces, deep ink text and one green accent for primary actions and focus. Purple and indigo brand colours are retired. Dark mode remains available as an optional charcoal theme with the same green accent.

## Tokens

| Purpose     | Light     | Dark      |
| ----------- | --------- | --------- |
| Canvas      | `#F4F6F5` | `#121416` |
| Surface     | `#FFFFFF` | `#1A1D21` |
| Elevated    | `#FBFCFB` | `#22262B` |
| Text        | `#15201B` | `#F4F5F4` |
| Muted text  | `#5F6B64` | `#A3ABA6` |
| Border      | `#E2E7E4` | `#2E3431` |
| Primary     | `#059669` | `#34D399` |
| Success     | `#047857` | `#4ADE80` |
| Warning     | `#9A6700` | `#FBBF24` |
| Error       | `#B42318` | `#FB7185` |
| Information | `#175CD3` | `#60A5FA` |

Spacing follows a 4px base: 4, 8, 12, 16, 24, 32, 48 and 64. Controls are at least 44px on touch layouts. Corners use 8px for controls and 12px for panels. Shadows are limited to menus/dialogues; borders and surface contrast carry normal grouping.

Typography uses Plus Jakarta Sans where loaded and a system sans-serif fallback. Body text is 14–16px with at least 1.45 line height. Page headings remain 28–32px on desktop and 24–28px on mobile. Labels use sentence case and British English.

## Interaction and accessibility

Visible keyboard focus uses the green focus token. Prefer non-colour status cues (icons or labels) alongside colour. Respect `prefers-reduced-motion`. New surfaces should use semantic tokens (`bg-canvas`, `bg-surface`, `bg-brand`, `text-content`, `border-subtleBorder`) rather than deprecated `--color-custom*` values.
