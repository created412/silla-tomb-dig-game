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
  attachInput(canvas, {
    getLayout: () => layout, getState: () => state,
    onEvents: ev => events.push(...ev), onTouchCell: c => touched.push(c), now: () => t,
  });
  const fire = (type, x, y, extra = {}) => listeners[type]({ isPrimary: true, pointerId: 1, clientX: x, clientY: y, ...extra });
  return { state, events, touched, fire, setT: v => { t = v; } };
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
