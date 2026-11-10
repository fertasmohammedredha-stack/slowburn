import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { sanitizeSettings } from '../lib/defaults.js';
import * as T from '../lib/timer.js';
import * as K from '../lib/tasks.js';
import { makeId } from '../lib/ids.js';
import { STORAGE_KEY, HISTORY_CAP, freshState, load, save, validate } from '../lib/storage.js';
import { playAlarm, unlockAudio } from '../lib/sound.js';
import { sendNotification } from '../lib/notify.js';

// ---------- reducer (pure: time and ids come in through the action) ----------

function withTimerResult(state, now, result) {
  const { timer, event } = result;
  if (!event) return state.timer === timer ? state : { ...state, timer };
  let { history, tasks } = state;
  if (event.mode === 'focus') {
    const entryId = `s_${event.endedAt}`;
    if (!history.some((h) => h.id === entryId)) {
      const task = tasks.find((t) => t.id === state.activeTaskId);
      history = [
        ...history,
        {
          id: entryId,
          startedAt: event.startedAt,
          endedAt: event.endedAt,
          durationMs: event.plannedMs,
          taskId: task ? task.id : null,
          taskTitle: task ? task.title : null,
        },
      ].slice(-HISTORY_CAP);
      if (task) tasks = K.incrementDone(tasks, task.id);
    }
  }
  return { ...state, timer, history, tasks, lastEvent: event };
}

export function reducer(state, a) {
  const s = state.settings;
  switch (a.type) {
    case 'start':
      return { ...state, timer: T.start(state.timer, a.now, s) };
    case 'pause':
      return { ...state, timer: T.pause(state.timer, a.now) };
    case 'reset':
      return { ...state, timer: T.reset(state.timer, s) };
    case 'skip':
      return { ...state, timer: T.skip(state.timer, s) };
    case 'setMode':
      return { ...state, timer: T.setMode(state.timer, a.mode, s) };
    case 'tick':
      return withTimerResult(state, a.now, T.tick(state.timer, a.now, s, { silent: a.silent }));

    case 'addTask': {
      const task = K.createTask(a, { id: a.id, now: a.now });
      return task ? { ...state, tasks: [...state.tasks, task] } : state;
    }
    case 'updateTask':
      return { ...state, tasks: K.updateTask(state.tasks, a.id, a.patch) };
    case 'toggleTask': {
      const tasks = K.toggleTask(state.tasks, a.id, a.now);
      const nowDone = tasks.find((t) => t.id === a.id)?.completed;
      return { ...state, tasks, activeTaskId: nowDone && state.activeTaskId === a.id ? null : state.activeTaskId };
    }
    case 'removeTask': {
      const index = state.tasks.findIndex((t) => t.id === a.id);
      if (index < 0) return state;
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== a.id),
        activeTaskId: state.activeTaskId === a.id ? null : state.activeTaskId,
        undo: { task: state.tasks[index], index },
      };
    }
    case 'clearUndo':
      return state.undo ? { ...state, undo: null } : state;
    case 'undoRemove': {
      if (!state.undo) return state;
      const tasks = [...state.tasks];
      tasks.splice(Math.min(state.undo.index, tasks.length), 0, state.undo.task);
      return { ...state, tasks, undo: null };
    }
    case 'setActive': {
      const ok = a.id === null || state.tasks.some((t) => t.id === a.id && !t.completed);
      return ok ? { ...state, activeTaskId: a.id } : state;
    }
    case 'clearCompleted':
      return { ...state, tasks: state.tasks.filter((t) => !t.completed) };

    case 'settings': {
      const settings = sanitizeSettings({ ...s, ...a.patch });
      let timer = state.timer;
      if (timer.status === 'idle') timer = T.reset(timer, settings);
      return { ...state, settings, timer };
    }
    case 'deleteEntry':
      return { ...state, history: state.history.filter((h) => h.id !== a.id) };
    case 'clearHistory':
      return { ...state, history: [] };
    case 'replaceAll': {
      return { ...state, ...validate(a.data), lastEvent: null, undo: null };
    }
    case 'resetAll':
      return { ...state, ...freshState(), lastEvent: null, undo: null };
    case 'toast':
      return { ...state, toast: { id: a.id, text: a.text, action: a.action ?? null } };
    case 'dismissToast':
      return state.toast && (a.id == null || state.toast.id === a.id) ? { ...state, toast: null } : state;
    default:
      return state;
  }
}

function initState() {
  let base = freshState();
  try {
    base = load(window.localStorage) ?? base;
  } catch {
    /* storage blocked: start fresh */
  }
  const state = { ...base, lastEvent: null, toast: null, undo: null };
  // A timer that finished while the page was closed is settled quietly.
  return reducer(state, { type: 'tick', now: Date.now(), silent: true });
}

// ---------- provider ----------

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const actions = useMemo(() => {
    const now = () => Date.now();
    return {
      start: () => {
        unlockAudio();
        dispatch({ type: 'start', now: now() });
      },
      pause: () => dispatch({ type: 'pause', now: now() }),
      reset: () => dispatch({ type: 'reset' }),
      skip: () => dispatch({ type: 'skip' }),
      setMode: (mode) => dispatch({ type: 'setMode', mode }),
      addTask: (title, estimate) => {
        dispatch({ type: 'addTask', title, estimate, id: makeId('t'), now: now() });
      },
      updateTask: (id, patch) => dispatch({ type: 'updateTask', id, patch }),
      toggleTask: (id) => dispatch({ type: 'toggleTask', id, now: now() }),
      removeTask: (id) => dispatch({ type: 'removeTask', id }),
      setActive: (id) => dispatch({ type: 'setActive', id }),
      clearCompleted: () => dispatch({ type: 'clearCompleted' }),
      updateSettings: (patch) => dispatch({ type: 'settings', patch }),
      deleteEntry: (id) => dispatch({ type: 'deleteEntry', id }),
      clearHistory: () => dispatch({ type: 'clearHistory' }),
      replaceAll: (data) => dispatch({ type: 'replaceAll', data }),
      resetAll: () => dispatch({ type: 'resetAll' }),
      toast: (text, action) => dispatch({ type: 'toast', id: makeId('toast'), text, action }),
      dismissToast: (id) => dispatch({ type: 'dismissToast', id }),
      undoRemove: () => dispatch({ type: 'undoRemove' }),
      clearUndo: () => dispatch({ type: 'clearUndo' }),
    };
  }, []);

  // 1. Ticker: only runs while a timer is running. Catch up instantly when the tab wakes.
  useEffect(() => {
    if (state.timer.status !== 'running') return undefined;
    const run = () => dispatch({ type: 'tick', now: Date.now() });
    const id = setInterval(run, 250);
    document.addEventListener('visibilitychange', run);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', run);
    };
  }, [state.timer.status]);

  // 2. Persistence: debounced write, flushed when the page is hidden.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    const id = setTimeout(() => save(stateRef.current, window.localStorage), 120);
    return () => clearTimeout(id);
  }, [state.settings, state.tasks, state.history, state.timer, state.activeTaskId]);

  useEffect(() => {
    const flush = () => save(stateRef.current, window.localStorage);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  // 3. Other tabs: adopt their data. History entries are de-duplicated by id.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        dispatch({ type: 'replaceAll', data: JSON.parse(e.newValue) });
      } catch {
        /* ignore unreadable data from another tab */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // 4. A finished session: sound, notification and a toast. Not for silent catch-ups.
  const handled = useRef(state.lastEvent?.id ?? null);
  useEffect(() => {
    const ev = state.lastEvent;
    if (!ev || ev.id === handled.current) return;
    handled.current = ev.id;
    if (ev.silent) return;
    const cur = stateRef.current.settings;
    const title = ev.mode === 'focus' ? 'Session complete' : 'Break is over';
    const body =
      ev.mode === 'focus'
        ? ev.next === 'long'
          ? 'Round finished. Take a proper long break.'
          : 'Nicely done. Step away for a few minutes.'
        : 'Whenever you are ready, the next session is waiting.';
    if (cur.soundOn) playAlarm(cur.alarm, cur.volume, cur.repeat);
    if (cur.notifyOn && document.visibilityState !== 'visible') sendNotification(title, body);
    actions.toast(title + '. ' + body);
  }, [state.lastEvent, actions]);

  // 5. Toasts clear themselves.
  useEffect(() => {
    if (!state.toast) return undefined;
    const id = setTimeout(() => dispatch({ type: 'dismissToast', id: state.toast.id }), state.toast.action ? 7000 : 5000);
    return () => clearTimeout(id);
  }, [state.toast]);

  // 6. The undo offer for a deleted task expires.
  useEffect(() => {
    if (!state.undo) return undefined;
    const id = setTimeout(() => dispatch({ type: 'clearUndo' }), 7000);
    return () => clearTimeout(id);
  }, [state.undo]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNow(active, every = 1000) {
  // Re-render on an interval while `active`, so clocks that are not timer-driven stay fresh.
  const [, force] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(force, every);
    return () => clearInterval(id);
  }, [active, every]);
  return Date.now();
}
