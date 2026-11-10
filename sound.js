// Alarm sounds are synthesised with the Web Audio API: no audio files, nothing copied from anywhere.
let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

// Browsers only allow audio after a user gesture, so call this from a click.
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

function tone(c, { freq, at, dur, type = 'sine', gain = 0.3, attack = 0.01 }) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

const PATTERNS = {
  chime: (c, t, v) => {
    tone(c, { freq: 880, at: t, dur: 1.2, gain: 0.35 * v });
    tone(c, { freq: 1318.5, at: t + 0.18, dur: 1.4, gain: 0.28 * v });
    tone(c, { freq: 1760, at: t + 0.18, dur: 0.8, gain: 0.08 * v });
  },
  wood: (c, t, v) => {
    [523.25, 659.25, 783.99].forEach((f, i) =>
      tone(c, { freq: f, at: t + i * 0.16, dur: 0.22, type: 'triangle', gain: 0.4 * v, attack: 0.004 }),
    );
  },
  pulse: (c, t, v) => {
    [0, 0.3, 0.6].forEach((o) => tone(c, { freq: 440, at: t + o, dur: 0.22, gain: 0.3 * v, attack: 0.05 }));
  },
};

export function playAlarm(kind, volume = 0.7, repeat = 1) {
  const c = getCtx();
  if (!c) return false;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const pattern = PATTERNS[kind] ?? PATTERNS.chime;
  const v = Math.min(1, Math.max(0, volume));
  if (v === 0) return true;
  const t0 = c.currentTime + 0.05;
  for (let i = 0; i < repeat; i++) pattern(c, t0 + i * 1.8, v);
  return true;
}
