// localStorage persistence: one versioned JSON blob, validated on every read.
import { SCHEMA_VERSION, DEFAULT_SETTINGS, MODES, sanitizeSettings } from './defaults.js';
import { createTimer } from './timer.js';
import { normalizeTitle, clampEstimate } from './tasks.js';

export const STORAGE_KEY = 'slowburn:v1';
export const BACKUP_KEY = 'slowburn:corrupt-backup';
export const HISTORY_CAP = 5000;

const num = (v) => typeof v === 'number' && Number.isFinite(v);

function cleanTask(t) {
  if (!t || typeof t !== 'object' || typeof t.id !== 'string') return null;
  const title = normalizeTitle(t.title);
  if (!title) return null;
  return {
    id: t.id,
    title,
    estimate: clampEstimate(t.estimate),
    done: num(t.done) ? Math.max(0, Math.round(t.done)) : 0,
    completed: t.completed === true,
    createdAt: num(t.createdAt) ? t.createdAt : Date.now(),
    completedAt: t.completed === true && num(t.completedAt) ? t.completedAt : null,
  };
}

function cleanEntry(e) {
  if (!e || typeof e !== 'object' || typeof e.id !== 'string') return null;
  if (!num(e.endedAt) || !num(e.startedAt) || !num(e.durationMs) || e.durationMs <= 0) return null;
  return {
    id: e.id,
    startedAt: e.startedAt,
    endedAt: e.endedAt,
    durationMs: e.durationMs,
    taskId: typeof e.taskId === 'string' ? e.taskId : null,
    taskTitle: typeof e.taskTitle === 'string' ? e.taskTitle.slice(0, 120) : null,
  };
}

function cleanTimer(raw, settings) {
  const base = createTimer(settings);
  if (!raw || typeof raw !== 'object') return base;
  const mode = MODES.includes(raw.mode) ? raw.mode : base.mode;
  const status = ['idle', 'running', 'paused'].includes(raw.status) ? raw.status : 'idle';
  const cycle = num(raw.cycle) ? Math.min(Math.max(0, Math.round(raw.cycle)), settings.longEvery) : 0;
  const t = { ...base, mode, cycle };
  t.remainingMs = num(raw.remainingMs) && raw.remainingMs >= 0 ? raw.remainingMs : base.remainingMs;
  if (status === 'running' && num(raw.endsAt)) {
    return {
      ...t,
      status,
      endsAt: raw.endsAt,
      startedAt: num(raw.startedAt) ? raw.startedAt : null,
      plannedMs: num(raw.plannedMs) ? raw.plannedMs : null,
    };
  }
  if (status === 'paused') {
    return {
      ...t,
      status,
      startedAt: num(raw.startedAt) ? raw.startedAt : null,
      plannedMs: num(raw.plannedMs) ? raw.plannedMs : null,
    };
  }
  return { ...createTimer(settings), mode, cycle };
}

// Turn anything (parsed JSON of any shape) into a safe persisted state.
export function validate(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const settings = sanitizeSettings(r.settings ?? DEFAULT_SETTINGS);
  const tasks = Array.isArray(r.tasks) ? r.tasks.map(cleanTask).filter(Boolean) : [];
  const seen = new Set();
  const history = (Array.isArray(r.history) ? r.history : [])
    .map(cleanEntry)
    .filter((e) => e && !seen.has(e.id) && seen.add(e.id))
    .slice(-HISTORY_CAP);
  const activeTaskId =
    typeof r.activeTaskId === 'string' && tasks.some((t) => t.id === r.activeTaskId && !t.completed)
      ? r.activeTaskId
      : null;
  return { settings, tasks, history, timer: cleanTimer(r.timer, settings), activeTaskId };
}

export function freshState() {
  return validate({});
}

export function persistable(state) {
  const { settings, tasks, history, timer, activeTaskId } = state;
  return { version: SCHEMA_VERSION, settings, tasks, history, timer, activeTaskId };
}

export function load(storage) {
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (!text) return null;
    try {
      return validate(JSON.parse(text));
    } catch {
      storage.setItem(BACKUP_KEY, text); // keep what we could not read
      return null;
    }
  } catch {
    return null;
  }
}

export function save(state, storage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(persistable(state)));
    return true;
  } catch {
    return false; // quota or private mode: the app keeps working in memory
  }
}

export function exportJSON(state) {
  return JSON.stringify({ app: 'slowburn', exportedAt: new Date().toISOString(), ...persistable(state) }, null, 2);
}

export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!data || typeof data !== 'object' || data.app !== 'slowburn') {
    return { ok: false, error: 'That does not look like a Slowburn export.' };
  }
  return { ok: true, state: validate(data) };
}
