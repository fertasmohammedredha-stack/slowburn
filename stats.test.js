import test from 'node:test';
import assert from 'node:assert/strict';
import * as St from '../src/lib/stats.js';
import { addDays, noonOf, dayKey } from '../src/lib/time.js';

const MIN = 60_000;
const now = new Date(2026, 10, 9, 15, 0).getTime(); // 9 Nov 2026, local
const at = (daysAgo, hour = 10) => {
  const d = new Date(addDays(noonOf(now), -daysAgo));
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
};
const entry = (id, daysAgo, hour = 10) => ({
  id, startedAt: at(daysAgo, hour) - 25 * MIN, endedAt: at(daysAgo, hour), durationMs: 25 * MIN, taskId: null, taskTitle: null,
});

test('todayStats counts today only', () => {
  const h = [entry('a', 0), entry('b', 0, 11), entry('c', 1)];
  const tasks = [{ completed: true, completedAt: at(0) }, { completed: true, completedAt: at(2) }];
  const s = St.todayStats(h, tasks, now);
  assert.deepEqual([s.sessions, s.focusMs, s.tasksDone], [2, 50 * MIN, 1]);
});

test('lastNDays always returns n ordered days, filling gaps with zero', () => {
  const d = St.lastNDays([entry('a', 2)], 7, now);
  assert.equal(d.length, 7);
  assert.equal(d[6].key, dayKey(now));
  assert.equal(d[4].count, 1);
  assert.equal(d[5].count, 0);
});

test('streak continues through yesterday and breaks on a gap', () => {
  assert.equal(St.streak([], now), 0);
  assert.equal(St.streak([entry('a', 0), entry('b', 1), entry('c', 2)], now), 3);
  assert.equal(St.streak([entry('b', 1), entry('c', 2)], now), 2, 'today empty keeps the streak alive');
  assert.equal(St.streak([entry('a', 0), entry('c', 2)], now), 1);
  assert.equal(St.streak([entry('x', 3)], now), 0);
});

test('heatGrid is Monday-first, full weeks, and flags future days', () => {
  const g = St.heatGrid([entry('a', 0)], 5, now);
  assert.equal(g.length, 35);
  assert.equal(new Date(g[0].ts).getDay(), 1, 'starts on a Monday');
  const today = g.find((c) => c.key === dayKey(now));
  assert.equal(today.count, 1);
  assert.equal(g.filter((c) => c.future).length, 6 - ((new Date(now).getDay() + 6) % 7));
});

test('heatLevel scales against the goal', () => {
  assert.deepEqual([0, 1, 3, 6, 8, 12].map((n) => St.heatLevel(n, 8)), [0, 1, 2, 3, 4, 4]);
});

test('groupHistory sorts newest first and totals each day', () => {
  const g = St.groupHistory([entry('a', 1), entry('b', 0, 9), entry('c', 0, 12)]);
  assert.equal(g.length, 2);
  assert.equal(g[0].sessions[0].id, 'c');
  assert.equal(g[0].ms, 50 * MIN);
});
