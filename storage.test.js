import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/lib/storage.js';
import { historyToCsv } from '../src/lib/csv.js';

const mem = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), m };
};

test('fresh state has sane defaults', () => {
  const s = D.freshState();
  assert.equal(s.settings.focusMin, 25);
  assert.deepEqual([s.tasks.length, s.history.length], [0, 0]);
  assert.equal(s.timer.remainingMs, 25 * 60_000);
});

test('save then load round-trips', () => {
  const store = mem();
  const s = D.freshState();
  s.tasks = [{ id: 't1', title: 'Hi', estimate: 2, done: 1, completed: false, createdAt: 1, completedAt: null }];
  s.settings.focusMin = 40;
  assert.equal(D.save(s, store), true);
  const back = D.load(store);
  assert.equal(back.settings.focusMin, 40);
  assert.equal(back.tasks[0].title, 'Hi');
});

test('corrupt JSON is backed up and ignored', () => {
  const store = mem();
  store.setItem(D.STORAGE_KEY, '{not json');
  assert.equal(D.load(store), null);
  assert.equal(store.getItem(D.BACKUP_KEY), '{not json');
});

test('validate repairs hostile or broken data', () => {
  const s = D.validate({
    settings: { focusMin: 99999, shortMin: 'abc', volume: 7, theme: 'neon', alarm: 'x' },
    tasks: [{ id: 'a', title: '   ' }, { id: 'b', title: 'ok', estimate: -4, done: -2 }, null, 5],
    history: [{ id: 'h', startedAt: 1, endedAt: 2, durationMs: 5 }, { id: 'h', startedAt: 1, endedAt: 2, durationMs: 5 }, { id: 'bad' }],
    timer: { mode: 'nope', status: 'running', endsAt: 'soon' },
    activeTaskId: 'missing',
  });
  assert.equal(s.settings.focusMin, 120);
  assert.equal(s.settings.shortMin, 5);
  assert.equal(s.settings.volume, 1);
  assert.equal(s.settings.theme, 'system');
  assert.equal(s.settings.alarm, 'chime');
  assert.equal(s.tasks.length, 1);
  assert.equal(s.tasks[0].estimate, 1);
  assert.equal(s.tasks[0].done, 0);
  assert.equal(s.history.length, 1, 'dedupes and drops invalid entries');
  assert.equal(s.timer.status, 'idle');
  assert.equal(s.activeTaskId, null);
});

test('save survives a full or blocked storage', () => {
  const blocked = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  assert.equal(D.save(D.freshState(), blocked), false);
});

test('import accepts our own export and rejects other files', () => {
  const s = D.freshState();
  s.settings.focusMin = 30;
  const ok = D.parseImport(D.exportJSON(s));
  assert.equal(ok.ok, true);
  assert.equal(ok.state.settings.focusMin, 30);
  assert.equal(D.parseImport('nope').ok, false);
  assert.equal(D.parseImport('{"hello":1}').ok, false);
});

test('csv escapes quotes, commas, newlines and formula starters', () => {
  const csv = historyToCsv([
    { id: 'a', startedAt: 0, endedAt: 25 * 60_000, durationMs: 25 * 60_000, taskTitle: '=SUM(A1)' },
    { id: 'b', startedAt: 0, endedAt: 26 * 60_000, durationMs: 25 * 60_000, taskTitle: 'say "hi", ok' },
  ]);
  const lines = csv.trim().split('\n');
  assert.equal(lines[0], 'started_at,ended_at,minutes,task');
  assert.match(lines[1], /,'=SUM\(A1\)$/);
  assert.match(lines[2], /"say ""hi"", ok"$/);
});
