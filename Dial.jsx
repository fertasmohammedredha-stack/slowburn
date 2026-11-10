import { formatClock, spokenClock } from '../lib/time.js';
import { MODE_LABEL } from '../lib/defaults.js';

const TICKS = 60;
const C = 160;
const R_ARC = 116;
const CIRC = 2 * Math.PI * R_ARC;

// The timer face: 60 ticks that go dark as time is spent, a thin ring that drains,
// and an ember riding the end of the ring.
export default function Dial({ mode, status, remainingMs, totalMs, caption }) {
  const frac = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 1;
  const spent = 1 - frac;
  const spentTicks = Math.floor(spent * TICKS + 1e-9);
  const angle = -90 + spent * 360;
  const ex = C + R_ARC * Math.cos((angle * Math.PI) / 180);
  const ey = C + R_ARC * Math.sin((angle * Math.PI) / 180);

  const ticks = [];
  for (let i = 0; i < TICKS; i++) {
    const a = (i * 6 - 90) * (Math.PI / 180);
    const major = i % 5 === 0;
    const r1 = major ? 130 : 136;
    const r2 = 150;
    ticks.push(
      <line
        key={i}
        className={`dial-tick${major ? ' is-major' : ''}${i < spentTicks ? ' is-spent' : ''}`}
        x1={C + r1 * Math.cos(a)} y1={C + r1 * Math.sin(a)}
        x2={C + r2 * Math.cos(a)} y2={C + r2 * Math.sin(a)}
      />,
    );
  }

  return (
    <div className="dial" data-status={status}>
      <svg viewBox="0 0 320 320" className="dial-svg" aria-hidden="true" focusable="false">
        <circle cx={C} cy={C} r={R_ARC} className="dial-track" />
        <circle
          cx={C} cy={C} r={R_ARC}
          className="dial-arc"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * spent}
          transform={`rotate(-90 ${C} ${C})`}
        />
        {ticks}
        <circle cx={ex} cy={ey} r="6" className="dial-ember" />
      </svg>
      <div className="dial-face">
        <p className="dial-mode">{MODE_LABEL[mode]}</p>
        <div className={`dial-clock${formatClock(remainingMs).length > 5 ? ' is-long' : ''}`} role="timer" aria-live="off" aria-label={spokenClock(remainingMs)}>
          {formatClock(remainingMs)}
        </div>
        <p className="dial-caption" title={caption}>{caption}</p>
      </div>
    </div>
  );
}
