// CSV export. Cells that start with = + - @ are prefixed so spreadsheets never run them as formulas.
function cell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function historyToCsv(history) {
  const rows = [['started_at', 'ended_at', 'minutes', 'task']];
  for (const e of [...history].sort((a, b) => a.endedAt - b.endedAt)) {
    rows.push([
      new Date(e.startedAt).toISOString(),
      new Date(e.endedAt).toISOString(),
      Math.round((e.durationMs / 60_000) * 10) / 10,
      e.taskTitle ?? '',
    ]);
  }
  return rows.map((r) => r.map(cell).join(',')).join('\n') + '\n';
}
