export const pad = (n) => String(n).padStart(2, '0');

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function spokenClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m} minute${m === 1 ? '' : 's'} ${s} second${s === 1 ? '' : 's'} left`;
}

export function formatMinutes(ms) {
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Noon avoids daylight-saving edges when stepping by whole days.
export function noonOf(ts) {
  const d = new Date(ts);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

export function addDays(ts, n) {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

export function formatTime(ts) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(ts);
}

export function formatDayLabel(ts, now) {
  const key = dayKey(ts);
  if (key === dayKey(now)) return 'Today';
  if (key === dayKey(addDays(noonOf(now), -1))) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(ts);
}

export function weekdayShort(ts) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(ts);
}
