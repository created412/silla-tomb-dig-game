import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDig, topLayer, rub, RUB_RATE } from '../src/dig-model.js';

test('createDig: 모든 층 1, 유물 셀 기록', () => {
  const s = createDig({ cols: 4, rows: 2, artifactCells: [5, 6] });
  assert.equal(s.soil.length, 8);
  assert.equal(s.soil[0], 1); assert.equal(s.rock[0], 1); assert.equal(s.wood[0], 1);
  assert.ok(s.artifactCells.has(5));
  assert.equal(s.done, false);
});

test('topLayer: 위에서부터 첫 양수 층', () => {
  const s = createDig({ cols: 1, rows: 1, artifactCells: [] });
  assert.equal(topLayer(s, 0), 'soil');
  s.soil[0] = 0; assert.equal(topLayer(s, 0), 'rock');
  s.rock[0] = 0; assert.equal(topLayer(s, 0), 'wood');
  s.wood[0] = 0; assert.equal(topLayer(s, 0), 'floor');
});

test('rub: 흙을 600ms 문지르면 0, 음수 금지', () => {
  const s = createDig({ cols: 1, rows: 1, artifactCells: [] });
  rub(s, 0, 300); assert.ok(Math.abs(s.soil[0] - 0.5) < 1e-9);
  rub(s, 0, 1000); assert.equal(s.soil[0], 0);
  assert.equal(RUB_RATE, 1 / 600);
});

test('rub: 흙이 없으면 돌·나무는 변하지 않음', () => {
  const s = createDig({ cols: 1, rows: 1, artifactCells: [] });
  s.soil[0] = 0;
  const ev = rub(s, 0, 500);
  assert.deepEqual(ev, []); assert.equal(s.rock[0], 1); assert.equal(s.wood[0], 1);
});
