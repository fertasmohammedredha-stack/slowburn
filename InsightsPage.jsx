import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { todayStats, lastNDays, streak, heatGrid, heatLevel, groupHistory, weekSummary } from '../lib/stats.js';
import { formatMinutes, formatDayLabel, formatTime, weekdayShort, dayKey } from '../lib/time.js';
import { historyToCsv } from '../lib/csv.js';
import { download } from '../hooks.js';
import { Button, Card, ConfirmDialog, EmptyState, IconButton } from '../components/ui.jsx';
import { IconDownload, IconTrash } from '../components/Icons.jsx';

const R = 48;
const CIRC = 2 * Math.PI * R;

function GoalRing({ value, goal }) {
  const pct = Math.min(1, value / goal);
  return (
    <div className="goal-ring" role="img" aria-label={`${value} of ${goal} sessions today`}>
      <svg viewBox="0 0 112 112">
        <circle className="track" cx="56" cy="56" r={R} fill="none" strokeWidth="8" />
        <circle className="fill" cx="56" cy="56" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} />
      </svg>
      <div className="center"><span className="goal-num">{value}</span><span className="goal-of">OF {goal}</span></div>
    </div>
  );
}

function goalCopy(n, goal) {
  if (n === 0) return 'A clean slate. One session is enough to get moving.';
  if (n >= goal) return 'Daily goal reached. Anything more is a bonus.';
  const left = goal - n;
  return `${left} more session${left === 1 ? '' : 's'} to reach today's goal.`;
}

export default function InsightsPage() {
  const { state, actions } = useStore();
  const { history, tasks, settings } = state;
  const now = Date.now();
  const today = todayStats(history, tasks, now);
  const days = lastNDays(history, 7, now);
  const week = weekSummary(days);
  const max = Math.max(1, ...days.map((d) => d.count));
  const grid = heatGrid(history, 5, now);
  const groups = groupHistory(history);
  const [shown, setShown] = useState(7);
  const [confirmClear, setConfirmClear] = useState(false);
  const todayKey = dayKey(now);
  const dow = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="stack">
      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>Insights</h1>
        <p className="page-sub">What your focus actually looked like. Everything stays in this browser.</p>
      </div>

      <div className="stats-top">
        <Card className="goal-card" aria-label="Daily goal">
          <GoalRing value={today.sessions} goal={settings.dailyGoal} />
          <div className="goal-copy">
            <h2>Today's goal</h2>
            <p data-testid="goal-copy">{goalCopy(today.sessions, settings.dailyGoal)}</p>
          </div>
        </Card>
        <div className="stat-grid">
          <div className="stat"><span className="stat-num" data-testid="stat-sessions">{today.sessions}</span><span className="stat-label">Sessions today</span></div>
          <div className="stat"><span className="stat-num" data-testid="stat-focus">{formatMinutes(today.focusMs)}</span><span className="stat-label">Focus time</span></div>
          <div className="stat"><span className="stat-num">{today.tasksDone}</span><span className="stat-label">Tasks done</span></div>
          <div className="stat"><span className="stat-num" data-testid="stat-streak">{streak(history, now)}</span><span className="stat-label">Day streak</span></div>
        </div>
      </div>

      <div className="charts">
        <Card eyebrow="Seven days" title="Sessions per day">
          <div className="bars">
            {days.map((d) => (
              <div key={d.key} className={`bar${d.count === 0 ? ' is-zero' : ''}${d.key === todayKey ? ' is-today' : ''}`}
                role="img" aria-label={`${weekdayShort(d.ts)}: ${d.count} sessions, ${formatMinutes(d.ms)}`}>
                <div className="bar-track"><div className="bar-fill" style={{ height: `${d.count === 0 ? 0 : Math.max(6, (d.count / max) * 100)}%` }} /></div>
                <span className="bar-count">{d.count}</span>
                <span className="bar-day">{weekdayShort(d.ts)}</span>
              </div>
            ))}
          </div>
          <p className="week-note">
            {week.total === 0 ? 'No sessions this week yet.' : `${week.total} session${week.total === 1 ? '' : 's'}, ${formatMinutes(week.ms)} in the last 7 days.`}
          </p>
        </Card>

        <Card eyebrow="Five weeks" title="Consistency">
          <div className="heat" role="img" aria-label="Calendar of sessions over the last five weeks">
            {dow.map((d, i) => <span key={i} className="heat-dow" aria-hidden="true">{d}</span>)}
            {grid.map((c) => (
              <span key={c.key} title={`${c.key}: ${c.count} sessions`}
                className={`heat-cell${c.future ? ' is-future' : ''}${c.key === todayKey ? ' is-today' : ''}`}
                data-level={heatLevel(c.count, settings.dailyGoal)} />
            ))}
          </div>
          <div className="heat-legend" aria-hidden="true">
            less {[0, 1, 2, 3, 4].map((l) => <span key={l} className="heat-cell" data-level={l} />)} more
          </div>
        </Card>
      </div>

      <Card eyebrow="Log" title="Focus history"
        action={history.length > 0 && (
          <div className="history-actions">
            <Button size="sm" variant="secondary" icon={<IconDownload size={16} />}
              onClick={() => download('slowburn-history.csv', historyToCsv(history), 'text/csv')}>Export CSV</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmClear(true)}>Clear</Button>
          </div>
        )}>
        {groups.length === 0 ? (
          <EmptyState title="No sessions logged">Finish a focus session and it will show up here, with the task it belonged to.</EmptyState>
        ) : (
          <div data-testid="history">
            {groups.slice(0, shown).map((g) => (
              <div key={g.key} className="history-day">
                <div className="history-day-head">
                  <h3>{formatDayLabel(g.ts, now)}</h3>
                  <span>{g.sessions.length} · {formatMinutes(g.ms)}</span>
                </div>
                {g.sessions.map((e) => (
                  <div key={e.id} className="history-row" data-testid="history-row">
                    <span className="history-time">{formatTime(e.endedAt)}</span>
                    <span className={`history-task${e.taskTitle ? '' : ' is-none'}`}>{e.taskTitle ?? 'Open session'}</span>
                    <span className="history-dur">{formatMinutes(e.durationMs)}</span>
                    <IconButton label={`Delete session at ${formatTime(e.endedAt)}`} onClick={() => actions.deleteEntry(e.id)}>
                      <IconTrash size={16} />
                    </IconButton>
                  </div>
                ))}
              </div>
            ))}
            {groups.length > shown && (
              <div className="row-actions"><Button variant="secondary" onClick={() => setShown(shown + 7)}>Show older days</Button></div>
            )}
          </div>
        )}
      </Card>

      <ConfirmDialog open={confirmClear} title="Clear all history?" confirmLabel="Clear history"
        body="This removes every logged session and resets your streak. Tasks are not affected."
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => { actions.clearHistory(); setConfirmClear(false); }} />
    </div>
  );
}
