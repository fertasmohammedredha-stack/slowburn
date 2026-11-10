import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS as S } from '../src/lib/defaults.js';
import * as T from '../src/lib/timer.js';

const MIN = 60_000;
const none = { ...S, autoStartBreaks: false, autoStartFocus: false };

test('new timer is a 25 minute idle focus session', () => {
  const t = T.createTimer(S);
  assert.equal(t.mode, 'focus');
  assert.equal(t.status, 'idle');
  assert.equal(t.remainingMs, 25 * MIN);
});

test('start, pause and resume keep the right remaining time', () => {
  let t = T.start(T.createTimer(S), 1000, S);
  assert.equal(t.status, 'running');
  assert.equal(T.remainingOf(t, 1000 + 5 * MIN), 20 * MIN);
  t = T.pause(t, 1000 + 5 * MIN);
  assert.equal(t.status, 'paused');
  assert.equal(t.remainingMs, 20 * MIN);
  assert.equal(T.remainingOf(t, 1000 + 99 * MIN), 20 * MIN, 'paused time does not move');
  t = T.start(t, 50_000_000, S);
  assert.equal(t.endsAt, 50_000_000 + 20 * MIN);
  assert.equal(t.plannedMs, 25 * MIN, 'planned length survives a pause');
});

test('reset returns to a full idle timer', () => {
  let t = T.start(T.createTimer(S), 0, S);
  t = T.reset(T.pause(t, 10 * MIN), S);
  assert.equal(t.status, 'idle');
  assert.equal(t.remainingMs, 25 * MIN);
});

test('tick does nothing before the end and completes at the end', () => {
  const t = T.start(T.createTimer(none), 0, none);
  assert.equal(T.tick(t, 25 * MIN - 1, none).event, null);
  const { timer, event } = T.tick(t, 25 * MIN, none);
  assert.equal(event.mode, 'focus');
  assert.equal(event.next, 'short');
  assert.equal(event.plannedMs, 25 * MIN);
  assert.equal(timer.mode, 'short');
  assert.equal(timer.status, 'idle');
  assert.equal(timer.cycle, 1);
});

test('auto start flags decide whether the next phase runs', () => {
  const t = T.start(T.createTimer(S), 0, S);
  const { timer } = T.tick(t, 25 * MIN, S);
  assert.equal(timer.mode, 'short');
  assert.equal(timer.status, 'running', 'breaks auto-start by default');
  assert.equal(timer.endsAt, 25 * MIN + 5 * MIN);
  const b = T.tick(timer, 30 * MIN, S).timer;
  assert.equal(b.mode, 'focus');
  assert.equal(b.status, 'idle', 'focus does not auto-start by default');
});

test('a long break comes after every fourth focus session, then the cycle restarts', () => {
  let t = T.createTimer(none);
  let now = 0;
  const modes = [];
  for (let i = 0; i < 9; i++) {
    t = T.start(t, now, none);
    now = t.endsAt;
    const r = T.tick(t, now, none);
    t = r.timer;
    modes.push(r.event.mode + '>' + r.event.next);
  }
  assert.deepEqual(modes, [
    'focus>short', 'short>focus', 'focus>short', 'short>focus',
    'focus>short', 'short>focus', 'focus>long', 'long>focus', 'focus>short',
  ]);
  assert.equal(t.cycle, 1);
});

test('custom long-break interval is respected', () => {
  const s = { ...none, longEvery: 2 };
  let t = T.start(T.createTimer(s), 0, s);
  t = T.tick(t, t.endsAt, s).timer; // focus 1 -> short
  t = T.start(t, 0, s);
  t = T.tick(t, t.endsAt, s).timer; // short -> focus
  t = T.start(t, 0, s);
  const r = T.tick(t, t.endsAt, s);
  assert.equal(r.event.next, 'long');
});

test('silent completion (after a reload) never auto-starts', () => {
  const t = T.start(T.createTimer(S), 0, S);
  const { timer, event } = T.tick(t, 999 * MIN, S, { silent: true });
  assert.equal(event.silent, true);
  assert.equal(timer.status, 'idle');
});

test('manual mode change resets the clock; skip does not count the session', () => {
  let t = T.start(T.createTimer(S), 0, S);
  t = T.setMode(t, 'long', S);
  assert.equal(t.status, 'idle');
  assert.equal(t.remainingMs, 15 * MIN);
  let u = T.skip(T.createTimer(S), S);
  assert.equal(u.mode, 'short');
  assert.equal(u.cycle, 0);
  u = T.skip(u, S);
  assert.equal(u.mode, 'focus');
});

test('changing durations: a zero-length timer restarts at the full length', () => {
  const paused = { ...T.createTimer(S), status: 'paused', remainingMs: 0 };
  const t = T.start(paused, 0, S);
  assert.equal(t.endsAt, 25 * MIN);
});

test('estimateFinish counts breaks between pomodoros but not after the last one', () => {
  const t = T.createTimer(S);
  assert.equal(T.estimateFinish(0, t, S, 0), null);
  assert.equal(T.estimateFinish(0, t, S, 1), 25 * MIN);
  assert.equal(T.estimateFinish(0, t, S, 2), 55 * MIN);
  // 5 pomodoros: 5*25 focus + 3 short + 1 long
  assert.equal(T.estimateFinish(0, t, S, 5), (125 + 15 + 15) * MIN);
});
