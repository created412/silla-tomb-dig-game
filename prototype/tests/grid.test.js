import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutGrid, cellAt, cellRect, neighbors4 } from '../src/grid.js';

test('layoutGrid: 셀 크기는 가로·세로 중 작은 쪽, 중앙 정렬', () => {
  const L = layoutGrid({ width: 1000, height: 500, cols: 10, rows: 5, padding: 50 });
  assert.equal(L.cell, 80);
  assert.equal(L.x0, (1000 - 800) / 2); assert.equal(L.y0, (500 - 400) / 2);
});

test('cellAt: 안쪽은 인덱스, 바깥은 -1', () => {
  const L = layoutGrid({ width: 1000, height: 500, cols: 10, rows: 5, padding: 50 });
  assert.equal(cellAt(L, L.x0 + 1, L.y0 + 1), 0);
  assert.equal(cellAt(L, L.x0 + 81, L.y0 + 81), 11);
  assert.equal(cellAt(L, 0, 0), -1);
  assert.equal(cellAt(L, L.x0 + 800, L.y0 + 1), -1);
});

test('cellRect', () => {
  const L = layoutGrid({ width: 1000, height: 500, cols: 10, rows: 5, padding: 50 });
  assert.deepEqual(cellRect(L, 11), { x: L.x0 + 80, y: L.y0 + 80, w: 80, h: 80 });
});

test('neighbors4: 경계 처리', () => {
  assert.deepEqual(neighbors4(3, 3, 4).sort(), [1, 3, 5, 7]);
  assert.deepEqual(neighbors4(3, 3, 0).sort(), [1, 3]);
});
