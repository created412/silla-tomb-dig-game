// 마지막 도전의 순수 상태. 발굴 모델과 별 저장은 변경하지 않는다.
export const BOSS_STEPS = [
  { who: 'bird', title: '수상한 발자국을 찾아라', instruction: '새를 고르고, 발자국이 있는 풀숲을 눌러!', targets: ['bush0', 'bush1', 'bush2'], count: 1 },
  { who: 'frog', title: '막힌 길을 열어라', instruction: '두꺼비를 고르고, 흙더미 세 곳을 폴짝!', targets: ['soil0', 'soil1', 'soil2'], count: 3 },
  { who: 'turtle', title: '굴러오는 돌을 막아라', instruction: '거북을 고르고, 돌 세 개를 막아!', targets: ['rock0', 'rock1', 'rock2'], count: 3 },
  { who: 'snake', title: '도굴 장치를 멈춰라', instruction: '뱀을 고르고, 반짝이는 틈을 순서대로!', targets: ['gap0', 'gap1', 'gap2'], count: 3 },
];
const REQUIRED = ['crown', 'saddle', 'glass', 'ewer', 'belt'];
export const bossUnlocked = stars => REQUIRED.every(id => Number(stars?.[id]) >= 1);
export function createBoss(rng = Math.random) {
  return { step: 0, phase: 'briefing', hearts: 3, selected: null, done: [], footprint: Math.min(2, Math.max(0, Math.floor(rng() * 3))), mistakes: 0 };
}
export function startBossStep(s) { if (s.phase === 'briefing') s.phase = 'play'; }
function miss(s, reason) {
  s.hearts--; s.mistakes++;
  if (s.hearts === 0) s.phase = 'failed';
  return { type: s.phase === 'failed' ? 'failed' : 'miss', reason };
}
export function chooseBossFriend(s, who) {
  if (s.phase !== 'play') return { type: 'ignored' };
  if (who !== BOSS_STEPS[s.step].who) return miss(s, 'friend');
  s.selected = who; return { type: 'selected' };
}
export function hitBossTarget(s, target) {
  if (s.phase !== 'play') return { type: 'ignored' };
  if (!s.selected) return { type: 'choose' };
  if (s.done.includes(target)) return { type: 'ignored' };
  const step = BOSS_STEPS[s.step];
  const expected = s.step === 0 ? `bush${s.footprint}` : s.step === 3 ? `gap${s.done.length}` : null;
  if (!step.targets.includes(target) || (expected && target !== expected)) return miss(s, 'target');
  s.done.push(target);
  if (s.done.length === step.count) s.phase = 'clear';
  return { type: s.phase === 'clear' ? 'clear' : 'hit', target };
}
export function nextBossStep(s) {
  if (s.phase !== 'clear') return false;
  if (s.step === 3) { s.phase = 'won'; return true; }
  s.step++; s.phase = 'briefing'; s.selected = null; s.done = []; s.hearts = 3;
  return true;
}
export function retryBossStep(s) {
  if (s.phase !== 'failed') return false;
  s.phase = 'briefing'; s.hearts = 3; s.selected = null; s.done = []; return true;
}
export const BADGE_KEY = 'silla-guardian-v1';
export function loadBossBadge(storage) {
  try { const v = JSON.parse(storage?.getItem(BADGE_KEY) || 'null'); return v?.version === 1 && v?.earned === true; } catch { return false; }
}
export function saveBossBadge(storage, state) {
  if (state?.phase !== 'won' || !storage?.setItem) return false;
  try { storage.setItem(BADGE_KEY, JSON.stringify({ version: 1, earned: true })); return true; } catch { return false; }
}
