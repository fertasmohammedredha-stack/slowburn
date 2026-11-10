# Design system: Slowburn

Source of truth: `tokens.json` (light) and `tokens.dark.json` (dark). `npm run tokens` generates `src/styles/tokens.css`.
Original work. Nothing is copied from the researched app.

## Principles
1. The timer is the product; everything else is quiet.
2. Colour means phase. One accent that follows the timer (amber focus, moss short break, dusk long break).
3. Warm and tactile, not glassy: paper grain, soft borders, serif numerals.
4. Motion explains state and never decorates: the ring drains, the ember breathes while running, the accent cross-fades
   between phases (600ms). Everything stops under `prefers-reduced-motion`.

## Colour roles
bg, surface, surface-sunk, border, border-input (3:1 against bg and surface), text, text-muted, accent-focus,
accent-short, accent-long, on-accent, danger, success. `--accent` is set by `[data-mode]` on `<html>`.

## Type scale (px size / line / weight)
micro 11/16/500, xs 12/16/500, sm 14/20/450, base 16/24/450, lg 20/28/600, xl 28/34/600, display 44/48/500, clock 76/76/400.

## Space and shape
Space: 0, 4, 8, 12, 16, 24, 32, 48, 64. Radius: 8, 12, 20, pill. Cards: 1px warm border + two-layer soft shadow.
Touch targets: 40px minimum for buttons, 56px for the main Start button, 36px icon buttons.

## Layout
Mobile first. One column with a bottom tab bar; from 760px a top nav; from 960px the Focus page is two columns
(sticky timer, scrolling task queue). Content max width 72rem.

## Components
| component | variants / states |
| --- | --- |
| Button | primary (accent), secondary, ghost, danger; sm / md / lg; hover, active (scale .97), disabled, focus-visible |
| IconButton | default, on (active task) |
| Segmented | pressed / not pressed; used for phase and theme |
| Switch | on, off, focus |
| NumberField (stepper) | draft text while typing, clamps on blur or Enter, arrow keys, min/max disabled buttons |
| Slider | fill follows value |
| Select | native, restyled |
| Card | with eyebrow, title, action |
| Dial | idle, running (ember breathes), paused; 60 ticks + ring + ember; long clock (hours) shrinks |
| Round pips | done, current, upcoming |
| Task row | default, active, done, editing |
| Estimate pips | filled = sessions done |
| Filter chips | pressed |
| Stat tile, goal ring, bar chart, calendar heat cell (5 levels) | |
| Dialog | native `<dialog>`, confirm / cancel |
| Toast | message, optional action (Undo) |
| Empty state | with ember illustration |

## Accessibility
AA contrast for all pairs in both themes (verified with `contrast.py`), visible focus rings, `role="timer"` with a spoken
label, switches and checkboxes use proper roles, one `h1` per page that receives focus on navigation, native dialog focus
trap, no zoom lock.
