// Pure timer engine. Time is always passed in, never read, so it is trivial to test.
// The timer stores an absolute `endsAt` while running, so background-tab throttling
// and page reloads cannot make it drift.
import { MODES } from './defaults.js';

export function modeMs(mode, s) {
  const min = mode === 'focus' ? s.focusMin : mode === 'short' ? s.shortMin : s.longMin;
  return min * 60_000;
}

export function createTimer(s) {
  return {
    mode: 'focus',
    status: 'idle', // idle | running | paused
    remainingMs: modeMs('focus', s),
    endsAt: null,
    startedAt: null,
    plannedMs: null,
    cycle: 0, // focus sessions completed since the last long break
  };
}

export function remainingOf(t, now) {
  return t.status === 'running' ? Math.max(0, t.endsAt - now) : t.remainingMs;
}

export function start(t, now, s) {
  if (t.status === 'running') return t;
  const fresh = t.status === 'idle';
  const rem = t.remainingMs > 0 ? t.remainingMs : modeMs(t.mode, s);
  return {
    ...t,
    status: 'running',
    remainingMs: rem,
    endsAt: now + rem,
    startedAt: fresh ? now : (t.startedAt ?? now),
    plannedMs: fresh ? rem : (t.plannedMs ?? modeMs(t.mode, s)),
  };
}

export function pause(t, now) {
  if (t.status !== 'running') return t;
  return { ...t, status: 'paused', remainingMs: Math.max(0, t.endsAt - now), endsAt: null };
}

export function reset(t, s) {
  return {
    ...t,
    status: 'idle',
    remainingMs: modeMs(t.mode, s),
    endsAt: null,
    startedAt: null,
    plannedMs: null,
  };
}

export function setMode(t, mode, s) {
  if (!MODES.includes(mode)) return t;
  return reset({ ...t, mode }, s);
}

export function nextModeAfter(t, s) {
  if (t.mode === 'focus') return t.cycle + 1 >= s.longEvery ? 'long' : 'short';
  return 'focus';
}

// Skip moves to the next phase without counting the session.
export function skip(t, s) {
  const next = nextModeAfter(t, s);
  const cycle = t.mode === 'long' ? 0 : t.cycle;
  return reset({ ...t, mode: next, cycle }, s);
}

export function complete(t, now, s, { silent = false } = {}) {
  const endedAt = t.endsAt;
  const planned = t.plannedMs ?? modeMs(t.mode, s);
  const next = nextModeAfter(t, s);
  const event = {
    id: `${endedAt}-${t.mode}`,
    mode: t.mode,
    next,
    startedAt: t.startedAt ?? endedAt - planned,
    endedAt,
    plannedMs: planned,
    silent,
  };
  const cycle = t.mode === 'focus' ? t.cycle + 1 : t.mode === 'long' ? 0 : t.cycle;
  const base = {
    ...t,
    mode: next,
    cycle,
    status: 'idle',
    remainingMs: modeMs(next, s),
    endsAt: null,
    startedAt: null,
    plannedMs: null,
  };
  const auto = !silent && (next === 'focus' ? s.autoStartFocus : s.autoStartBreaks);
  return { timer: auto ? start(base, now, s) : base, event };
}

export function tick(t, now, s, opts) {
  if (t.status !== 'running' || now < t.endsAt) return { timer: t, event: null };
  return complete(t, now, s, opts);
}

// When would the open tasks be finished if the user kept going? (null if nothing left.)
export function estimateFinish(now, t, s, pomodorosLeft) {
  if (!pomodorosLeft || pomodorosLeft < 1) return null;
  let time = now;
  let cycle = t.cycle;
  let left = pomodorosLeft;
  let segment = remainingOf(t, now);
  if (t.mode !== 'focus') {
    time += segment;
    if (t.mode === 'long') cycle = 0;
    segment = modeMs('focus', s);
  }
  while (left > 0) {
    time += segment;
    left -= 1;
    cycle += 1;
    if (left === 0) break;
    if (cycle >= s.longEvery) {
      time += modeMs('long', s);
      cycle = 0;
    } else {
      time += modeMs('short', s);
    }
    segment = modeMs('focus', s);
  }
  return time;
}
