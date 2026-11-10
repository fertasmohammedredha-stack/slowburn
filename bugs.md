# Bugs found and fixed during the build

| # | found by | severity | issue | fix |
| --- | --- | --- | --- | --- |
| 1 | visual check, 390px | high | Segmented control and Skip button were clipped off the right edge on phones: grid tracks sized to content | `minmax(0, 1fr)` tracks on page grids, smaller main button on narrow phones |
| 2 | visual check, 390px | medium | Button icons (Reset, Skip, Add) shrank to nothing in tight flex rows | `flex: none` on icons inside buttons |
| 3 | overflow sweep, 320 and 360px | high | Focus and Settings pages scrolled sideways (task form, setting rows, control row) | same grid fix, rows wrap, Reset / Skip become icon-only (still named) under 380px |
| 4 | code review | medium | "Task deleted. Undo" toast never expired, so it would reappear forever | undo offer expires after 7 seconds (`clearUndo`) |
| 5 | e2e run 1 | test bug | 25-minute simulations ran the 250ms tick 6000 times and crashed the browser | tests use a single clock fast-forward, like a tab waking up |
| 6 | e2e run 2 | test bugs (5) | read storage before the 120ms debounced save; asserted the wrong round label after changing phase; wrong seconds bound; theme change event race; toast race | tests wait for the save, poll for the media-query change and filter the toast by text |

Open issues are listed in the README under Known limitations.
