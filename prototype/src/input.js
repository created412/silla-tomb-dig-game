// 포인터 이벤트 → rub / tap / brush.
// 격자 안에서 처음 눌린 포인터 하나만 추적한다 (엄지가 화면 가장자리에 닿아 있어도 동작).
// 거리·속도는 CSS px 기준이라 DPR이 달라도 손맛이 같다.
import { cellAt } from './grid.js';
import { rub, tap, brush, topLayer } from './dig-model.js';

export const DRAG_THRESHOLD_PX = 10;  // CSS px. 이 안에서 흔들린 것은 탭
export const TAP_MAX_MS = 300;
export const MAX_DT_MS = 50;          // 멈춰 있던 시간은 이만큼만 진척에 반영
export const ROCK_DRAG_PX = 40;       // 돌 위를 이만큼 문지르면 "두드려야 해" 안내
export const SPEED_WINDOW_MS = 120;   // 붓질 속도는 이 시간의 평균 (순간 속도는 손 떨림에 튄다)

export function attachInput(canvas, {
  getLayout, getState, onEvents,
  onRub = () => {}, onBrush = () => {}, onTouchCell = () => {}, onRockDrag = () => {},
  onTap = () => {},                      // 탭으로 판정된 셀 (층과 무관). 모델이 무시하는 나무 탭을 바깥에서 알 수 있다
  now = () => performance.now(),
}) {
  let tracking = null; // { id, downX, downY, downT, prevX, prevY, prevT, moved, rockDragPx }

  function cssPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, rect };
  }

  function cellOf(p) {
    const sx = canvas.width / p.rect.width;
    const sy = canvas.height / p.rect.height;
    return cellAt(getLayout(), p.x * sx, p.y * sy);
  }

  function emit(events) {
    if (events && events.length) onEvents(events);
  }

  function onDown(e) {
    if (tracking) return;                  // 이미 다른 손가락을 추적 중
    const p = cssPoint(e);
    const i = cellOf(p);
    if (i < 0) return;                     // 격자 밖(가장자리를 쥔 엄지 등)은 무시
    if (!getState()) return;               // 잠금·다른 모드 중에 시작한 제스처는 끝까지 무시
    const t = now();
    // 한 손놀림은 한 가지 일: 흙에서 시작한 손놀림은 흙이 걷혀도 나무를 붓질하지 않는다.
    // (빠르게 문지르던 손이 그대로 나무에 닿아 "세게"로 판정되는 억울함을 없앤다)
    const startLayer = topLayer(getState(), i);
    tracking = { id: e.pointerId, downX: p.x, downY: p.y, downT: t, prevX: p.x, prevY: p.y, prevT: t, moved: false, rockDragPx: 0, samples: [{ t, x: p.x, y: p.y }], startLayer };
    try { canvas.setPointerCapture(e.pointerId); } catch { /* 일부 브라우저 */ }
    onTouchCell(i);
  }

  function onMove(e) {
    if (!tracking || e.pointerId !== tracking.id) return;
    const p = cssPoint(e);
    const t = now();
    const dist = Math.hypot(p.x - tracking.prevX, p.y - tracking.prevY);
    if (Math.hypot(p.x - tracking.downX, p.y - tracking.downY) > DRAG_THRESHOLD_PX) tracking.moved = true;
    const rawDt = Math.max(1, t - tracking.prevT);
    const dt = Math.min(rawDt, MAX_DT_MS);
    tracking.prevX = p.x; tracking.prevY = p.y; tracking.prevT = t;
    // 최근 SPEED_WINDOW_MS 동안 지나온 길이 / 시간 = 속도 (CSS px/ms)
    const s = tracking.samples;
    s.push({ t, x: p.x, y: p.y });
    while (s.length > 2 && t - s[1].t >= SPEED_WINDOW_MS) s.shift();
    let path = 0;
    for (let k = 1; k < s.length; k++) path += Math.hypot(s[k].x - s[k - 1].x, s[k].y - s[k - 1].y);
    const speed = path / Math.max(1, t - s[0].t);

    const state = getState();
    const i = cellOf(p);
    if (i < 0 || !state || state.done) return;
    onTouchCell(i);
    const layer = topLayer(state, i);
    if (layer === 'soil') {
      const before = state.soil[i];
      emit(rub(state, i, dt));
      if (state.soil[i] < before) onRub(i);
    } else if (layer === 'wood') {
      if (tracking.startLayer !== 'wood') return; // 나무는 나무 위에서 시작한 새 손놀림으로만
      const before = state.wood[i];
      emit(brush(state, i, dt, speed, t));
      if (state.wood[i] < before) onBrush(i);
    } else if (layer === 'rock') {
      // 드래그는 무효. 한참 문지르면 "두드려야 해" 안내
      tracking.rockDragPx += dist;
      if (tracking.rockDragPx >= ROCK_DRAG_PX) { tracking.rockDragPx = 0; onRockDrag(i); }
    }
  }

  function onUp(e) {
    if (!tracking || e.pointerId !== tracking.id) return;
    const p = cssPoint(e);
    const t = now();
    const quick = t - tracking.downT < TAP_MAX_MS;
    const state = getState();
    if (!tracking.moved && quick && state && !state.done) {
      const i = cellOf(p);
      if (i >= 0) {
        const events = tap(state, i, t);
        if (!events.length) onTap(i, t);   // 모델이 무시한 탭(나무 등)만 바깥에 알린다
        emit(events);
      }
    }
    tracking = null;
  }

  function onCancel(e) {
    if (tracking && e.pointerId === tracking.id) tracking = null;
  }

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
