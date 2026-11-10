# Test plan and results: Slowburn

Run: `npm test` (28 unit tests) and `npm run test:e2e` (33 browser tests, Chromium, controllable clock).
Last run in this build environment: **28/28 unit, 33/33 browser, 0 console errors**.

| flow | happy path | edge cases covered |
| --- | --- | --- |
| F01 quick focus | load defaults; start / pause / resume / reset; Space and R keys; mode tabs | clock stays frozen while paused; typing in the task field never triggers shortcuts; switching phase mid-run resets |
| F03 full cycle | session end logs history and auto-starts the break; 4 sessions then a long break then restart; auto-start focus loop | skip does not count; custom long-break interval (unit) |
| F02 tasks | add, estimate, edit, filter, complete, delete + undo, clear done; focused task is credited and shown in history | blank title rejected; whitespace collapsed; 400-char title capped at 120; emoji and accents; double click on Add |
| F04 settings | custom durations apply and persist; theme light / dark / system; sound, alarm, volume; notifications | 999, 0 and "abc" clamp; permission denied path; granted path sends a notification |
| F07 persistence | running timer survives reload; tasks and active task survive reload | session that ended while closed is settled silently; corrupt JSON is backed up and ignored; second tab receives data |
| F05 insights | stats, streak, bars, calendar, grouped history, goal copy | empty states; CSV formula injection neutralised; delete entry; clear all |
| F09 data | export backup, erase, import | invalid JSON and foreign files rejected and change nothing |
| responsive | 360, 390, 820, 1280, 1920 px: navigation placement, no sideways scroll on any page, Start is a full-size touch target | |
| accessibility | every control has a name, one h1 per page, dialog traps focus and Escape closes it, focus ring visible | |

Unit tests (28): timer engine (start, pause, resume, reset, tick, auto-start, long break cycle, silent completion, skip,
finish estimate), tasks, stats (today, 7 days, streak, calendar grid, levels, grouping), storage (round trip, corruption,
hostile data, blocked storage, import), CSV escaping.

## Not covered
- Real audio output (tests only confirm the code runs without errors; headless Chromium is muted).
- Real notification display and OS-level permission prompts.
- Safari and Firefox (the code uses standard APIs, but only Chromium was run).
- Real-time multi-minute runs; the clock is faked. The timestamp design is what makes that safe.
- Screen reader listening tests (roles, names and focus are checked automatically only).
