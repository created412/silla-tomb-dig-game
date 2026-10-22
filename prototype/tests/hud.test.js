import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hintForLayer } from '../src/hud.js';

test('C1: 층별 안내 문구', () => {
  assert.equal(hintForLayer('soil'), '손가락으로 쓱쓱 문질러!');
  assert.equal(hintForLayer('rock'), '돌은 톡톡 두드려!');
  assert.equal(hintForLayer('wood'), '손 뗐다가, 붓으로 살살…');
  assert.equal(hintForLayer('floor'), '다른 곳도 파 보자!');
});
