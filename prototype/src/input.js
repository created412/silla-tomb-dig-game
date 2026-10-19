// 포인터 이벤트 → rub / tap / brush. 첫(primary) 포인터만 추적한다.
import { cellAt } from './grid.js';
import { rub, tap, brush, topLayer } from './dig-model.js';

const DRAG_THRESHOLD_PX = 6;
const TAP_MAX_MS = 300;

export function attachInput(canvas, { getLayout, getState, onEvents, now = () => performance.now() }) {
  let tracking = null; // { downX, downY, downT, prevX, prevY, prevT, moved }

  function toCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function emit(events) {
    if (events && events.length) onEvents(events);
  }

  function onDown(e) {
    if (!e.isPrimary) return;
    const { x, y } = toCanvas(e);
    const t = now();
    tracking = { downX: x, downY: y, downT: t, prevX: x, prevY: y, prevT: t, moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch { /* 일부 브라우저 */ }
  }

  function onMove(e) {
    if (!e.isPrimary || !tracking) return;
    const { x, y } = toCanvas(e);
    const t = now();
    const dx = x - tracking.prevX, dy = y - tracking.prevY;
    const dist = Math.hypot(dx, dy);
    if (Math.hypot(x - tracking.downX, y - tracking.downY) > DRAG_THRESHOLD_PX) tracking.moved = true;
    const dt = Math.max(1, t - tracking.prevT);
    const speed = dist / dt;
    tracking.prevX = x; tracking.prevY = y; tracking.prevT = t;

    const state = getState();
    const i = cellAt(getLayout(), x, y);
    if (i < 0 || !state || state.done) return;
    const layer = topLayer(state, i);
    if (layer === 'soil') emit(rub(state, i, dt));
    else if (layer === 'wood') emit(brush(state, i, dt, speed, t));
    // rock: 드래그는 무효, 두드려야 한다
  }

  function onUp(e) {
    if (!e.isPrimary || !tracking) return;
    const { x, y } = toCanvas(e);
    const t = now();
    const quick = t - tracking.downT < TAP_MAX_MS;
    const state = getState();
    if (!tracking.moved && quick && state && !state.done) {
      const i = cellAt(getLayout(), x, y);
      if (i >= 0) emit(tap(state, i, t));
    }
    tracking = null;
  }

  function onCancel() { tracking = null; }

  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', onCancel);
  canvas.addEventListener('pointercancel', onCancel);

  return function detach() {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointerleave', onCancel);
    canvas.removeEventListener('pointercancel', onCancel);
  };
}
