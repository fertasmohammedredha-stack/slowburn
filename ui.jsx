import { useEffect, useId, useRef, useState } from 'react';
import { IconMinus, IconPlus } from './Icons.jsx';

export function Button({ variant = 'secondary', size = 'md', icon, children, className = '', ...rest }) {
  return (
    <button type="button" className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>
      {icon}
      {children != null && <span>{children}</span>}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...rest }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export function Segmented({ label, value, onChange, options }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="segmented-opt"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          data-value={o.value}
        >
          {o.icon}
          <span>{o.label}</span>
          {o.hint && <small>{o.hint}</small>}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange, id }) {
  const auto = useId();
  const tid = id ?? auto;
  return (
    <div className="row">
      <div className="row-text">
        <label htmlFor={tid} className="row-label">{label}</label>
        {hint && <p className="row-hint" id={`${tid}-hint`}>{hint}</p>}
      </div>
      <button
        id={tid}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${tid}-hint` : undefined}
        className="switch"
        onClick={() => onChange(!checked)}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

// Number input with - / + buttons. Keeps a text draft so typing "1" on the way to "15" is fine.
export function NumberField({ label, hint, value, min, max, step = 1, unit, onChange, id, compact = false }) {
  const auto = useId();
  const nid = id ?? auto;
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (text) => {
    const n = Math.round(Number(text));
    if (text.trim() === '' || !Number.isFinite(n)) return setDraft(String(value));
    const clamped = Math.min(max, Math.max(min, n));
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };
  const bump = (d) => commit(String(value + d * step));

  const control = (
    <div className="stepper">
      <button type="button" className="stepper-btn" aria-label={`Decrease ${label}`} onClick={() => bump(-1)} disabled={value <= min}>
        <IconMinus size={16} />
      </button>
      <input
        id={nid}
        className="stepper-input"
        inputMode="numeric"
        value={draft}
        aria-label={compact ? label : undefined}
        aria-describedby={hint ? `${nid}-hint` : undefined}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
          setDraft(t);
          const n = Number(t);
          if (t !== '' && n >= min && n <= max && n !== value) onChange(n);
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(e.currentTarget.value);
          if (e.key === 'ArrowUp') { e.preventDefault(); bump(1); }
          if (e.key === 'ArrowDown') { e.preventDefault(); bump(-1); }
        }}
      />
      {unit && <span className="stepper-unit">{unit}</span>}
      <button type="button" className="stepper-btn" aria-label={`Increase ${label}`} onClick={() => bump(1)} disabled={value >= max}>
        <IconPlus size={16} />
      </button>
    </div>
  );
  if (compact) return control;
  return (
    <div className="row">
      <div className="row-text">
        <label htmlFor={nid} className="row-label">{label}</label>
        <p className="row-hint" id={`${nid}-hint`}>{hint ?? `${min} to ${max}`}</p>
      </div>
      {control}
    </div>
  );
}

export function Slider({ label, value, onChange, min = 0, max = 1, step = 0.05, format }) {
  const id = useId();
  return (
    <div className="row">
      <div className="row-text">
        <label htmlFor={id} className="row-label">{label}</label>
      </div>
      <div className="slider-wrap">
        <input id={id} type="range" className="slider" min={min} max={max} step={step} value={value}
          style={{ '--fill': `${((value - min) / (max - min)) * 100}%` }}
          onChange={(e) => onChange(Number(e.target.value))} />
        <output className="slider-out" htmlFor={id}>{format ? format(value) : value}</output>
      </div>
    </div>
  );
}

export function SelectRow({ label, hint, value, onChange, options }) {
  const id = useId();
  return (
    <div className="row">
      <div className="row-text">
        <label htmlFor={id} className="row-label">{label}</label>
        {hint && <p className="row-hint">{hint}</p>}
      </div>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Card({ title, eyebrow, action, children, className = '', as: Tag = 'section', ...rest }) {
  const id = useId();
  return (
    <Tag className={`card ${className}`} aria-labelledby={title ? id : undefined} {...rest}>
      {(title || action) && (
        <header className="card-head">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 id={id} className="card-title">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </Tag>
  );
}

export function EmptyState({ title, children, art }) {
  return (
    <div className="empty">
      {art}
      <p className="empty-title">{title}</p>
      <p className="empty-text">{children}</p>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, danger = true }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onClose={onCancel} onCancel={onCancel}
      onClick={(e) => { if (e.target === ref.current) onCancel(); }}>
      <div className="dialog-body">
        <h2 className="dialog-title">{title}</h2>
        <p className="dialog-text">{body}</p>
        <div className="dialog-actions">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  );
}
