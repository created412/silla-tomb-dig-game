// 한 판의 도전 규칙. dig-model 위에 얹는 순수 계층: 무작위 배치, 꽝 돌, 지렁이, 금, 토우 능력, 별. 시간 제한 없음.
// 무작위는 주입한 rng()로만 쓴다.
import { COLS, ROWS, ARTIFACTS } from './levels.js';
import { createDig, topLayer } from './dig-model.js';

export const CRACKS_TO_BREAK = 3;
export const WORM_FLEE_MS = 2000;
export const BIRD_HINT_MS = 3000;
export const SNAKE_WOOD_FLOOR = 0.4;
export const WARN_WINDOW_MS = 3000; // 세게 문지르기·나무 찍기는 먼저 경고, 이 안에 또 하면 금

const N = COLS * ROWS;

export function placeArtifact(shape, rng) {
  const w = Math.max(...shape.map(([c]) => c)) + 1;
  const h = Math.max(...shape.map(([, r]) => r)) + 1;
  // 0행·마지막 행·0열·마지막 열은 피한다
  const c0 = 1 + Math.floor(rng() * (COLS - 2 - w + 1));
  const r0 = 1 + Math.floor(rng() * (ROWS - 2 - h + 1));
  return shape.map(([dc, dr]) => (r0 + dr) * COLS + c0 + dc);
}

export function createChallenge(level, rng) {
  const cells = placeArtifact(ARTIFACTS[level.id].shape, rng);
  const dig = createDig({ cols: COLS, rows: ROWS, artifactCells: cells });
  const cov = level.rockCoverage;
  for (let i = 0; i < N; i++) {
    if (cov <= 0) dig.rock[i] = 0;
    else if (cov >= 1) dig.rock[i] = 1;
    else dig.rock[i] = dig.artifactCells.has(i) || rng() < cov ? 1 : 0;
  }
  const worms = new Set();
  const candidates = [];
  for (let i = 0; i < N; i++) if (!dig.artifactCells.has(i)) candidates.push(i);
  while (worms.size < level.worms && candidates.length) {
    const k = Math.floor(rng() * candidates.length);
    worms.add(candidates.splice(k, 1)[0]);
  }
  const powers = {};
  for (const who of level.friends) powers[who] = 1;
  return {
    level, dig, worms, cracks: 0, crackCells: [],
    powers, fleeUntil: -Infinity, hintUntil: -Infinity, outcome: null,
    warnAt: -Infinity,
  };
}

export function isLocked(ch, nowMs) {
  return ch.fleeUntil > nowMs;
}

function crack(ch, cell, out) {
  ch.cracks += 1;
  ch.crackCells.push(cell);
  ch.warnAt = -Infinity; // 금이 간 뒤 다음 실수는 다시 경고부터
  out.push({ type: 'crack', cell, cracks: ch.cracks });
  if (ch.cracks >= CRACKS_TO_BREAK) { ch.outcome = 'broken'; out.push({ type: 'broken' }); }
}

// 실수(세게 문지르기, 나무 찍기): 처음은 경고, WARN_WINDOW_MS 안에 또 하면 금.
// 흙을 빠르게 문지르던 손이 그대로 나무에 닿는 흔한 경우를 한 번은 봐준다.
function offense(ch, cell, nowMs, out) {
  if (nowMs - ch.warnAt <= WARN_WINDOW_MS) { crack(ch, cell, out); return; }
  ch.warnAt = nowMs;
  out.push({ type: 'warn', cell });
}

export function processEvents(ch, events, nowMs) {
  const out = [...events];
  for (const e of events) {
    if (ch.outcome) break;
    if (e.type === 'tooHard' && ch.dig.artifactCells.has(e.cell)) offense(ch, e.cell, nowMs, out);
    else if (e.type === 'collapse' && ch.dig.artifactCells.has(e.cell)) crack(ch, e.cell, out);
    else if (e.type === 'artifactRevealed') { ch.outcome = 'found'; out.push({ type: 'found' }); }
  }
  return out;
}

export function afterRub(ch, cell, nowMs) {
  if (ch.outcome || ch.dig.soil[cell] !== 0 || !ch.worms.has(cell)) return [];
  ch.worms.delete(cell);
  ch.fleeUntil = nowMs + WORM_FLEE_MS;
  return [{ type: 'worm', cell }];
}

export function tapWood(ch, cell, nowMs) {
  if (ch.outcome || !ch.dig.artifactCells.has(cell) || topLayer(ch.dig, cell) !== 'wood') return [];
  const out = [];
  offense(ch, cell, nowMs, out);
  return out;
}

function around(cell) {
  const r0 = Math.floor(cell / COLS), c0 = cell % COLS, cells = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const r = r0 + dr, c = c0 + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells.push(r * COLS + c);
  }
  return cells;
}

export function usePower(ch, who, cell, nowMs) {
  if (ch.outcome || ch.powers[who] !== 1) return { ok: false, events: [] };
  const dig = ch.dig, events = [];
  let count = 0;
  if (who === 'bird') {
    ch.hintUntil = nowMs + BIRD_HINT_MS;
    count = 1;
  } else if (!Number.isInteger(cell) || cell < 0 || cell >= N) {
    return { ok: false, events: [] };
  } else {
    for (const i of around(cell)) {
      const layer = topLayer(dig, i);
      if (who === 'frog' && layer === 'soil') {
        dig.soil[i] = 0; count++;
        events.push(...afterRub(ch, i, nowMs));
      } else if (who === 'turtle' && layer === 'rock') {
        dig.rock[i] = 0; dig.tapLog.delete(i); count++;
        if (dig.artifactCells.has(i) && !dig.glimmered.has(i)) { dig.glimmered.add(i); events.push({ type: 'glimmer', cell: i }); }
      } else if (who === 'snake' && layer === 'wood' && dig.wood[i] > SNAKE_WOOD_FLOOR) {
        dig.wood[i] = SNAKE_WOOD_FLOOR; count++;
      }
    }
  }
  if (!count) return { ok: false, events: [] };
  ch.powers[who] = 0;
  return { ok: true, events };
}

export function stars(ch) {
  if (ch.outcome !== 'found') return 0;
  return Math.max(1, 3 - ch.cracks); // 금 0개 = 3, 1개 = 2, 2개 = 1
}
