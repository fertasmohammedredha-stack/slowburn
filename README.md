# Slowburn

A calm Pomodoro focus timer with a task queue, daily stats and history. Original design and brand.
Local-first: everything is stored in your browser's `localStorage`. No account, no backend, no tracking.

## Run it

Requires Node 20 or newer.

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build:

```bash
npm run build        # outputs dist/
npm run preview      # http://localhost:4173
```

Deploy `dist/` to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages). The app uses hash
routes (`#/insights`), so no server rewrite rules are needed.

No install at all: open `slowburn-standalone.html` in a browser. It is a single file with everything inlined.
(Regenerate it with `npm run build && node scripts/build-standalone.mjs`.)

## Test it

```bash
npm test                         # 28 unit tests (timer engine, tasks, stats, storage, CSV), no dependencies
npm run build && npm run preview # in one terminal
npx playwright install chromium  # once
npm run test:e2e                 # 33 browser tests against http://localhost:4173
```

Set `BASE_URL=http://localhost:5173` to run the browser tests against the dev server instead.

## Features

- Timer: 25 / 5 / 15 minute defaults, long break every 4 sessions, start, pause, resume, reset, skip,
  automatic transitions (auto-start for breaks and focus is configurable)
- Timestamp-based clock: does not drift in background tabs, survives reloads, settles sessions that ended while closed
- Tasks: add, edit, delete (with undo), complete, 1 to 20 session estimates, focus a task, filters,
  progress and an estimated finish time that accounts for breaks
- Insights: daily goal ring, sessions and focus time today, day streak, 7-day chart, 5-week calendar,
  history grouped by day, per-entry delete, CSV export
- Settings: durations, long-break interval, auto-start, alarm sound (3 synthesised sounds), volume, repeat,
  desktop notifications, light / dark / system theme, daily goal
- Data: JSON backup export and import, erase everything
- Keyboard: `Space` start or pause, `R` reset
- Accessible: semantic controls with names, visible focus, reduced-motion support, AA contrast in both themes

## Project layout

```
src/lib/        pure logic: timer.js, tasks.js, stats.js, storage.js, csv.js, defaults.js, sound.js, notify.js
src/state/      store.jsx (reducer, persistence, tick loop, side effects)
src/components/ Dial, TimerPanel, TaskPanel, ui.jsx (primitives), Icons.jsx
src/pages/      FocusPage, InsightsPage, SettingsPage
src/styles/     tokens.css (generated), base.css, components.css, pages.css
tests/          node:test unit tests
e2e/run.mjs     Playwright browser tests
replica/        research and planning: recon, architecture, brand, design tokens, test plan, parity
scripts/        gen-tokens.mjs, build-standalone.mjs, build-esbuild.mjs (fallback build)
```

Design tokens live in `replica/design/tokens.json` (light) and `tokens.dark.json`; run `npm run tokens` after
editing them to regenerate `src/styles/tokens.css`.

## Known limitations

See `replica/parity.md` and the end of `replica/build-log.md`. Short version: no task notes, templates,
ticking sound or month view; no accounts or cross-device sync (use the JSON backup); fonts load from Google Fonts
and fall back to system fonts offline; alarm sounds need one click or key press on the page first (browser rule).
