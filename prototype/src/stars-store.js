// 레벨별 최고 별 저장. storage(localStorage 등)는 주입받고, 어떤 경우에도 예외를 던지지 않는다.
import { LEVELS } from './levels.js';

export const STARS_KEY = 'silla-dig-stars-v1';
const VERSION = 1;

function zero() {
  return Object.fromEntries(LEVELS.map(l => [l.id, 0]));
}

export function loadStars(storage) {
  const stars = zero();
  try {
    const raw = storage?.getItem(STARS_KEY);
    if (!raw) return stars;
    const v = JSON.parse(raw);
    if (v?.version !== VERSION || typeof v.stars !== 'object' || !v.stars) return stars;
    for (const id of Object.keys(stars)) {
      const n = v.stars[id];
      if (Number.isInteger(n) && n >= 0 && n <= 3) stars[id] = n;
    }
  } catch { /* 깨진 저장은 무시 */ }
  return stars;
}

export function saveStar(storage, starsObj, levelId, n) {
  const stars = { ...zero(), ...starsObj };
  stars[levelId] = Math.max(stars[levelId] ?? 0, n);
  try { storage?.setItem(STARS_KEY, JSON.stringify({ version: VERSION, stars })); } catch { /* 저장 불가 */ }
  return stars;
}

export function isUnlocked(starsObj, index) {
  if (index === 0) return true;
  const prev = LEVELS[index - 1];
  return !!prev && (starsObj[prev.id] ?? 0) >= 1;
}
