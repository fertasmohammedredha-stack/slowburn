// Single source of truth for settings shape, limits and sanitising.
export const SCHEMA_VERSION = 1;

export const MODES = ['focus', 'short', 'long'];
export const MODE_LABEL = { focus: 'Focus', short: 'Short break', long: 'Long break' };

export const ALARMS = [
  { id: 'chime', label: 'Glass chime' },
  { id: 'wood', label: 'Wooden knock' },
  { id: 'pulse', label: 'Soft pulse' },
];
const ALARM_IDS = ALARMS.map((a) => a.id);
const THEMES = ['light', 'dark', 'system'];

export const LIMITS = {
  focusMin: [1, 120],
  shortMin: [1, 30],
  longMin: [1, 60],
  longEvery: [2, 12],
  repeat: [1, 5],
  dailyGoal: [1, 24],
};

export const DEFAULT_SETTINGS = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  soundOn: true,
  alarm: 'chime',
  volume: 0.7,
  repeat: 2,
  notifyOn: false,
  theme: 'system',
  dailyGoal: 8,
};

export function clampInt(value, [min, max], fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function bool(v, fallback) {
  return typeof v === 'boolean' ? v : fallback;
}

export function sanitizeSettings(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_SETTINGS;
  const vol = Number(r.volume);
  return {
    focusMin: clampInt(r.focusMin, LIMITS.focusMin, d.focusMin),
    shortMin: clampInt(r.shortMin, LIMITS.shortMin, d.shortMin),
    longMin: clampInt(r.longMin, LIMITS.longMin, d.longMin),
    longEvery: clampInt(r.longEvery, LIMITS.longEvery, d.longEvery),
    autoStartBreaks: bool(r.autoStartBreaks, d.autoStartBreaks),
    autoStartFocus: bool(r.autoStartFocus, d.autoStartFocus),
    soundOn: bool(r.soundOn, d.soundOn),
    alarm: ALARM_IDS.includes(r.alarm) ? r.alarm : d.alarm,
    volume: Number.isFinite(vol) ? Math.min(1, Math.max(0, vol)) : d.volume,
    repeat: clampInt(r.repeat, LIMITS.repeat, d.repeat),
    notifyOn: bool(r.notifyOn, d.notifyOn),
    theme: THEMES.includes(r.theme) ? r.theme : d.theme,
    dailyGoal: clampInt(r.dailyGoal, LIMITS.dailyGoal, d.dailyGoal),
  };
}
