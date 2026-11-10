# Architecture: Slowburn

Inputs: `recon.md` and `features.csv` (functional research on a public Pomodoro timer). Nothing of the original's
code, assets, copy or visual design is used.

## Decisions

| area | choice | why |
| --- | --- | --- |
| UI | React 19 | the brief preferred it; the UI is state-heavy and component based |
| build | Vite 7 | fast dev server, zero-config static output |
| language | plain JavaScript (JSX) | keeps the project dependency-light; pure logic is covered by tests instead of types |
| styling | hand-written modern CSS: custom properties, `@layer`, `color-mix()`, `@property` | no CSS framework needed; tokens are generated from JSON |
| state | one `useReducer` store in a context | a single small domain; no state library |
| routing | hash routes (`#/`, `#/insights`, `#/settings`) | works on any static host and from `file://`, no router dependency |
| storage | `localStorage`, one versioned JSON blob (`slowburn:v1`) | brief: no unnecessary backend |
| sound | Web Audio synthesis | no audio files, so no licensing question |
| backend | none | see `backend.md` |
| test | `node:test` for logic, Playwright for the browser | no test framework dependency; the browser suite drives the app with a controllable clock |

## Shape

```
              user input
                  |
   components (React) --dispatch--> reducer (pure) <-- lib/timer, lib/tasks (pure)
        ^                               |
        |                               v
   read-only state  <----------- store.jsx effects:
                                   1 ticker (250ms, only while running)
                                   2 debounced localStorage save (+ on pagehide)
                                   3 `storage` event: adopt data from other tabs
                                   4 session end: sound, notification, toast
                                   5 toast / undo expiry
```

Rule: time and ids are inputs to the reducer (`action.now`, `action.id`), never read inside it. That is what makes the
timer logic unit-testable and the browser tests deterministic.

## The timer

State: `{ mode, status: idle|running|paused, remainingMs, endsAt, startedAt, plannedMs, cycle }`.

- While running, only the absolute `endsAt` matters. Remaining time is `endsAt - now`, so throttled background tabs and
  reloads cannot drift.
- `cycle` counts focus sessions since the last long break. When a focus session completes and `cycle + 1 >= longEvery`,
  the next phase is a long break; completing a long break resets `cycle`.
- A completed focus session appends a history entry with id `s_<endedAt>`. The id makes logging idempotent, so two
  tabs finishing the same session cannot double count.
- On load, a timer whose `endsAt` already passed is settled "silently": the session is logged, no sound, and it never
  auto-starts the next phase.
- Skip moves to the next phase without logging a session.

## Data model (localStorage `slowburn:v1`)

```
{ version: 1,
  settings: { focusMin, shortMin, longMin, longEvery, autoStartBreaks, autoStartFocus,
              soundOn, alarm, volume, repeat, notifyOn, theme, dailyGoal },
  tasks:    [{ id, title, estimate, done, completed, createdAt, completedAt }],
  history:  [{ id, startedAt, endedAt, durationMs, taskId, taskTitle }],   // capped at 5000
  timer:    { ... as above ... },
  activeTaskId }
```

Every read goes through `validate()`: values are clamped, unknown fields dropped, duplicates removed. Corrupt JSON is
copied to `slowburn:corrupt-backup` and the app starts fresh. Quota or blocked-storage errors are swallowed and the app
keeps working in memory.

## Routes and screens

| route | screen | notes |
| --- | --- | --- |
| `#/` | Focus: timer dial, mode switch, controls, today strip, task queue | two columns from 960px, stacked below |
| `#/insights` | goal ring, stats, 7-day bars, 5-week calendar, history | |
| `#/settings` | timer, alerts, appearance, data | native `<dialog>` for confirmations |

Navigation is a top bar from 760px and a bottom tab bar below it.

## Build order used

1. pure logic + unit tests; 2. tokens + contrast check; 3. store; 4. components; 5. pages; 6. CSS; 7. e2e suite;
8. fix, re-test, responsive sweep.
