import test from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../src/lib/tasks.js';

test('createTask trims, collapses spaces, clamps the estimate and rejects blanks', () => {
  assert.equal(K.createTask({ title: '   ', estimate: 2 }, { id: 'a', now: 1 }), null);
  const t = K.createTask({ title: '  Write   the   intro ', estimate: 99 }, { id: 'a', now: 5 });
  assert.equal(t.title, 'Write the intro');
  assert.equal(t.estimate, 20);
  assert.equal(K.createTask({ title: 'x', estimate: 0 }, { id: 'b', now: 1 }).estimate, 1);
  assert.equal(K.createTask({ title: 'x'.repeat(500), estimate: 1 }, { id: 'c', now: 1 }).title.length, 120);
});

test('updateTask edits title and estimate but never blanks a title', () => {
  const [t] = [K.createTask({ title: 'A', estimate: 1 }, { id: 'a', now: 1 })];
  let list = K.updateTask([t], 'a', { title: 'B', estimate: 3 });
  assert.equal(list[0].title, 'B');
  assert.equal(list[0].estimate, 3);
  list = K.updateTask(list, 'a', { title: '   ' });
  assert.equal(list[0].title, 'B');
});

test('toggle sets and clears completedAt', () => {
  let list = [K.createTask({ title: 'A', estimate: 1 }, { id: 'a', now: 1 })];
  list = K.toggleTask(list, 'a', 99);
  assert.equal(list[0].completed, true);
  assert.equal(list[0].completedAt, 99);
  list = K.toggleTask(list, 'a', 100);
  assert.equal(list[0].completedAt, null);
});

test('totals and pomodorosLeft ignore completed tasks and overshoot', () => {
  let list = [
    { ...K.createTask({ title: 'A', estimate: 3 }, { id: 'a', now: 1 }), done: 1 },
    { ...K.createTask({ title: 'B', estimate: 2 }, { id: 'b', now: 1 }), done: 4 },
    { ...K.createTask({ title: 'C', estimate: 5 }, { id: 'c', now: 1 }), completed: true },
  ];
  assert.equal(K.pomodorosLeft(list), 2);
  const t = K.totals(list);
  assert.deepEqual([t.open, t.done, t.estimate, t.finished, t.left], [2, 1, 10, 5, 2]);
});
