import { useEffect } from 'react';
import { useStore } from '../state/store.jsx';
import { todayStats } from '../lib/stats.js';
import { formatMinutes } from '../lib/time.js';
import TimerPanel from '../components/TimerPanel.jsx';
import TaskPanel from '../components/TaskPanel.jsx';

function isTyping(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A' || el.isContentEditable;
}

export default function FocusPage() {
  const { state, actions } = useStore();
  const today = todayStats(state.history, state.tasks, Date.now());

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      if (document.querySelector('dialog[open]')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        state.timer.status === 'running' ? actions.pause() : actions.start();
      } else if (e.key === 'r' || e.key === 'R') {
        actions.reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.timer.status, actions]);

  return (
    <div className="focus-grid">
      <div className="focus-left">
        <TimerPanel />
        <ul className="today-strip" aria-label="Today so far">
          <li><span className="strip-num" data-testid="today-sessions">{today.sessions}</span><span className="strip-label">sessions today</span></li>
          <li><span className="strip-num">{formatMinutes(today.focusMs)}</span><span className="strip-label">focused</span></li>
          <li><span className="strip-num">{today.tasksDone}</span><span className="strip-label">tasks done</span></li>
        </ul>
      </div>
      <div className="focus-right"><TaskPanel /></div>
    </div>
  );
}
