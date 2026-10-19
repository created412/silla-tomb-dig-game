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
