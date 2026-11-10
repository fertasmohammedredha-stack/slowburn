// End-to-end tests. Run the app first (`npm run build && npm run preview`), then `npm run test:e2e`.
// BASE_URL defaults to http://localhost:4173. Every test gets a fresh browser context (empty localStorage).
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const KEY = 'slowburn:v1';
const MIN = 60_000;
const T0 = new Date(2026, 10, 9, 9, 0, 0); // fixed "now" for clock-controlled tests

const browser = await chromium.launch();
const results = [];

async function open(t, { viewport = { width: 1280, height: 900 }, clock = false, seed = null, scheme = 'light', acceptDownloads = true } = {}) {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme, acceptDownloads });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_(NAME|INTERNET|CONNECTION|FAILED)|Failed to load resource/.test(m.text())) problems.push('console: ' + m.text());
  });
  page.on('response', (r) => { if (r.status() >= 500) problems.push(`5xx: ${r.url()}`); });
  if (seed) {
    await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [KEY, JSON.stringify(seed)]);
  }
  if (clock) await page.clock.install({ time: T0 });
  await page.goto(BASE + '/');
  await page.waitForSelector('.dial');
  if (clock) await page.clock.pauseAt(new Date(T0.getTime() + 1000));
  t.after(async () => { await ctx.close(); assert.deepEqual(problems, [], 'console/page errors'); });
  return { ctx, page };
}

const clockText = (page) => page.getByRole('timer').innerText();
// Small steps run every timer; big jumps use fastForward (fires due timers once), like a tab waking up.
const advance = async (page, ms) => {
  if (ms > 20_000) await page.clock.fastForward(ms);
  else await page.clock.runFor(ms);
  await page.clock.runFor(400);
};
const stored = async (page) => { await page.waitForTimeout(300); return readStore(page); }; // saves are debounced ~120ms
const readStore = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const addTask = async (page, title, extra = 0) => {
  await page.getByLabel('Task name').first().fill(title);
  for (let i = 0; i < extra; i++) await page.getByRole('button', { name: 'Increase Estimated sessions' }).click();
  await page.getByRole('button', { name: 'Add task' }).click();
};
const goto = async (page, name) => { await page.getByRole('link', { name }).click(); await page.getByRole('heading', { level: 1, name }).waitFor(); };

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const hooks = () => { const a = []; return { after: (f) => a.push(f), run: async () => { for (const f of a.reverse()) await f(); } }; };

// ---------------- F01 quick focus ----------------
test('F01-H1 loads a 25:00 focus timer with sane defaults', async (t) => {
  const { page } = await open(t);
  assert.equal(await clockText(page), '25:00');
  assert.equal(await page.getByTestId('round-label').innerText(), 'Session 1 of 4');
  assert.equal(await page.title(), 'Focus · Slowburn');
  assert.equal(await page.locator('html').getAttribute('data-mode'), 'focus');
});

test('F01-H2 start, pause, resume, reset', async (t) => {
  const { page } = await open(t, { clock: true });
  await page.getByRole('button', { name: 'Start' }).click();
  await advance(page, 5000);
  assert.equal(await clockText(page), '24:55');
  assert.match(await page.title(), /^24:5\d · Focus/);
  await page.getByRole('button', { name: 'Pause' }).click();
  await advance(page, 60_000);
  assert.equal(await clockText(page), '24:55', 'paused time does not move');
  await page.getByRole('button', { name: 'Resume' }).click();
  await advance(page, 5000);
  assert.equal(await clockText(page), '24:50');
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  assert.equal(await clockText(page), '25:00');
  await page.getByRole('button', { name: 'Start' }).waitFor();
});

test('F01-H3 keyboard: Space toggles, R resets, typing in a field does not', async (t) => {
  const { page } = await open(t, { clock: true });
  await page.locator('body').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Pause' }).waitFor();
  await advance(page, 3000);
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Resume' }).waitFor();
  await page.keyboard.press('r');
  assert.equal(await clockText(page), '25:00');
  await page.getByLabel('Task name').click();
  await page.keyboard.type('read the paper');
  await page.getByRole('button', { name: 'Start' }).waitFor();
  assert.equal(await page.getByLabel('Task name').inputValue(), 'read the paper');
});

test('F01-E1 mode tabs switch phase and reset the clock', async (t) => {
  const { page } = await open(t, { clock: true });
  await page.getByRole('button', { name: 'Start' }).click();
  await advance(page, 10_000);
  await page.getByRole('button', { name: /^Long/ }).click();
  assert.equal(await clockText(page), '15:00');
  await page.getByRole('button', { name: 'Start' }).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-mode'), 'long');
  await page.getByRole('button', { name: /^Short/ }).click();
  assert.equal(await clockText(page), '05:00');
});

// ---------------- F03 full cycle ----------------
test('F03-H1 a focus session ends: logs history, rolls into an auto-started short break', async (t) => {
  const { page } = await open(t, { clock: true });
  await page.getByRole('button', { name: 'Start' }).click();
  await advance(page, 25 * MIN);
  assert.equal(await page.locator('html').getAttribute('data-mode'), 'short');
  assert.match(await clockText(page), /^0[45]:\d\d$/);
  await page.getByRole('button', { name: 'Pause' }).waitFor(); // break auto-started
  assert.match(await page.getByTestId('toast').innerText(), /Session complete/);
  assert.equal(await page.getByTestId('today-sessions').innerText(), '1');
  assert.equal(await page.getByTestId('round-label').innerText(), '1 of 4 done. Breathe.');
  const s = await stored(page);
  assert.equal(s.history.length, 1);
  assert.equal(s.history[0].durationMs, 25 * MIN);
});

test('F03-H2 four sessions earn a long break, then the cycle restarts', async (t) => {
  const { page } = await open(t, { clock: true });
  for (let i = 1; i <= 4; i++) {
    await page.getByRole('button', { name: 'Start' }).click();
    await advance(page, 25 * MIN);
    if (i < 4) {
      assert.equal(await page.locator('html').getAttribute('data-mode'), 'short', `after session ${i}`);
      await advance(page, 5 * MIN); // short break runs by itself and ends
      assert.equal(await page.locator('html').getAttribute('data-mode'), 'focus');
      await page.getByRole('button', { name: 'Start' }).waitFor(); // focus does not auto-start
    }
  }
  assert.equal(await page.locator('html').getAttribute('data-mode'), 'long');
  assert.match(await clockText(page), /^1[45]:\d\d$/);
  assert.equal(await page.getByTestId('round-label').innerText(), 'Round complete. Rest properly.');
  await advance(page, 15 * MIN);
  assert.equal(await page.locator('html').getAttribute('data-mode'), 'focus');
  assert.equal(await page.getByTestId('round-label').innerText(), 'Session 1 of 4');
  assert.equal((await stored(page)).history.length, 4);
});

test('F03-H3 auto-start focus setting makes the loop hands-free', async (t) => {
  const { page } = await open(t, { clock: true });
  await goto(page, 'Settings');
  await page.getByRole('switch', { name: 'Start focus automatically' }).click();
  await goto(page, 'Focus');
  await page.getByRole('button', { name: 'Start' }).click();
  await advance(page, 25 * MIN);
  await advance(page, 5 * MIN);
  assert.equal(await page.locator('html').getAttribute('data-mode'), 'focus');
  await page.getByRole('button', { name: 'Pause' }).waitFor();
});

test('F03-E1 skip moves on without counting a session', async (t) => {
  const { page } = await open(t, { clock: true });
  await page.getByRole('button', { name: 'Skip' }).click();
  assert.equal(await page.locator('html').getAttribute('data-mode'), 'short');
  await advance(page, 100);
  assert.equal((await stored(page)).history.length, 0);
});

// ---------------- F02 tasks ----------------
test('F02-H1 add, estimate, edit, complete, delete with undo', async (t) => {
  const { page } = await open(t);
  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(), /name/i, 'blank title is rejected');

  await addTask(page, '  Write   the report  ', 2);
  await addTask(page, 'Email Sam');
  const rows = page.getByTestId('task');
  assert.equal(await rows.count(), 2);
  assert.match(await rows.nth(0).innerText(), /Write the report/);
  assert.match(await rows.nth(0).innerText(), /0\/3/);
  assert.match(await page.getByTestId('task-summary').innerText(), /0 of 4 sessions/);

  await page.getByRole('button', { name: 'Edit Email Sam' }).click();
  await page.getByLabel('Task name').nth(1).fill('Email Sam and Priya');
  await page.getByRole('button', { name: 'Increase Estimated sessions' }).nth(1).click();
  await page.getByRole('button', { name: 'Save' }).click();
  assert.match(await rows.nth(1).innerText(), /Email Sam and Priya/);
  assert.match(await rows.nth(1).innerText(), /0\/2/);

  await page.getByRole('checkbox', { name: 'Complete Write the report' }).click();
  assert.equal(await page.getByRole('checkbox', { name: 'Reopen Write the report' }).getAttribute('aria-checked'), 'true');
  await page.getByRole('button', { name: 'Open 1' }).click();
  assert.equal(await rows.count(), 1);
  await page.getByRole('button', { name: /^All/ }).click();

  await page.getByRole('button', { name: 'Delete Email Sam and Priya' }).click();
  assert.equal(await rows.count(), 1);
  await page.getByRole('button', { name: 'Undo' }).click();
  assert.equal(await rows.count(), 2);
  assert.match(await rows.nth(1).innerText(), /Email Sam and Priya/, 'restored in its old position');

  await page.getByRole('button', { name: 'Clear done' }).click();
  assert.equal(await rows.count(), 1);
});

test('F02-H2 focusing a task credits its sessions and the finish estimate', async (t) => {
  const { page } = await open(t, { clock: true });
  await addTask(page, 'Outline chapter', 1);
  await page.getByRole('button', { name: 'Focus on Outline chapter' }).click();
  assert.equal(await page.locator('.dial-caption').innerText(), 'Outline chapter');
  assert.match(await page.getByTestId('task-summary').innerText(), /Done around/);
  await page.getByRole('button', { name: 'Start' }).click();
  await advance(page, 25 * MIN);
  assert.match(await page.getByTestId('task').innerText(), /1\/2/);
  const s = await stored(page);
  assert.equal(s.history[0].taskTitle, 'Outline chapter');
  assert.equal(s.tasks[0].done, 1);
});

test('F02-E1 emoji, accents and very long titles are safe', async (t) => {
  const { page } = await open(t);
  await addTask(page, 'Réviser le plan ✨ — café');
  await addTask(page, 'x'.repeat(400));
  const rows = page.getByTestId('task');
  assert.match(await rows.nth(0).innerText(), /Réviser le plan ✨ — café/);
  const s = await stored(page);
  assert.equal(s.tasks[1].title.length, 120);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(overflow, false);
});

test('F02-E2 double-clicking Add does not create duplicates from an empty field', async (t) => {
  const { page } = await open(t);
  await page.getByLabel('Task name').fill('One thing');
  await page.getByRole('button', { name: 'Add task' }).dblclick();
  assert.equal(await page.getByTestId('task').count(), 1);
});

// ---------------- F04 settings ----------------
test('F04-H1 custom durations apply to the idle timer and persist across reloads', async (t) => {
  const { page } = await open(t);
  await goto(page, 'Settings');
  const focus = page.locator('#set-focus');
  await focus.fill('30');
  await focus.press('Enter');
  const short = page.locator('#set-short');
  await short.fill('3');
  await short.press('Enter');
  await page.locator('#set-every').fill('3');
  await page.locator('#set-every').press('Enter');
  await goto(page, 'Focus');
  assert.equal(await clockText(page), '30:00');
  assert.equal(await page.getByTestId('round-label').innerText(), 'Session 1 of 3');
  await page.getByRole('button', { name: /^Short/ }).click();
  assert.equal(await clockText(page), '03:00');
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForSelector('.dial');
  assert.equal(await page.getByTestId('round-label').innerText(), '0 of 3 done. Breathe.', 'short break mode and the 3-session cycle survive a reload');
  const s = await stored(page);
  assert.equal(s.settings.focusMin, 30);
  assert.equal(s.settings.shortMin, 3);
});

test('F04-E1 out of range and non-numeric input is clamped', async (t) => {
  const { page } = await open(t);
  await goto(page, 'Settings');
  const focus = page.locator('#set-focus');
  await focus.fill('999');
  await focus.blur();
  assert.equal(await focus.inputValue(), '120');
  await focus.fill('0');
  await focus.blur();
  assert.equal(await focus.inputValue(), '1');
  await focus.fill('abc');
  await focus.blur();
  assert.equal(await focus.inputValue(), '1', 'garbage falls back to the previous value');
  await page.getByRole('button', { name: 'Increase Focus session' }).click();
  assert.equal(await focus.inputValue(), '2');
});

test('F04-H2 theme: dark, light and system, saved across reloads', async (t) => {
  const { page } = await open(t, { scheme: 'light' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await goto(page, 'Settings');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.waitForTimeout(300);
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.getByRole('button', { name: 'System' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
});

test('F04-H3 sound and notification controls work without errors', async (t) => {
  const { page } = await open(t);
  await goto(page, 'Settings');
  await page.getByRole('switch', { name: 'Play a sound when a session ends' }).click();
  assert.equal(await page.getByRole('switch', { name: 'Play a sound when a session ends' }).getAttribute('aria-checked'), 'false');
  await page.getByLabel('Alarm').selectOption('wood');
  await page.getByLabel('Volume').fill('0.3');
  assert.equal(await page.locator('.slider-out').innerText(), '30%');
  await page.getByRole('button', { name: 'Test sound' }).click();
  await page.getByRole('switch', { name: 'Desktop notifications' }).click(); // headless: permission is denied or unsupported
  await page.getByTestId('toast').waitFor();
  assert.equal(await page.getByRole('switch', { name: 'Desktop notifications' }).getAttribute('aria-checked'), 'false');
  const s = await stored(page);
  assert.equal(s.settings.soundOn, false);
  assert.equal(s.settings.alarm, 'wood');
  assert.equal(s.settings.volume, 0.3);
  assert.equal(s.settings.notifyOn, false);
});

test('F04-H4 notifications fire when granted and the tab is hidden', async (t) => {
  const { ctx, page } = await open(t, { clock: true });
  await ctx.grantPermissions(['notifications'], { origin: BASE });
  await page.addInitScript(() => {});
  await page.evaluate(() => { window.__notes = []; const N = window.Notification; window.Notification = function (title, o) { window.__notes.push([title, o && o.body]); }; window.Notification.permission = 'granted'; window.Notification.requestPermission = async () => 'granted'; });
  await goto(page, 'Settings');
  await page.getByRole('switch', { name: 'Desktop notifications' }).click();
  assert.equal(await page.getByRole('switch', { name: 'Desktop notifications' }).getAttribute('aria-checked'), 'true');
  await page.getByRole('button', { name: 'Test notification' }).click();
  assert.equal(await page.evaluate(() => window.__notes.length), 1);
});

// ---------------- persistence ----------------
test('F07-H1 a running timer survives a reload', async (t) => {
  const { page } = await open(t);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(1500);
  await page.reload();
  await page.waitForSelector('.dial');
  await page.getByRole('button', { name: 'Pause' }).waitFor();
  const [m, s] = (await clockText(page)).split(':').map(Number);
  assert.equal(m, 24);
  assert.ok(s <= 59 && s > 40, `remaining ${m}:${s}`);
});

test('F07-H2 tasks, active task and history survive a reload', async (t) => {
  const { page } = await open(t);
  await addTask(page, 'Persist me', 1);
  await page.getByRole('button', { name: 'Focus on Persist me' }).click();
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForSelector('.dial');
  assert.match(await page.getByTestId('task').innerText(), /Persist me/);
  assert.equal(await page.locator('.dial-caption').innerText(), 'Persist me');
});

test('F07-E1 a session that ended while the page was closed is settled quietly', async (t) => {
  const past = Date.now() - 3 * MIN;
  const seed = {
    version: 1,
    settings: {},
    tasks: [],
    history: [],
    timer: { mode: 'focus', status: 'running', remainingMs: 25 * MIN, endsAt: past, startedAt: past - 25 * MIN, plannedMs: 25 * MIN, cycle: 0 },
  };
  const { page } = await open(t, { seed });
  assert.equal(await page.getByTestId('today-sessions').innerText(), '1');
  assert.equal(await page.getByTestId('toast').count(), 0, 'no toast or sound for a catch-up');
  await page.getByRole('button', { name: 'Start' }).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-mode'), 'short');
});

test('F07-E2 corrupt storage does not break the app', async (t) => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(([k]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, '{"tasks": [ nope'); }, [KEY]);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/');
  await page.waitForSelector('.dial');
  assert.equal(await clockText(page), '25:00');
  assert.deepEqual(errs, []);
  assert.ok(await page.evaluate(() => localStorage.getItem('slowburn:corrupt-backup')), 'broken data was backed up');
  await ctx.close();
});

test('F07-E3 two tabs share data and never double-count a session', async (t) => {
  const { ctx, page } = await open(t);
  const other = await ctx.newPage();
  await other.goto(BASE + '/');
  await other.waitForSelector('.dial');
  await addTask(page, 'Shared task');
  await page.waitForTimeout(400);
  await other.waitForFunction(() => document.querySelectorAll('[data-testid="task"]').length === 1);
  assert.match(await other.getByTestId('task').innerText(), /Shared task/);
});

// ---------------- F05 insights ----------------
function seedHistory() {
  const now = Date.now();
  const at = (daysAgo, hour) => { const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(hour, 0, 0, 0); return d.getTime(); };
  const mk = (id, daysAgo, hour, title) => ({ id, startedAt: at(daysAgo, hour) - 25 * MIN, endedAt: at(daysAgo, hour), durationMs: 25 * MIN, taskId: null, taskTitle: title });
  const tasks = [{ id: 't1', title: 'Done today', estimate: 1, done: 1, completed: true, createdAt: now, completedAt: now }];
  return { version: 1, settings: { dailyGoal: 4 }, tasks, history: [mk('a', 0, 8, 'Plan'), mk('b', 0, 8.0, '=HYPERLINK("x")'), mk('c', 1, 10, 'Yesterday work'), mk('d', 2, 10, null)] };
}

test('F05-H1 insights shows today, streak, chart, heatmap and grouped history', async (t) => {
  const { page } = await open(t, { seed: seedHistory() });
  await goto(page, 'Insights');
  assert.equal(await page.getByTestId('stat-sessions').innerText(), '2');
  assert.equal(await page.getByTestId('stat-focus').innerText(), '50m');
  assert.equal(await page.getByTestId('stat-streak').innerText(), '3');
  assert.match(await page.getByTestId('goal-copy').innerText(), /2 more sessions/);
  assert.equal(await page.locator('.bar').count(), 7);
  assert.equal(await page.locator('.heat-cell:not(.is-future)').count() > 20, true);
  assert.equal(await page.getByTestId('history-row').count(), 4);
  assert.match(await page.getByTestId('history').innerText(), /Today/);
  assert.match(await page.getByTestId('history').innerText(), /Yesterday/);
  assert.match(await page.getByTestId('history').innerText(), /Open session/);
});

test('F05-H2 delete an entry, export CSV safely, clear all history', async (t) => {
  const { page } = await open(t, { seed: seedHistory() });
  await goto(page, 'Insights');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
  assert.equal(dl.suggestedFilename(), 'slowburn-history.csv');
  const csv = readFileSync(await dl.path(), 'utf8');
  assert.match(csv, /^started_at,ended_at,minutes,task\n/);
  assert.match(csv, /'=HYPERLINK/, 'formula starters are neutralised');
  assert.equal(csv.trim().split('\n').length, 5);

  await page.getByRole('button', { name: /^Delete session at/ }).first().click();
  assert.equal(await page.getByTestId('history-row').count(), 3);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.getByRole('button', { name: 'Clear history' }).click();
  await page.getByText('No sessions logged').waitFor();
  assert.equal(await page.getByTestId('stat-streak').innerText(), '0');
});

test('F05-E1 insights with no data shows friendly empty states', async (t) => {
  const { page } = await open(t);
  await goto(page, 'Insights');
  assert.equal(await page.getByTestId('stat-sessions').innerText(), '0');
  await page.getByText('No sessions logged').waitFor();
  assert.match(await page.getByTestId('goal-copy').innerText(), /clean slate/i);
});

// ---------------- data portability ----------------
test('F09-H1 export a backup, wipe, import it back; bad files are rejected', async (t) => {
  const { page } = await open(t, { seed: seedHistory() });
  await goto(page, 'Settings');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup' }).click()]);
  const backup = await dl.path();
  assert.equal(JSON.parse(readFileSync(backup, 'utf8')).app, 'slowburn');

  await page.getByRole('button', { name: 'Erase everything' }).click();
  await page.getByRole('button', { name: 'Erase', exact: true }).click();
  await page.waitForTimeout(250);
  assert.equal((await stored(page)).history.length, 0);

  await page.getByLabel('Import backup file').setInputFiles(backup);
  await page.getByRole('button', { name: 'Replace' }).click();
  await page.waitForTimeout(250);
  assert.equal((await stored(page)).history.length, 4);

  await page.getByLabel('Import backup file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await page.getByTestId('toast').filter({ hasText: 'does not look like a Slowburn export' }).waitFor();
  assert.equal((await stored(page)).history.length, 4, 'rejected import changes nothing');
});

// ---------------- responsive + a11y ----------------
for (const [name, width, height, mobile] of [['phone 360', 360, 740, true], ['phone 390', 390, 844, true], ['tablet 820', 820, 1100, false], ['laptop 1280', 1280, 800, false], ['wide 1920', 1920, 1080, false]]) {
  test(`RESP ${name}: correct navigation, no sideways scroll, controls reachable`, async (t) => {
    const { page } = await open(t, { viewport: { width, height } });
    for (const route of ['Focus', 'Insights', 'Settings']) {
      await goto(page, route);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 0, `${route} overflows by ${over}px`);
    }
    await goto(page, 'Focus');
    const bottom = await page.locator('.nav-bottom').isVisible();
    const top = await page.locator('.nav-top').isVisible();
    assert.equal(bottom, mobile || width < 760);
    assert.equal(top, !(mobile || width < 760));
    const box = await page.getByRole('button', { name: 'Start' }).boundingBox();
    assert.ok(box.height >= 44 && box.x >= 0 && box.x + box.width <= width, 'Start is a full-size touch target inside the viewport');
  });
}

test('A11Y every control has a name, one h1 per page, dialogs trap focus', async (t) => {
  const { page } = await open(t, { seed: seedHistory() });
  await addTask(page, 'A11y task');
  for (const route of ['Focus', 'Insights', 'Settings']) {
    await goto(page, route);
    const report = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('button, a[href], input, select').forEach((el) => {
        if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return;
        const name = el.getAttribute('aria-label') || el.innerText?.trim() || (el.labels && el.labels[0]?.innerText) || el.getAttribute('title');
        if (!name) bad.push(el.outerHTML.slice(0, 80));
      });
      return { bad, h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang };
    });
    assert.deepEqual(report.bad, [], `${route}: unnamed controls`);
    assert.equal(report.h1, 1, `${route}: h1 count`);
    assert.equal(report.lang, 'en');
  }
  await goto(page, 'Insights');
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => !!document.activeElement.closest('dialog')), 'focus stays inside the dialog');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
});

test('A11Y reduced motion is respected and focus is visible', async (t) => {
  const { page } = await open(t);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  assert.notEqual(outline, 'none', 'keyboard focus ring is drawn');
});

// ---------------- run ----------------
let failed = 0;
for (const { name, fn } of tests) {
  const h = hooks();
  const started = Date.now();
  try {
    await fn(h);
    await h.run();
    results.push(['PASS', name, Date.now() - started]);
  } catch (e) {
    try { await h.run(); } catch { /* the original failure is the interesting one */ }
    failed += 1;
    results.push(['FAIL', name, Date.now() - started, e.message.split('\n').slice(0, 6).join(' | ')]);
  }
}
for (const [status, name, ms, msg] of results) console.log(`${status}  ${name}  (${ms}ms)${msg ? '\n      ' + msg : ''}`);
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed ? 1 : 0);
