# Recon map: Pomofocus (web)

Scope: the core loop (Pomodoro timer + task list with estimates), settings, reports, accounts, templates. Premium integrations are mapped but marked "could".
For: assumed to be your own product / portfolio project (confirm in the next step).
Date: 2026-11-09

**Evidence tags used below**
- `[V]` verified on a public pomofocus.io page (fetched today)
- `[S]` from a secondary public source (review site, university tutorial, pricing blog)
- `[R]` recalled from general knowledge of the live app, NOT verified today. Confirm in your own browser session before replica-design / replica-architect rely on it.

Important limit of this recon: pomofocus.io is a client-rendered single-page app. The fetched HTML only returns a "Loading..." splash plus the SEO text, so the live UI could not be seen. I did not read its JavaScript bundles or network calls (against the skill rules and the site's terms). Anything about the interactive UI therefore comes from `[S]` and `[R]` sources.

## Terms check (read before building)

The site's Terms say you may use it for personal, non-commercial purposes and may not reverse-engineer, decompile or disassemble any part of the website `[V]` (terms page, last updated Sept 8, 2023). This recon stayed on public pages and secondary sources, which is consistent with that. If you plan to ship this commercially, rebuild clean-room: new name, new logo, new copy, new sounds, new colour palette, no copied assets.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | home page (app + SEO text) | https://pomofocus.io/ | feature list, how-to steps, free vs premium, download links `[V]` |
| 2 | simple page | https://pomofocus.io/app | app only, no marketing text; HTML is just "Loading" `[V]` |
| 3 | privacy | https://pomofocus.io/privacy | cookies, ads partner (Freestar), data transfer to Japan `[V]` |
| 4 | terms | https://pomofocus.io/terms | non-commercial, no reverse engineering `[V]` |
| 5 | legal notice | https://pomofocus.io/commerce | operator FocusLab LLC (Tokyo), credit card only, 7-day refund, subscription monthly or annual `[V]` |
| 6 | contact | https://pomofocus.io/contact | email, Twitter, Facebook `[V]` |
| 7 | llms.txt | https://pomofocus.io/llms.txt | summary of features `[V]` (seen in search) |
| 8 | Jagiellonian Univ. tutorial | https://cd.uj.edu.pl/en_GB/oprogramowanie/pomodoro | the best UI walkthrough found: task form, active-task view, settings panel `[S]` |
| 9 | Lifestack review | https://lifestack.ai/blog/pomofocus | pricing claims, "no account needed", sign-in keeps history `[S]` |
| 10 | Toolradar | https://toolradar.com/tools/pomofocus/pricing | says premium price is "contact us" (conflicts with #9) `[S]` |
| 11 | TrustRadius | https://www.trustradius.com/products/pomofocus/reviews | premium features restated `[S]` |

Not found: a help center, a changelog, or a public API doc. There is no `/pricing` page that I could confirm.

## Core loop

Pick or add a task with a pomodoro estimate, press Start for a 25-minute focus session, get an alarm, take a 5-minute break (15 after every 4th), and see progress and estimated finish time update.

## 1. Pages and routes

| route | what it is | evidence |
| --- | --- | --- |
| `/` | the app plus long SEO/marketing text below it (what is Pomofocus, technique, how to use, basic vs premium features, desktop download) | `[V]` |
| `/app` | "Simple page": the same app without the marketing text. Linked from the footer as SIMPLE PAGE | `[V]` |
| `/privacy` | privacy policy (effective July 14, 2019) | `[V]` |
| `/terms` | terms and conditions (page title says "Privacy Page", a small bug) | `[V]` |
| `/commerce` | Japanese specified-commercial-transactions notice | `[V]` |
| `/contact` | contact methods | `[V]` |
| `/llms.txt` | plain-text site summary for AI crawlers | `[V]` |
| `/images/ogimage.png`, `/icons/*` | static assets | `[V]` |
| `/cdn-cgi/l/email-protection` | Cloudflare email obfuscation (not a product route) | `[V]` |
| desktop installers | `.dmg` (1.2.3), win-x64 `.zip` (1.2.0), linux amd64 `.zip` (1.2.0), hosted on a DigitalOcean Spaces CDN | `[V]` |

Everything else (settings, reports, login, tasks, templates, upgrade) appears to be a modal or an in-page panel on `/`, not a separate route `[S][R]`. Unverified: whether any deep link like `/login` or `/report` exists. Check the address bar in your own session.

Footer on every static page: HOME, PRIVACY, TERMS, COMMERCE, CONTACT, SIMPLE PAGE, Facebook, Twitter, Stripe Climate badge, "Made with love by Yuya Uzu", copyright 2019-2026 `[V]`.

## 2. Screen inventory

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Main timer + tasks | `/` | the whole core loop | mode tabs, timer, Start, progress bar, task list, Add Task, header buttons | idle, running, paused, break, finished, no tasks, tasks, ad slot `[S][R]` |
| S02 | Simple page | `/app` | same as S01 without SEO text | same | same `[V]` (route) |
| S03 | Settings | header "Setting" (cog, top right) | change timer lengths, auto-start, long-break interval, alarm, ticking sound | number inputs, toggles, selects, sliders, OK button | default, edited `[S]` |
| S04 | Task add/edit form | "Add Task" button, or click a task | create or edit a task | title input "What are you working on?", "Est Pomodoros" number with up/down, "Add Note", Save, Cancel, Delete | empty, filled, editing `[S]` |
| S05 | Task menu | button next to the task list header | bulk task actions: clear finished, clear all, templates, Todoist import | dropdown menu | closed, open `[S][R]` |
| S06 | Active task view | S01 while running | shows current task name, note, `done/est` count | highlighted task, header text, note text | `[S]` |
| S07 | Totals row | below the task list | total estimate, completed, estimated finish time ("Pomos 0/3, Finish at 18:40") | summary bar | `[S][R]` |
| S08 | Report | header "Report" | focus time summary per day, week, month; year and CSV are premium | tabs, bar chart, totals, tables, rankings | empty, filled, locked (premium) `[S]` |
| S09 | Login / sign up | header "Login" | account for syncing history | modal with email and social login | `[S][R]` (exact methods unverified) |
| S10 | Templates | via task menu | save a task list as a template, add from a template, free limit of 3 | list, save, delete | below limit, at limit (upsell) `[V]` (limit) |
| S11 | Premium upsell / checkout | locked-feature clicks | explain Premium and take a card | plan chooser, Stripe checkout | `[V]` (card only) `[S]` (prices) |
| S12 | Projects (premium) | task form or settings | tag tasks to projects, time per project | project select | locked for free users `[V]` |
| S13 | Integrations (premium) | Settings or task menu | Todoist import, webhook URL | text fields, connect button | locked `[V]` |
| S14 | Static pages | privacy, terms, commerce, contact | legal and contact | header with logo, text, footer | `[V]` |
| S15 | Desktop download block | bottom of `/` | links to Mac, Windows, Linux builds | table of links, note about unsigned Windows app | `[V]` |
| S16 | Mobile layout | `/` on a phone | same flow, stacked | `[S]` "works on desktop and mobile browser"; viewport locks zoom `[V]` | |

Not seen anywhere: a 404 page, a cookie consent banner screen, an onboarding tour, an email-verification screen. Check these yourself.

## 3. Flows

```
F01 Quick focus (no task, no account)
    S01 -> Start -> (25:00 counts down) -> alarm -> S01 in short-break mode
    happy path clicks: 1
    edge: tab in background (timer drift), sound blocked by browser autoplay rules,
          page refresh mid-session (state kept or lost? unverified)

F02 Plan the day with tasks
    S01 -> Add Task -> S04 (title, estimate, optional note) -> Save -> repeat -> select a task -> Start
    happy path clicks: 3 to add one task (Add Task, type, Save) + 1 to select + 1 to Start = 5
    edge: empty title, estimate 0 or very large, duplicate titles, 20+ tasks

F03 Full cycle
    Start -> alarm -> short break -> alarm -> Start ... (4th pomodoro) -> long break
    happy path clicks: 1 per phase, 0 if auto-start is on
    edge: switching mode manually mid-run, skipping a break, changing durations while running

F04 Change settings
    S01 -> Setting -> S03 -> edit values -> OK -> S01
    happy path clicks: 3
    edge: invalid numbers, values saved per browser vs per account

F05 Review progress
    S01 -> Report -> S08 -> switch week/month (year is premium)
    happy path clicks: 2
    edge: no data yet, guest user (history kept?), timezone boundaries

F06 Sign in and keep history
    S01 -> Login -> S09 -> authenticated -> reports now persist
    edge: guest data merging into the account (unverified)

F07 Reuse a task list
    S04/S01 -> task menu -> Save as template / Add from template -> S10
    edge: more than 3 templates -> upsell to S11

F08 Upgrade to Premium
    locked feature or upsell -> S11 -> card -> account flagged premium -> ads off
    edge: refund within 7 days `[V]`, monthly vs annual `[V]`

F09 Install the desktop app
    S01 -> scroll -> S15 -> download for OS
    edge: Windows "unsafe app" warning `[V]` (app is unsigned)
```

## 4. UI components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Mode tabs (Pomodoro / Short Break / Long Break) | 3 | active, inactive, hover | S01 |
| Timer display | large mm:ss | idle, running, paused, finished | S01 |
| Start / Pause button | big, white with coloured text `[R]`; a skip-next icon appears while running `[R]` | start, pause, pressed | S01 |
| Progress bar | thin bar across the top of the page `[S]` | 0-100% | S01 |
| Header bar | logo, Report, Setting, Login | default, logged-in avatar `[R]` | S01 |
| Task card | normal, active (highlighted), done (struck through) `[S][R]` | hover, selected, done, editing | S01 |
| Task form card | inline, replaces the "Add Task" button | empty, filled, error | S04 |
| Add Task button | dashed outline `[R]` | default, hover | S01 |
| Number input with arrows | minutes, estimate, interval | focus, invalid | S03, S04 |
| Toggle switch | on/off | on, off | S03 |
| Select dropdown | alarm sound, ticking sound `[S]` | closed, open | S03 |
| Volume slider / select | alarm, ticking `[S]` | dragging | S03 |
| Modal | settings, report, login | open, closing | S03, S08, S09 |
| Tabs / segmented control | report period | active | S08 |
| Bar chart | daily focus hours | empty, filled | S08 |
| Text status line ("Time to focus!" / "Time for a break!") with round counter (#1) `[R]` | | | S01 |
| Totals bar | pomos done/est, finish at | updates live | S07 |
| Ad slot | banner area (Freestar) `[V]` | shown, hidden for Premium | S01 |
| Footer | links + social + Stripe Climate badge | | all |
| Lock / "Premium" badge | | | S08, S10, S12, S13 |

## 5. Colours, typography and spacing

None of these values could be measured (no browser access). Treat all of them as `[R]` approximations and sample them from a screenshot in your own session before replica-design.

- Colour is the status indicator: the whole page background changes by mode. Recalled values: focus about `#ba4949` (muted red), short break about `#38858a` (teal), long break about `#397097` (blue). A review also says the page shifts between red and teal by mode `[S]`; the creator told a commenter the red is intentional and carries meaning `[S]`.
- Buttons and cards: translucent white panels over the coloured background (about 10-15% white), white text; the Start button is solid white with text in the mode colour.
- Settings/report modals: white card, dark text, gray dividers.
- Typography `[R]`: one sans-serif stack (Arial/Helvetica-like), very large bold timer (about 120px on desktop), uppercase small caps-style labels for tabs and section titles, regular weight body.
- Spacing and layout `[R]`: a single centred column about 480-620px wide; generous vertical gaps (16-24px) between blocks; rounded corners of about 6-8px on cards and buttons; subtle shadow under the Start button.
- Icons: simple monochrome line icons for Report, Setting, Login (small PNGs under `/icons/`) `[V]` (path).
- Tomato/clock logo: `icon-white2.png` on the loading splash and `icon-small.png` in the static page header `[V]`. Do not reuse.

To measure: for each of the 3 modes sample background, panel, text, button colours; font-size and weight of the timer, tabs, task title; container width at 1440, 768 and 390 px.

## 6. Interactive elements and behaviour

Verified or from good secondary sources:
- Three modes: Pomodoro, Short Break, Long Break; tabs switch the mode and the timer value `[S]`.
- Defaults 25 / 5 / 15 minutes; all three editable `[V][S]`. Long break after 4 pomodoros by default, interval editable `[S]`.
- Start begins a countdown; a bar shows elapsed vs remaining time `[S]`.
- Auto-start toggles for breaks and for the next pomodoro; with them off, you press Start every phase `[S]`.
- Alarm: choose sound, volume, and number of repeats `[S]`.
- Ticking (background) sound: on/off, choose type or speed, volume `[S]`.
- Task form: title "What are you working on?", "Est Pomodoros" with up/down arrows, optional note, Save `[S]`.
- Active task is highlighted in black in the list; shows `done/estimated` pomodoros; note displays under it `[S]`.
- A totals line shows estimated pomodoros for all tasks, completed count, and estimated finish time `[S]` (the home page also lists "Estimate Finish Time" as a basic feature `[V]`).
- Templates: save repeated tasks and re-add in one click, limited to 3 free `[V]`.
- Reports: daily/weekly/monthly focus time for free; yearly and CSV download for Premium `[V]`.
- Premium: projects, yearly reports, CSV, unlimited templates, Todoist import, webhooks (Zapier, IFTTT), no ads `[V]`.

Recalled, unverified `[R]`:
- Browser tab title shows the remaining time.
- Browser notification permission request when the timer ends.
- Clicking a task selects it; checkmark icon marks it done; "..." per task opens edit.
- Task menu items: clear finished tasks, clear act pomodoros, clear all, save/add template, hide completed, import from Todoist.
- "Dark mode when running" setting and a 12h/24h time format setting.
- A "reminder" or auto-pause behaviour. Unknown.
- Whether the timer survives a page refresh, and whether guest data lives in `localStorage` (a clone-style site claims this; not confirmed for the original).

## 7. Responsive design

- Viewport meta: `width=device-width, height=device-height, initial-scale=1.0, user-scalable=no` on every page `[V]`. Pinch-zoom is disabled, which is an accessibility issue you should not copy.
- Declared support: desktop and mobile browser; operating environment is the latest Chrome, Safari, Firefox, Edge, iOS Safari and Android Chrome `[V]` (legal notice).
- Layout `[R]`: one centred column on desktop that simply narrows on phones; header buttons collapse to icons on small screens; modals become near-full-width.
- No native mobile app was found; desktop apps exist for Mac, Windows, Linux `[V]`.
- Breakpoints are unknown. Capture at 390, 768, 1440 px.

## 8. Technologies you can reasonably identify

| item | finding | confidence |
| --- | --- | --- |
| rendering | client-side SPA; the server HTML is a "Loading..." splash and the app mounts after JS runs | verified |
| framework | unknown. A React-style SPA is a reasonable guess but not confirmable without reading bundles | guess |
| edge / CDN | Cloudflare in front (email obfuscation path `/cdn-cgi/l/email-protection`) | high |
| asset hosting | desktop installers on DigitalOcean Spaces (`focuslab.lon1.cdn.digitaloceanspaces.com`) | verified |
| ads | Freestar (named in privacy policy) | verified |
| payments | credit card only; the footer shows a Stripe Climate badge, so Stripe is the likely processor | medium |
| analytics / cookies | session, preference and security cookies; usage data incl. IP, browser, pages, time | verified |
| desktop app | unsigned installers; probably an Electron or similar wrapper | guess |
| SEO | OG/Twitter meta, `llms.txt`, saashub verification meta | verified |
| integrations | Todoist, webhooks (Zapier/IFTTT) | verified (claimed) |
| data location | processed in Japan; operator FocusLab LLC, Tokyo | verified |

## 9. Inferred data model

```
User         id, email, auth_provider, created_at, plan (free | premium), plan_interval (month | year | lifetime?)
             evidence: login button, "premium version", legal notice (monthly or annual)
             confidence: medium (lifetime plan only in one secondary source)

Settings     user_id (or local), pomodoro_min, short_break_min, long_break_min, long_break_interval,
             auto_start_breaks, auto_start_pomodoros, alarm_sound, alarm_volume, alarm_repeat,
             ticking_sound, ticking_volume, (dark_when_running, time_format)
             evidence: settings panel walkthrough [S]
             confidence: high for the first nine fields, guess for the last two

Task         id, user_id, title, est_pomodoros, done_pomodoros, note, is_done, project_id (premium), position
             evidence: task form and active-task view [S]
             confidence: high

Template     id, user_id, name, tasks (list of title + estimate + note)
             evidence: "save repetitive tasks as templates", limit 3 [V]
             confidence: medium (exact shape unknown)

FocusLog     id, user_id, task_id?, project_id?, mode, started_at, ended_at, duration_sec
             evidence: reports by day/week/month, CSV export of "focus history" [V]
             confidence: medium (log vs daily aggregates unknown)

Project      id, user_id, name, color?
             evidence: "Add Projects" premium [V]
             confidence: medium

Integration  user_id, kind (todoist | webhook), token_or_url, enabled
             evidence: premium features [V]
             confidence: guess on fields

Subscription user_id, provider (stripe), status, interval, current_period_end
             evidence: legal notice [V]
             confidence: guess on fields
```

Relationships: User 1-n Task, User 1-1 Settings, User 1-n Template, User 1-n Project, Project 1-n Task, Task 1-n FocusLog, User 1-n Integration, User 1-1 Subscription.

Guest mode: the app starts without an account `[S]`, so Task, Settings and FocusLog must also live in the browser. Whether guest data is merged on login is unknown.

## 10. Feature matrix

See `features.csv` (47 rows). Must: 13, should: 17, could: 17 (5 of the could rows are marked `skip` because they cannot or should not be cloned).

## 11. Out of scope (cannot or should not be cloned)

- The Pomofocus name, logo, tomato icon, copy, SEO text, and any images or sounds. Make your own.
- The ad revenue arrangement with Freestar and the Cloudflare/Stripe accounts.
- Their existing users, accounts and focus history.
- Todoist API access and Zapier/IFTTT partner listings (usable via public APIs, but you must register your own).
- Signed desktop installers for Mac/Windows (needs paid developer certificates).
- Japanese commercial-transaction legal notice. Your own business needs its own.

## 12. Size

Screens 16 (core 7: S01, S03, S04, S06, S07, S08, S14), flows 9, entities 8.

Hard parts:
1. Accurate timing when the tab is in the background (use end timestamps, not interval counting; browsers throttle timers).
2. Sound and notifications under browser autoplay and permission rules.
3. Reports and sync (log storage, timezone-aware aggregation, guest to account merge), plus billing if you add Premium.

Size: **S** (a weekend) for the core loop with local storage only (S01, S03, S04, S06, S07, static pages). **M** (a few weeks) once you add accounts, reports and templates. **L** if you add Premium billing and integrations.
