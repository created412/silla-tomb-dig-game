import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LINES } from '../src/lines.js';
import { createDialogue } from '../src/dialogue.js';

test('LINES: 만담 2개는 4줄, 반응 대사는 1줄, 모두 40자 이내', () => {
  assert.equal(LINES.wake.length, 4); assert.equal(LINES.found.length, 4);
  for (const id of ['tooHard', 'collapse', 'glimmer', 'rockDrag']) assert.equal(LINES[id].length, 1);
  for (const arr of Object.values(LINES)) for (const l of arr) {
    assert.ok(['frog', 'snake'].includes(l.who)); assert.ok(l.text.length <= 40);
  }
});

test('dialogue: play/next/current 순서', () => {
  const d = createDialogue({ a: [{ who: 'frog', text: '1' }, { who: 'snake', text: '2' }] });
  assert.equal(d.current(), null); assert.equal(d.isPlaying(), false);
  d.play('a');
  assert.equal(d.current().text, '1'); assert.equal(d.isPlaying(), true);
  assert.equal(d.next().text, '2');
  assert.equal(d.next(), null); assert.equal(d.current(), null);
});

test('dialogue: playIfIdle은 재생 중이면 무시', () => {
  const d = createDialogue({ a: [{ who: 'frog', text: '1' }], b: [{ who: 'snake', text: '2' }] });
  d.play('a');
  assert.equal(d.playIfIdle('b'), false); assert.equal(d.current().text, '1');
  d.next();
  assert.equal(d.playIfIdle('b'), true); assert.equal(d.current().text, '2');
});
