import { useEffect, useRef, useState } from 'react';
import { useStore, useNow } from '../state/store.jsx';
import { estimateFinish } from '../lib/timer.js';
import { MAX_EST, MAX_TITLE, MIN_EST, totals } from '../lib/tasks.js';
import { formatTime } from '../lib/time.js';
import { Button, Card, EmptyState, IconButton, NumberField } from './ui.jsx';
import { IconCheck, IconEdit, IconPlus, IconTarget, IconTrash, IconX } from './Icons.jsx';

function Pips({ done, estimate }) {
  const shown = Math.min(estimate, 8);
  return (
    <span className="est" aria-label={`${done} of ${estimate} sessions done`}>
      <span className="est-pips" aria-hidden="true">
        {Array.from({ length: shown }, (_, i) => <i key={i} className={i < done ? 'on' : ''} />)}
      </span>
      <span className="est-text">{done}/{estimate}</span>
    </span>
  );
}

function TaskForm({ onSubmit, initial, submitLabel = 'Add task', onCancel, autoFocus = false }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [estimate, setEstimate] = useState(initial?.estimate ?? 1);
  const [error, setError] = useState('');
  const input = useRef(null);
  useEffect(() => { if (autoFocus) input.current?.focus(); }, [autoFocus]);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give the task a name first.');
      input.current?.focus();
      return;
    }
    onSubmit(title, estimate);
    if (!initial) { setTitle(''); setEstimate(1); setError(''); input.current?.focus(); }
  };

  return (
    <form className={`task-form${initial ? ' is-edit' : ''}`} onSubmit={submit} noValidate
      onKeyDown={(e) => { if (e.key === 'Escape' && onCancel) onCancel(); }}>
      <label className="sr-only" htmlFor={initial ? `edit-${initial.id}` : 'new-task'}>Task name</label>
      <input
        ref={input}
        id={initial ? `edit-${initial.id}` : 'new-task'}
        className="text-input"
        value={title}
        maxLength={MAX_TITLE}
        placeholder="Name a task to tackle"
        autoComplete="off"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'task-error' : undefined}
        onChange={(e) => { setTitle(e.target.value); if (error) setError(''); }}
      />
      <div className="task-form-est">
        <span className="est-label">Sessions</span>
        <NumberField compact label="Estimated sessions" value={estimate} min={MIN_EST} max={MAX_EST} onChange={setEstimate} />
      </div>
      {error && <p className="field-error" id="task-error" role="alert">{error}</p>}
      <div className="task-form-actions">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button variant="primary" type="submit" icon={initial ? <IconCheck size={18} /> : <IconPlus size={18} />}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function TaskItem({ task, active }) {
  const { actions } = useStore();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="task is-editing">
        <TaskForm initial={task} submitLabel="Save" autoFocus
          onSubmit={(title, estimate) => { actions.updateTask(task.id, { title, estimate }); setEditing(false); }}
          onCancel={() => setEditing(false)} />
      </li>
    );
  }
  return (
    <li className={`task${task.completed ? ' is-done' : ''}${active ? ' is-active' : ''}`} data-testid="task">
      <button type="button" role="checkbox" aria-checked={task.completed} className="check"
        aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`}
        onClick={() => actions.toggleTask(task.id)}>
        <IconCheck size={16} />
      </button>
      <div className="task-main">
        <p className="task-title">{task.title}</p>
        <Pips done={task.done} estimate={task.estimate} />
      </div>
      <div className="task-actions">
        {!task.completed && (
          <IconButton label={active ? `Stop focusing on ${task.title}` : `Focus on ${task.title}`}
            aria-pressed={active} className={`focus-btn${active ? ' is-on' : ''}`}
            onClick={() => actions.setActive(active ? null : task.id)}>
            <IconTarget size={18} />
          </IconButton>
        )}
        <IconButton label={`Edit ${task.title}`} onClick={() => setEditing(true)}><IconEdit size={18} /></IconButton>
        <IconButton label={`Delete ${task.title}`} onClick={() => actions.removeTask(task.id)}><IconTrash size={18} /></IconButton>
      </div>
    </li>
  );
}

export default function TaskPanel() {
  const { state, actions } = useStore();
  const { tasks, activeTaskId, timer, settings } = state;
  const [filter, setFilter] = useState('all');
  const now = useNow(tasks.length > 0, 30_000);
  const sum = totals(tasks);
  const finish = estimateFinish(now, timer, settings, sum.left);

  const visible = tasks.filter((t) => (filter === 'all' ? true : filter === 'open' ? !t.completed : t.completed));
  const filters = [
    ['all', 'All', tasks.length],
    ['open', 'Open', sum.open],
    ['done', 'Done', sum.done],
  ];

  return (
    <Card eyebrow="Queue" title="Today's tasks" className="tasks-card"
      action={sum.done > 0 ? <Button variant="ghost" size="sm" onClick={actions.clearCompleted}>Clear done</Button> : null}>
      <TaskForm onSubmit={(title, est) => actions.addTask(title, est)} />

      {tasks.length > 0 && (
        <div className="task-summary" data-testid="task-summary">
          <span><strong>{sum.finished}</strong> of <strong>{sum.estimate}</strong> sessions</span>
          {finish && <span>Done around <strong>{formatTime(finish)}</strong></span>}
          {!finish && <span>All caught up</span>}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="filters" role="group" aria-label="Filter tasks">
          {filters.map(([id, label, n]) => (
            <button key={id} type="button" className="filter" aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label} <span>{n}</span>
            </button>
          ))}
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState title="Nothing queued yet" art={<Ember />}>
          Name the one thing worth the next {settings.focusMin} minutes, then press Start.
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState title={filter === 'done' ? 'Nothing finished yet' : 'No open tasks'}>
          {filter === 'done' ? 'Completed tasks will gather here.' : 'Everything is checked off. Add another or call it a day.'}
        </EmptyState>
      ) : (
        <ul className="task-list" aria-label="Tasks">
          {visible.map((t) => <TaskItem key={t.id} task={t} active={t.id === activeTaskId} />)}
        </ul>
      )}
    </Card>
  );
}

function Ember() {
  return (
    <svg className="empty-art" width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="26" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      <path d="M36 10a26 26 0 0 1 22.5 13" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="58.5" cy="23" r="4" fill="var(--accent)" />
    </svg>
  );
}
