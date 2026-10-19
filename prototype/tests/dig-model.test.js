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

import { tap, TAP_AMOUNT, RAPID_TAPS, RAPID_INTERVAL_MS } from '../src/dig-model.js';

function bare(cols, rows, artifactCells = []) {
  const s = createDig({ cols, rows, artifactCells });
  s.soil.fill(0); return s;            // 흙 다 걷힌 상태
}

test('tap: 돌은 3번 두드리면 0', () => {
  const s = bare(1, 1);
  tap(s, 0, 0); tap(s, 0, 1000); assert.ok(s.rock[0] > 0);
  tap(s, 0, 2000); assert.equal(s.rock[0], 0);
  assert.equal(TAP_AMOUNT, 0.34); assert.equal(RAPID_TAPS, 4); assert.equal(RAPID_INTERVAL_MS, 250);
});

test('tap: 흙이 남아 있으면 무효', () => {
  const s = createDig({ cols: 1, rows: 1, artifactCells: [] });
  assert.deepEqual(tap(s, 0, 0), []); assert.equal(s.rock[0], 1);
});

test('tap: 250ms 미만 간격 4연타면 와르르, 이웃 돌만 복구', () => {
  const s = bare(3, 3);                 // 가운데 4
  s.rock[1] = 0.3; s.rock[4] = 0.3; s.rock[0] = 0.3; s.wood[4] = 0.2;
  let ev = [];
  for (const t of [0, 100, 200, 300]) ev = tap(s, 4, t);
  assert.deepEqual(ev, [{ type: 'collapse', cell: 4 }]);
  assert.equal(s.rock[4], 1); assert.equal(s.rock[1], 1);
  assert.equal(s.rock[0], 0.3);        // 대각선은 그대로
  assert.equal(s.wood[4], 0.2);        // 나무는 그대로
});

test('tap: 느린 탭은 와르르 아님', () => {
  const s = bare(1, 1);
  let ev = [];
  for (const t of [0, 300, 600, 900]) ev = tap(s, 0, t);
  assert.ok(!ev.some(e => e.type === 'collapse'));
});

test('tap: 유물 셀의 돌이 0이 되면 glimmer 한 번', () => {
  const s = bare(1, 1, [0]);
  tap(s, 0, 0); tap(s, 0, 1000);
  const ev = tap(s, 0, 2000);
  assert.deepEqual(ev, [{ type: 'glimmer', cell: 0 }]);
  assert.deepEqual(tap(s, 0, 3000), []);
});

import { brush, progress, BRUSH_RATE, GENTLE_MAX_SPEED, TOO_HARD_COOLDOWN_MS } from '../src/dig-model.js';

function woodOnly(cols, rows, artifactCells = []) {
  const s = bare(cols, rows, artifactCells); s.rock.fill(0); return s;
}

test('brush: 살살 900ms면 나무 0', () => {
  const s = woodOnly(1, 1);
  brush(s, 0, 450, 0.3, 0); assert.ok(Math.abs(s.wood[0] - 0.5) < 1e-9);
  brush(s, 0, 1000, 0.3, 500); assert.equal(s.wood[0], 0);
  assert.equal(BRUSH_RATE, 1 / 900); assert.equal(GENTLE_MAX_SPEED, 0.6); assert.equal(TOO_HARD_COOLDOWN_MS, 1000);
});

test('brush: 세게 하면 진척 없고 tooHard, 1초에 한 번만', () => {
  const s = woodOnly(1, 1);
  assert.deepEqual(brush(s, 0, 100, 2.0, 0), [{ type: 'tooHard', cell: 0 }]);
  assert.equal(s.wood[0], 1);
  assert.deepEqual(brush(s, 0, 100, 2.0, 500), []);
  assert.deepEqual(brush(s, 0, 100, 2.0, 1000), [{ type: 'tooHard', cell: 0 }]);
});

test('brush: 돌이 남아 있으면 무효', () => {
  const s = bare(1, 1);
  assert.deepEqual(brush(s, 0, 100, 0.1, 0), []); assert.equal(s.wood[0], 1);
});

test('brush: 유물 셀 드러남과 전체 완료', () => {
  const s = woodOnly(2, 1, [0, 1]);
  assert.deepEqual(brush(s, 0, 2000, 0.1, 0), [{ type: 'artifactCell', cell: 0 }]);
  assert.equal(s.done, false);
  assert.deepEqual(brush(s, 1, 2000, 0.1, 0),
    [{ type: 'artifactCell', cell: 1 }, { type: 'artifactRevealed' }]);
  assert.equal(s.done, true);
});

test('progress: 비율 계산', () => {
  const s = createDig({ cols: 2, rows: 1, artifactCells: [0] });
  s.soil[0] = 0;
  const p = progress(s);
  assert.equal(p.soil, 0.5); assert.equal(p.rock, 0); assert.equal(p.artifact, 0);
});
