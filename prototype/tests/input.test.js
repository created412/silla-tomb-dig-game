import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attachInput, DRAG_THRESHOLD_PX, MAX_DT_MS } from '../src/input.js';
import { createDig } from '../src/dig-model.js';
import { layoutGrid } from '../src/grid.js';

// CSS 1000x500, DPR 2 → 캔버스 2000x1000. 격자 10x5, 셀 = 캔버스 200px = CSS 100px.
function harness({ dpr = 2 } = {}) {
  const listeners = {};
  const canvas = {
    width: 1000 * dpr, height: 500 * dpr, style: {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 500 }),
    addEventListener: (t, fn) => { listeners[t] = fn; },
    removeEventListener: () => {},
    setPointerCapture: () => {},
  };
  const layout = layoutGrid({ width: canvas.width, height: canvas.height, cols: 10, rows: 5, padding: 0 });
  const state = createDig({ cols: 10, rows: 5, artifactCells: [] });
  let t = 0;
  const events = [];
  const touched = [];
  const taps = [];
  attachInput(canvas, {
    getLayout: () => layout, getState: () => state,
    onEvents: ev => events.push(...ev), onTouchCell: c => touched.push(c), onTap: (c, at) => taps.push([c, at]), now: () => t,
  });
  const fire = (type, x, y, extra = {}) => listeners[type]({ isPrimary: true, pointerId: 1, clientX: x, clientY: y, ...extra });
  return { state, events, touched, taps, fire, setT: v => { t = v; } };
}

test('I1: 탭이 8 CSS px 흔들려도 탭으로 인정 (DPR 2)', () => {
  const h = harness();
  h.state.soil[0] = 0;                        // 셀 0 돌 노출
  h.fire('pointerdown', 50, 50); h.setT(50);
  h.fire('pointermove', 58, 50); h.setT(100);
  h.fire('pointerup', 58, 50);
  assert.ok(h.state.rock[0] < 1, '돌이 깎여야 함');
  assert.equal(DRAG_THRESHOLD_PX, 10);
});

test('I1: 붓질 속도는 CSS px 기준 (0.4 CSS px/ms는 살살)', () => {
  const h = harness();
  h.state.soil[0] = 0; h.state.rock[0] = 0;   // 셀 0 나무 노출
  h.fire('pointerdown', 50, 50); h.setT(50);
  h.fire('pointermove', 70, 50);              // 20 CSS px / 50ms = 0.4
  assert.ok(h.state.wood[0] < 1, '나무가 깎여야 함');
  assert.ok(!h.events.some(e => e.type === 'tooHard'));
});

test('I5: 멈춰 있던 시간은 최대 50ms만 진척에 반영', () => {
  const h = harness();
  h.fire('pointerdown', 50, 50); h.setT(1000);
  h.fire('pointermove', 51, 50);
  assert.equal(MAX_DT_MS, 50);
  assert.ok(h.state.soil[0] >= 1 - 50 / 600 - 1e-9, `soil=${h.state.soil[0]}`);
  assert.ok(h.state.soil[0] < 1);
});

test('I4: 격자 밖에 엄지가 먼저 닿아 있어도 손가락 탭이 동작', () => {
  const h = harness();
  h.state.soil[0] = 0;
  h.fire('pointerdown', 1200, 250, { pointerId: 7, isPrimary: true }); // 격자(=캔버스 전체) 밖의 엄지
  h.fire('pointerdown', 50, 50, { pointerId: 8, isPrimary: false }); h.setT(50);
  h.fire('pointerup', 50, 50, { pointerId: 8, isPrimary: false });
  assert.ok(h.state.rock[0] < 1, '돌이 깎여야 함');
});

test('I4: 추적 중인 손가락 외의 두 번째 손가락 탭은 무시', () => {
  const h = harness();
  h.state.soil[0] = 0;
  h.fire('pointerdown', 50, 50, { pointerId: 1 });
  h.fire('pointerdown', 52, 52, { pointerId: 2, isPrimary: false }); h.setT(40);
  h.fire('pointerup', 52, 52, { pointerId: 2, isPrimary: false }); h.setT(60);
  h.fire('pointerup', 50, 50, { pointerId: 1 });
  assert.ok(Math.abs(h.state.rock[0] - 0.66) < 1e-9, `rock=${h.state.rock[0]} (한 번만 깎여야 함)`);
});

test('C1: 누르거나 움직인 셀을 onTouchCell로 알림', () => {
  const h = harness();
  h.fire('pointerdown', 50, 50); h.setT(30);
  h.fire('pointermove', 150, 50);
  assert.deepEqual(h.touched, [0, 1]);
});

test('T1: 탭이면 층과 무관하게 onTap(cell, nowMs)을 부르고, 드래그면 부르지 않음', () => {
  const h = harness();
  h.state.soil[0] = 0; h.state.rock[0] = 0;   // 셀 0 나무 노출 (모델은 나무 탭을 무시)
  h.fire('pointerdown', 50, 50); h.setT(80);
  h.fire('pointerup', 52, 50);
  assert.deepEqual(h.taps, [[0, 80]]);
  h.fire('pointerdown', 150, 50); h.setT(120);
  h.fire('pointermove', 190, 50); h.setT(160);
  h.fire('pointerup', 190, 50);
  assert.deepEqual(h.taps, [[0, 80]], '드래그는 탭이 아님');
});

test('T2: 모델이 처리한 탭(돌 두드리기·연타 와르르)은 onTap으로 다시 알리지 않는다', () => {
  const h = harness();
  h.state.soil[0] = 0;                        // 셀 0 돌 노출
  for (const t of [0, 200, 400, 600]) {       // 250ms 안 4연타: 3번은 chip, 4번째는 나무 위 연타 → collapse
    h.setT(t); h.fire('pointerdown', 50, 50); h.setT(t + 60); h.fire('pointerup', 50, 50);
  }
  assert.ok(h.events.some(e => e.type === 'collapse'), '4번째 탭은 와르르');
  assert.deepEqual(h.taps, [], '모델이 처리한 탭은 onTap을 내지 않음');
});

test('T3: pointerdown 시점에 getState가 null이면 그 제스처는 끝까지 무시한다 (잠금 중 누른 손가락)', () => {
  const listeners = {};
  const canvas = {
    width: 2000, height: 1000, style: {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 500 }),
    addEventListener: (t, fn) => { listeners[t] = fn; }, removeEventListener: () => {}, setPointerCapture: () => {},
  };
  const layout = layoutGrid({ width: 2000, height: 1000, cols: 10, rows: 5, padding: 0 });
  const state = createDig({ cols: 10, rows: 5, artifactCells: [] });
  state.soil[0] = 0; state.rock[0] = 0;       // 셀 0 나무 노출
  let locked = true, t = 0; const taps = [];
  attachInput(canvas, { getLayout: () => layout, getState: () => (locked ? null : state), onEvents: () => {}, onTap: c => taps.push(c), now: () => t });
  const fire = (type, x, y) => listeners[type]({ pointerId: 1, isPrimary: true, clientX: x, clientY: y });
  fire('pointerdown', 50, 50); locked = false; t = 80;   // 누른 뒤 잠금이 풀려도
  fire('pointerup', 50, 50);
  assert.deepEqual(taps, [], '잠금 중 시작한 제스처는 탭이 아님');
  t = 200; fire('pointerdown', 50, 50); t = 280; fire('pointerup', 50, 50);
  assert.deepEqual(taps, [0], '잠금 해제 뒤 새 제스처는 정상');
});
