# Build log

Stages executed in one pass with the Replica skills:

1. recon (done earlier): `recon.md`, `features.csv`
2. architect: `architecture.md`, `backend.md` (decision: no backend)
3. brand: `brand.md`, `brand.json`; name, palette, type, voice, mark
4. design: `design/tokens.json`, `tokens.dark.json`, generated `src/styles/tokens.css`, `design/design-system.md`; contrast checked with `contrast.py`: 22 pairs per theme, 0 failing AA
5. build: logic first (pure, tested), store, components, pages, styles
6. backend: nothing to build; storage layer hardened instead (validation, corruption backup, quota safety, import limits)
7. test: 28 unit + 33 browser tests, bugs in `bugs.md`
8. diff: `parity.md` from `features.csv` (parity 78.6 of the researched feature set, 12 of 13 must-haves fully done; the 13th is partial by design, see below). Visual layout diff was not run: the brief forbids copying the original's design and no reference screenshots exist.
9. sweep: `sweep.py` with `brand.json` reports clean

## Environment notes
- No network in the build sandbox, so Vite could not be installed. The app was bundled and tested with esbuild (same JSX and CSS, `scripts/build-esbuild.mjs`) and a static file server. `npm install && npm run dev|build` is the intended path and uses only standard Vite and the React plugin; it could not be run here.
- Google Fonts could not load in the sandbox, so screenshots used the fallback fonts (Georgia, system sans). With network access the intended Fraunces, Instrument Sans and IBM Plex Mono load.
- `npm test` for the browser suite needs `npx playwright install chromium` on your machine.

## Parity gaps, honestly
- Must (partial): "background colour changes by mode". Slowburn changes the accent colour and the page glow per phase but keeps a paper / ink background. This is deliberate: it is the researched app's most distinctive visual trait.
- Not built (should): task notes, task templates, ticking background sound, month view in reports, static legal pages.
- Not built (could): projects, yearly reports, 12/24h setting, dark-when-running.
- Out of scope by the brief: accounts, billing, ads, Todoist and webhooks, desktop installers.
