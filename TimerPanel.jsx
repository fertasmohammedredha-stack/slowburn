import { useStore, useNow } from '../state/store.jsx';
import { modeMs, remainingOf } from '../lib/timer.js';
import { MODE_LABEL } from '../lib/defaults.js';
import Dial from './Dial.jsx';
import { Button, Segmented } from './ui.jsx';
import { IconPause, IconPlay, IconReset, IconSkip } from './Icons.jsx';

function roundLabel(timer, longEvery) {
  if (timer.mode === 'focus') return `Session ${Math.min(timer.cycle + 1, longEvery)} of ${longEvery}`;
  if (timer.mode === 'short') return `${timer.cycle} of ${longEvery} done. Breathe.`;
  return 'Round complete. Rest properly.';
}

export default function TimerPanel() {
  const { state, actions } = useStore();
  const { timer, settings, tasks, activeTaskId } = state;
  const now = useNow(timer.status === 'running', 250);
  const remaining = remainingOf(timer, now);
  const total = timer.status === 'idle' ? modeMs(timer.mode, settings) : (timer.plannedMs ?? modeMs(timer.mode, settings));
  const active = tasks.find((t) => t.id === activeTaskId);
  const running = timer.status === 'running';
  const label = running ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start';

  const caption =
    timer.mode === 'focus' ? (active ? active.title : 'No task selected') : timer.mode === 'short' ? 'Stretch and sip' : 'Step away';

  return (
    <section className="timer-panel" aria-label="Timer">
      <Segmented
        label="Session type"
        value={timer.mode}
        onChange={actions.setMode}
        options={[
          { value: 'focus', label: MODE_LABEL.focus, hint: `${settings.focusMin}m` },
          { value: 'short', label: 'Short', hint: `${settings.shortMin}m` },
          { value: 'long', label: 'Long', hint: `${settings.longMin}m` },
        ]}
      />

      <Dial mode={timer.mode} status={timer.status} remainingMs={remaining} totalMs={total} caption={caption} />

      <div className="round" aria-label={roundLabel(timer, settings.longEvery)}>
        <div className="round-pips" aria-hidden="true">
          {Array.from({ length: settings.longEvery }, (_, i) => (
            <span key={i} className={`pip${i < timer.cycle ? ' is-done' : ''}${timer.mode === 'focus' && i === timer.cycle ? ' is-now' : ''}`} />
          ))}
        </div>
        <p className="round-text" data-testid="round-label">{roundLabel(timer, settings.longEvery)}</p>
      </div>

      <div className="controls">
        <Button variant="ghost" icon={<IconReset size={18} />} onClick={actions.reset}
          disabled={timer.status === 'idle'} aria-keyshortcuts="R">Reset</Button>
        <Button variant="primary" size="lg" className="btn-main"
          icon={running ? <IconPause size={22} /> : <IconPlay size={22} />}
          onClick={running ? actions.pause : actions.start} aria-keyshortcuts="Space">{label}</Button>
        <Button variant="ghost" icon={<IconSkip size={18} />} onClick={actions.skip}>Skip</Button>
      </div>
      <p className="hint-keys" aria-hidden="true"><kbd>Space</kbd> start or pause · <kbd>R</kbd> reset</p>
    </section>
  );
}
