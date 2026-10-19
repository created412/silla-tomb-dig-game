// 순수 발굴 모델. 시간·좌표는 모두 인자로 받는다 (브라우저 API 없음).

export const RUB_RATE = 1 / 600; // 흙 한 셀 = 600ms 문지르기

export function createDig({ cols, rows, artifactCells = [] }) {
  const n = cols * rows;
  return {
    cols,
    rows,
    soil: new Float64Array(n).fill(1),
    rock: new Float64Array(n).fill(1),
    wood: new Float64Array(n).fill(1),
    artifactCells: new Set(artifactCells),
    revealed: new Set(),
    glimmered: new Set(),
    tapLog: new Map(),
    lastTooHardAt: -Infinity,
    done: false,
  };
}

export function topLayer(state, i) {
  if (state.soil[i] > 0) return 'soil';
  if (state.rock[i] > 0) return 'rock';
  if (state.wood[i] > 0) return 'wood';
  return 'floor';
}

export function rub(state, i, dtMs) {
  if (topLayer(state, i) !== 'soil') return [];
  state.soil[i] = Math.max(0, state.soil[i] - RUB_RATE * dtMs);
  return [];
}

export const TAP_AMOUNT = 0.34;       // 돌 한 셀 = 3번 두드리기
export const RAPID_TAPS = 4;
export const RAPID_INTERVAL_MS = 250; // 이 간격 미만 4연타 = 와르르

function neighbors4(cols, rows, i) {
  const x = i % cols, y = (i - x) / cols, out = [];
  if (x > 0) out.push(i - 1);
  if (x < cols - 1) out.push(i + 1);
  if (y > 0) out.push(i - cols);
  if (y < rows - 1) out.push(i + cols);
  return out;
}

function isRapid(times) {
  if (times.length < RAPID_TAPS) return false;
  const recent = times.slice(-RAPID_TAPS);
  for (let k = 1; k < recent.length; k++) {
    if (recent[k] - recent[k - 1] >= RAPID_INTERVAL_MS) return false;
  }
  return true;
}

export function tap(state, i, nowMs) {
  const layer = topLayer(state, i);
  if (layer === 'soil' || layer === 'floor') return [];

  const log = state.tapLog.get(i) ?? [];
  log.push(nowMs);
  if (log.length > RAPID_TAPS) log.shift();
  state.tapLog.set(i, log);

  if (isRapid(log)) {
    state.rock[i] = 1;
    for (const n of neighbors4(state.cols, state.rows, i)) {
      if (topLayer(state, n) === 'rock') state.rock[n] = 1;
    }
    state.tapLog.set(i, []);
    return [{ type: 'collapse', cell: i }];
  }

  if (layer !== 'rock') return [];
  state.rock[i] = Math.max(0, state.rock[i] - TAP_AMOUNT);
  if (state.rock[i] === 0 && state.artifactCells.has(i) && !state.glimmered.has(i)) {
    state.glimmered.add(i);
    return [{ type: 'glimmer', cell: i }];
  }
  return [];
}
