// Pure task helpers.
export const MAX_TITLE = 120;
export const MIN_EST = 1;
export const MAX_EST = 20;

export function normalizeTitle(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE);
}

export function clampEstimate(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return MIN_EST;
  return Math.min(MAX_EST, Math.max(MIN_EST, n));
}

export function createTask({ title, estimate }, { id, now }) {
  const clean = normalizeTitle(title);
  if (!clean) return null;
  return {
    id,
    title: clean,
    estimate: clampEstimate(estimate),
    done: 0,
    completed: false,
    createdAt: now,
    completedAt: null,
  };
}

export function updateTask(tasks, id, patch) {
  return tasks.map((t) => {
    if (t.id !== id) return t;
    const next = { ...t };
    if ('title' in patch) {
      const clean = normalizeTitle(patch.title);
      if (clean) next.title = clean;
    }
    if ('estimate' in patch) next.estimate = clampEstimate(patch.estimate);
    return next;
  });
}

export function toggleTask(tasks, id, now) {
  return tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed, completedAt: t.completed ? null : now } : t,
  );
}

export function incrementDone(tasks, id) {
  return tasks.map((t) => (t.id === id ? { ...t, done: t.done + 1 } : t));
}

export function pomodorosLeft(tasks) {
  return tasks.reduce((sum, t) => (t.completed ? sum : sum + Math.max(0, t.estimate - t.done)), 0);
}

export function totals(tasks) {
  const open = tasks.filter((t) => !t.completed);
  return {
    open: open.length,
    done: tasks.length - open.length,
    estimate: tasks.reduce((s, t) => s + t.estimate, 0),
    finished: tasks.reduce((s, t) => s + t.done, 0),
    left: pomodorosLeft(tasks),
  };
}
