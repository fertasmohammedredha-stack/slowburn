# Brand: Slowburn

## Idea
Focus is not a sprint. It is a steady burn you keep at a sustainable heat, then bank. The product is a quiet
instrument, not a game: warm paper by day, ink by night, one ember that marks where you are in the session.

## Name
Chosen: **Slowburn**. Candidates considered: Slowburn, Emberwork, Tallow, Quillfire, Cadence Hour.
Checks still to run by the owner before any public launch (this environment has no network): trademark search in the
target classes, domain and handle availability, App Store / Play name search. "Slowburn" is a common English word, so
expect crowded namespaces; a distinguishing suffix (for example "Slowburn Focus") may be needed for stores.

## Voice
Calm, direct, a little wry. Short sentences, no exclamation marks, no gamified guilt.
Examples: "Nothing queued yet." "Round complete. Rest properly." "A clean slate. One session is enough to get moving."
Avoid: "Crush your goals", streak-shaming, emoji in UI copy.

## Mark
An open ring (a session in progress) with a small filled dot at the gap (the ember). Drawn from scratch in `Icons.jsx`
and `public/favicon.svg`. The ember takes the colour of the current phase.

## Palette (full roles in `design/tokens.json`)
| role | light | dark |
| --- | --- | --- |
| paper / ink background | #F5EFE3 | #151210 |
| surface | #FFFBF2 | #1F1B17 |
| text | #241E16 | #F3ECDD |
| focus accent (amber) | #A34E00 | #F0A24B |
| short break accent (moss) | #2F6A4A | #8CCBA3 |
| long break accent (dusk) | #5A4A96 | #BDB0F0 |

Contrast: all 22 text and UI pairs pass WCAG AA in both themes (`contrast.py`; many are AAA). The colours were chosen
away from the researched app's red / teal / blue scheme; `replica/brand.json` lists those values and the sweep finds none.

## Type
- Display and clock: Fraunces (serif with optical sizing), tabular lining numerals for the clock
- UI: Instrument Sans
- Labels and numbers in small caps contexts: IBM Plex Mono
All three are open-licence Google Fonts, loaded from the Google Fonts CDN with system fallbacks (Georgia, system-ui, ui-monospace).

## Sound
Three alarms synthesised at runtime: a two-note glass chime, three wooden knocks, a soft triple pulse. No samples.

## Leftover sweep
`python3 sweep.py . --config replica/brand.json` reports clean: no original name, domain or colours in the codebase.
