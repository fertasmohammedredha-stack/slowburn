// Pure statistics over the focus history. History entry:
// { id, startedAt, endedAt, durationMs, taskId, taskTitle }
import { dayKey, addDays, noonOf } from './time.js';

export function byDay(history) {
  const map = new Map();
  for (const e of history) {
    const key = dayKey(e.endedAt);
    const cur = map.get(key) ?? { count: 0, ms: 0 };
    cur.count += 1;
    cur.ms += e.durationMs;
    map.set(key, cur);
  }
  return map;
}

export function todayStats(history, tasks, now) {
  const key = dayKey(now);
  const day = byDay(history).get(key) ?? { count: 0, ms: 0 };
  const tasksDone = tasks.filter((t) => t.completed && t.completedAt && dayKey(t.completedAt) === key).length;
  return { sessions: day.count, focusMs: day.ms, tasksDone };
}

export function lastNDays(history, n, now) {
  const map = byDay(history);
  const base = noonOf(now);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const ts = addDays(base, -i);
    const d = map.get(dayKey(ts)) ?? { count: 0, ms: 0 };
    out.push({ key: dayKey(ts), ts, count: d.count, ms: d.ms });
  }
  return out;
}

// Consecutive days with at least one session. Today may still be empty.
export function streak(history, now) {
  const map = byDay(history);
  let cursor = noonOf(now);
  if (!map.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  let n = 0;
  while (map.has(dayKey(cursor))) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

// Calendar grid, Monday-first, `weeks` rows ending with the current week.
export function heatGrid(history, weeks, now) {
  const map = byDay(history);
  const today = noonOf(now);
  const dow = (new Date(today).getDay() + 6) % 7; // Mon=0
  const start = addDays(today, -dow - (weeks - 1) * 7);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const ts = addDays(start, i);
    const d = map.get(dayKey(ts)) ?? { count: 0, ms: 0 };
    cells.push({ key: dayKey(ts), ts, count: d.count, ms: d.ms, future: ts > today });
  }
  return cells;
}

export function heatLevel(count, goal) {
  if (count <= 0) return 0;
  const r = count / Math.max(1, goal);
  if (r < 0.34) return 1;
  if (r < 0.67) return 2;
  if (r < 1) return 3;
  return 4;
}

export function groupHistory(history) {
  const sorted = [...history].sort((a, b) => b.endedAt - a.endedAt);
  const groups = [];
  for (const e of sorted) {
    const key = dayKey(e.endedAt);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, ts: e.endedAt, sessions: [], ms: 0 };
      groups.push(g);
    }
    g.sessions.push(e);
    g.ms += e.durationMs;
  }
  return groups;
}

export function weekSummary(days) {
  const total = days.reduce((s, d) => s + d.count, 0);
  const ms = days.reduce((s, d) => s + d.ms, 0);
  const best = days.reduce((b, d) => (d.count > (b?.count ?? 0) ? d : b), null);
  return { total, ms, best };
}
