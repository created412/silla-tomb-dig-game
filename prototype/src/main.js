// 단계 기계: title → card → (wake) → dig → found | broken → result
import { topLayer } from './dig-model.js';
import { hintForLayer } from './hud.js';
import { layoutGrid, cellAt } from './grid.js';
import { LINES } from './lines.js';
import { createDialogue } from './dialogue.js';
import { createRenderer } from './renderer.js';
import { createSfx } from './sfx.js';
import { attachInput } from './input.js';
import { createEffects } from './effects.js';
import { LEVELS, ARTIFACTS, FRIENDS, COLS, ROWS } from './levels.js';
import {
  createChallenge, processEvents, afterRub, tapWood, usePower, stars, isLocked,
  WORM_FLEE_MS,
} from './challenge.js';
import { loadStars, saveStar, isUnlocked } from './stars-store.js';
import { ARTIFACT_STORIES } from './artifact-stories.js';

const TOP_PAD = 72, BOTTOM_PAD = 176, RIGHT_PAD = 126, SKY_BAND = 56; // CSS px. 아래 176 = 대사 상자(~60) + 토우(~100)
const REACTION_MS = 2000, ADVANCE_GUARD_MS = 150, REVEAL_MS = 2400;
const SKY_TIME = 0.15; // 하늘은 아침 해 고정 (시간 제한 없음)

const $ = id => document.getElementById(id);
const canvas = $('dig');
const el = {
  stage: $('stage'), hud: $('hud'), levelName: $('level-name'), hint: $('hint'), cracks: [...document.querySelectorAll('#cracks .crack')],
  powers: $('powers'), dialogue: $('dialogue'), speaker: $('speaker'), line: $('line'), tapHint: $('tap-hint'),
  title: $('title'), levels: $('levels'),
  card: $('card'), cardKicker: $('card-kicker'), cardTitle: $('card-title'), cardInfo: $('card-info'), cardFriends: $('card-friends'),
  btnStart: $('btn-start'), btnBack: $('btn-back'),
  result: $('result'), resultTitle: $('result-title'), resultSub: $('result-sub'), resultStars: [...document.querySelectorAll('#result-stars span')],
  resultStarsBox: $('result-stars'), btnRetry: $('btn-retry'), btnNext: $('btn-next'), btnStory: $('btn-story'), btnHome: $('btn-home'),
  story: $('story'), storyClose: $('story-close'), storyTitle: $('story-title'), storyMeta: $('story-meta'), storyWhat: $('story-what'), storyHello: $('story-hello'), storyNote: $('story-note'),
};

const renderer = createRenderer(canvas);
const effects = createEffects(canvas);
const sfx = createSfx();
const dialogue = createDialogue(LINES);
let storage = null; try { storage = localStorage; } catch { /* 저장 불가 */ }

let phase = 'title';
let levelIndex = 0, level = LEVELS[0], ch = null, layout = null;
let starsObj = loadStars(storage);
let selectedPower = null;
let wormCell = -1, wormUntil = -Infinity;
let foundAt = 0, resultKind = null, resultTimers = [];
let lastTouchedCell = -1, lastAdvanceAt = -Infinity;
let talkId = null, reactionTimer = null, wakeShown = false;
const now = () => performance.now();
// 받침에 따라 조사 고르기: josa('금관','을','를') → '을', josa('말다래','을','를') → '를'
function josa(word, withBatchim, without) {
  const code = word.charCodeAt(word.length - 1);
  const hangul = code >= 0xac00 && code <= 0xd7a3;
  return hangul && (code - 0xac00) % 28 !== 0 ? withBatchim : without;
}
const fillName = text => text.replace('{name}이', ARTIFACTS[level.id].name + josa(ARTIFACTS[level.id].name, '이', '')).replace('{name}', ARTIFACTS[level.id].name);

// ---------- 레이아웃 ----------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  layout = layoutGrid({
    width: canvas.width - RIGHT_PAD * dpr,
    height: canvas.height - (TOP_PAD + BOTTOM_PAD) * dpr,
    cols: COLS, rows: ROWS, padding: 16 * dpr,
  });
  layout.y0 += TOP_PAD * dpr;
}
window.addEventListener('resize', resize);
resize();

// ---------- 대사 ----------
function showLine(line, tappable) {
  if (!line) { el.dialogue.classList.add('hidden'); return; }
  el.dialogue.classList.remove('hidden');
  el.speaker.textContent = line.who === 'frog' ? '🐸' : '🐍';
  el.line.textContent = fillName(line.text);
  el.tapHint.classList.toggle('hidden', !tappable);
  renderer.speak(line.who);
}

// 반응 대사: 입력을 막지 않고 2초마다 한 줄씩 넘어가다 사라진다
function playReaction(id) {
  if (talkId) return;                 // 만담 중엔 끼어들지 않음
  if (!dialogue.playIfIdle(id)) return;
  showLine(dialogue.current(), false);
  scheduleReaction();
}
function scheduleReaction() {
  clearTimeout(reactionTimer);
  reactionTimer = setTimeout(() => {
    if (talkId) return;
    const line = dialogue.next();
    showLine(line, false);
    if (line) scheduleReaction();
  }, REACTION_MS);
}

// 꼭 보여야 하는 반응: 보이던 반응을 끊고 바로 띄운다 (지렁이, 해 경고)
function forceReaction(id) {
  if (talkId) return;
  clearTimeout(reactionTimer);
  dialogue.play(id);
  showLine(dialogue.current(), false);
  scheduleReaction();
}

// 만담: 탭으로 넘기고, 끝나면 onEnd
let talkEnd = null;
function playTalk(id, onEnd) {
  clearTimeout(reactionTimer); reactionTimer = null;
  talkId = id; talkEnd = onEnd;
  dialogue.play(id);
  showLine(dialogue.current(), true);
}
function advance() {
  const t = now();
  if (t - lastAdvanceAt < ADVANCE_GUARD_MS) return;
  lastAdvanceAt = t;
  if (!talkId) return;
  const line = dialogue.next();
  if (line) { showLine(line, true); return; }
  const end = talkEnd; talkId = null; talkEnd = null;
  showLine(null);
  end?.();
}
canvas.addEventListener('pointerdown', () => { if (talkId) advance(); });
el.dialogue.addEventListener('pointerdown', ev => { ev.stopPropagation(); advance(); });

// ---------- 단계 ----------
// 화면을 넘길 때 이전 화면의 타이머·대사 큐가 따라오지 않게 전부 비운다
function clearTransient() {
  for (const t of resultTimers) clearTimeout(t); resultTimers = [];
  clearTimeout(reactionTimer); reactionTimer = null;
  talkId = null; talkEnd = null;
  dialogue.play('__none__');
  showLine(null);
}
function setPhase(next) {
  phase = next;
  el.stage.dataset.phase = phase;
  el.title.classList.toggle('hidden', phase !== 'title');
  el.card.classList.toggle('hidden', phase !== 'card');
  el.hud.classList.toggle('hidden', !(phase === 'dig' || phase === 'wake'));
  el.powers.classList.toggle('hidden', phase !== 'dig');
  el.result.classList.toggle('hidden', phase !== 'result');
  if (phase === 'title' || phase === 'card') clearTransient();
}

function starText(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }

function buildLevels() {
  el.levels.innerHTML = '';
  LEVELS.forEach((l, i) => {
    const b = document.createElement('button');
    b.className = 'level'; b.dataset.index = i;
    const open = isUnlocked(starsObj, i);
    b.disabled = !open;
    b.innerHTML = `<span class="num">무덤 ${i + 1}</span><span class="name">${open ? ARTIFACTS[l.id].name : '🔒'}</span><span class="tomb">${l.tomb}</span><span class="stars">${starText(starsObj[l.id] ?? 0)}</span>`;
    b.addEventListener('click', () => { sfx.unlock(); openCard(i); });
    el.levels.appendChild(b);
  });
}

function openCard(i) {
  levelIndex = i; level = LEVELS[i];
  el.cardKicker.textContent = `무덤 ${i + 1} · ${level.tomb}`;
  const name = ARTIFACTS[level.id].name;
  el.cardTitle.textContent = `${name}${josa(name, '을', '를')} 찾아라`;
  el.cardInfo.textContent = `🪱 지렁이 ${level.worms}마리 · ${level.rockCoverage ? `🪨 돌 ${Math.round(level.rockCoverage * 100)}%` : '🪨 돌 없음'} · 지금까지 ${starText(starsObj[level.id] ?? 0)}`;
  el.cardFriends.innerHTML = Object.entries(FRIENDS).map(([who, f]) =>
    `<span class="${level.friends.includes(who) ? '' : 'locked'}">${f.emoji} ${f.name} · ${level.friends.includes(who) ? f.power : '아직 안 와'}</span>`).join('');
  renderer.setScene(level.scene === 2);
  setPhase('card');
}

function buildPowers() {
  el.powers.innerHTML = '';
  for (const who of level.friends) {
    const f = FRIENDS[who];
    const b = document.createElement('button');
    b.className = 'power'; b.dataset.who = who; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="emoji">${f.emoji}</span><span class="name">${f.name}</span><span class="desc">${f.power}</span>`;
    b.addEventListener('click', () => onPowerButton(who));
    el.powers.appendChild(b);
  }
}

function startLevel() {
  clearTransient();
  ch = createChallenge(level, Math.random);
  renderer.reset();
  renderer.setArtifact(level.id);
  renderer.setScene(level.scene === 2);
  renderer.setCrew(level.friends);
  buildPowers();
  el.cracks.forEach(c => c.classList.remove('on'));
  el.levelName.textContent = `무덤 ${levelIndex + 1} · ${ARTIFACTS[level.id].name}`;
  selectedPower = null; wormCell = -1; wormUntil = -Infinity; lastTouchedCell = -1; resultKind = null;
  if (levelIndex === 0 && !wakeShown) {
    wakeShown = true;
    setPhase('wake');
    playTalk('wake', () => setPhase('dig'));
  } else {
    setPhase('dig');
  }
}

// ---------- 토우 능력 ----------
function setSelectedPower(who) {
  selectedPower = who;
  for (const b of el.powers.querySelectorAll('button.power')) b.setAttribute('aria-pressed', String(b.dataset.who === who));
  updateHud(now());
}
function onPowerButton(who) {
  if (phase !== 'dig' || !ch) return;
  sfx.unlock();
  if (ch.powers[who] !== 1) { playReaction('powerUsed'); return; }
  if (selectedPower === who) { setSelectedPower(null); return; }
  if (who === 'bird') { applyPower('bird', -1); return; }
  setSelectedPower(who);
}
function applyPower(who, cell) {
  const t = now();
  const { ok, events } = usePower(ch, who, cell, t);
  setSelectedPower(null);
  if (!ok) {
    playReaction({ frog: 'powerMissFrog', turtle: 'powerMissTurtle', snake: 'powerMissSnake' }[who] ?? 'powerUsed');
    return;
  }
  sfx.power();
  renderer.speak(who);
  renderer.react('glimmer', t);
  el.powers.querySelector(`button.power[data-who="${who}"]`)?.setAttribute('data-used', '1');
  if (who !== 'bird') {
    const r0 = Math.floor(cell / COLS), c0 = cell % COLS;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = r0 + dr, c = c0 + dc;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      renderer.addDust(r * COLS + c, layout, t, who === 'turtle' ? 'rock' : who === 'snake' ? 'wood' : 'soil');
    }
    renderer.shake(who === 'turtle' ? 250 : 120, t);
  }
  handle(events);
}
canvas.addEventListener('pointerdown', e => {
  if (phase !== 'dig' || !selectedPower || !ch || isLocked(ch, now())) return;
  const rect = canvas.getBoundingClientRect();
  const cell = cellAt(layout, (e.clientX - rect.left) * canvas.width / rect.width, (e.clientY - rect.top) * canvas.height / rect.height);
  if (cell < 0) return;
  // 이 제스처는 능력 사용으로 끝난다. 뒤에 등록된 발굴 입력(input.js)이 같은 손가락을 탭으로 해석하면 안 된다.
  e.stopImmediatePropagation();
  applyPower(selectedPower, cell);
});

// ---------- 발굴 입력 ----------
attachInput(canvas, {
  getLayout: () => layout,
  getState: () => (phase === 'dig' && ch && !selectedPower && !isLocked(ch, now()) ? ch.dig : null),
  onEvents: ev => handle(processEvents(ch, ev, now())),
  onRub: cell => { const t = now(); renderer.addDust(cell, layout, t, 'soil'); sfx.rub(); handle(afterRub(ch, cell, t)); },
  onBrush: cell => { renderer.addDust(cell, layout, now(), 'wood'); sfx.brush(); },
  onTouchCell: cell => { lastTouchedCell = cell; },
  onRockDrag: () => playReaction('rockDrag'),
  onTap: (cell, t) => handle(tapWood(ch, cell, t)),
});

function handle(events) {
  if (!events || !events.length || !ch) return;
  const t = now();
  for (const e of events) {
    switch (e.type) {
      case 'tooHard': if (!ch.dig.artifactCells.has(e.cell)) { renderer.react('tooHard', t); renderer.speak('frog'); playReaction('tooHard'); } break;
      case 'collapse': renderer.shake(300, t); sfx.collapse(); renderer.addDust(e.cell, layout, t, 'collapse'); if (!ch.dig.artifactCells.has(e.cell)) playReaction('collapse'); break;
      case 'glimmer': sfx.glimmer(); renderer.react('glimmer', t); playReaction('glimmer'); break;
      case 'chip': sfx.tap(); renderer.addDust(e.cell, layout, t, 'rock'); break;
      case 'rockBroken': sfx.crack(); renderer.addDust(e.cell, layout, t, 'rock'); break;
      case 'artifactCell': sfx.tap(); break;
      case 'warn': sfx.tap(); renderer.react('tooHard', t); renderer.speak('frog'); forceReaction('warn'); el.cracks.forEach(c => c.classList.add('warn')); setTimeout(() => el.cracks.forEach(c => c.classList.remove('warn')), 600); break;
      case 'crack': onCrack(e, t); break;
      case 'broken': onBroken(t); break;
      case 'worm': onWorm(e.cell, t); break;
      case 'found': onFound(t); break;
    }
  }
}

function onCrack(e, t) {
  sfx.crackHit();
  renderer.shake(250, t);
  renderer.react('tooHard', t);
  renderer.speak('frog');
  el.cracks.forEach((c, k) => c.classList.toggle('on', k < e.cracks));
  if (e.cracks === 1) forceReaction('crack1');
  else if (e.cracks === 2) forceReaction('crack2');
}

function onWorm(cell, t) {
  sfx.worm();
  wormCell = cell; wormUntil = t + WORM_FLEE_MS;
  setSelectedPower(null); // updateHud도 함께 호출됨 → "도망갔다" 안내가 바로 뜬다
  renderer.react('tooHard', t);
  renderer.speak('frog');
  forceReaction('worm');
}

function onFound(t) {
  foundAt = t;
  setSelectedPower(null);
  renderer.flash(500, t);
  renderer.react('artifactRevealed', t);
  sfx.found();
  setPhase('found');
  clearTimeout(reactionTimer); showLine(null);
  resultTimers.push(setTimeout(() => playTalk('found', () => showResult('found')), REVEAL_MS));
}

function onBroken(t) {
  setSelectedPower(null);
  renderer.shake(600, t);
  renderer.react('collapse', t);
  sfx.shatter();
  for (const cell of ch.dig.artifactCells) { renderer.addDust(cell, layout, t, 'gold'); renderer.addDust(cell, layout, t, 'rock'); }
  setPhase('broken');
  clearTimeout(reactionTimer); showLine(null);
  resultTimers.push(setTimeout(() => playTalk('broken', () => showResult('broken')), 800));
}

function showResult(kind) {
  resultKind = kind;
  const name = ARTIFACTS[level.id].name;
  el.resultStars.forEach(s => s.classList.remove('on'));
  el.resultStarsBox.classList.toggle('hidden', kind !== 'found');
  el.btnNext.classList.toggle('hidden', !(kind === 'found' && levelIndex < LEVELS.length - 1));
  el.btnStory.classList.toggle('hidden', kind !== 'found');
  if (kind === 'found') {
    const n = stars(ch);
    starsObj = saveStar(storage, starsObj, level.id, n);
    el.resultTitle.textContent = `찾았다! ${name}`;
    el.resultSub.textContent = n === 3 ? '금 하나 없이 찾았어. 완벽!' : n === 2 ? '금이 조금 갔지만 찾았어.' : '겨우 찾았어. 다음엔 더 살살!';
    for (let k = 0; k < n; k++) resultTimers.push(setTimeout(() => { el.resultStars[k].classList.add('on'); sfx.star(); }, 400 + k * 500));
    resultTimers.push(setTimeout(() => playReaction(`star${n}`), 400 + n * 500 + 200));
  } else {
    el.resultTitle.textContent = `${name}${josa(name, '이', '가')} 깨졌어…`;
    el.resultSub.textContent = '유물 위에서는 두드리지 말고, 세게 문지르지 마. 다시 파면 돼!';
  }
  setPhase('result');
}

// ---------- 버튼 ----------
el.btnStart.addEventListener('click', () => { sfx.unlock(); startLevel(); });
el.btnBack.addEventListener('click', () => { buildLevels(); setPhase('title'); });
el.btnRetry.addEventListener('click', () => { sfx.unlock(); startLevel(); });
el.btnNext.addEventListener('click', () => { sfx.unlock(); openCard(levelIndex + 1); });
el.btnHome.addEventListener('click', () => { buildLevels(); setPhase('title'); });
el.btnStory.addEventListener('click', () => {
  const s = ARTIFACT_STORIES[level.id]; if (!s) return;
  el.storyTitle.textContent = ARTIFACTS[level.id].name;
  el.storyMeta.textContent = [s.period, s.age, s.place].filter(Boolean).join(' · ');
  el.storyWhat.textContent = s.what;
  el.storyHello.textContent = (s.hello ?? []).join(' ');
  el.storyNote.textContent = s.note ?? '';
  el.story.showModal();
});
el.storyClose.addEventListener('click', () => el.story.close());

// ---------- HUD ----------
function updateHud(t) {
  if (!ch) return;
  if (isLocked(ch, t)) el.hint.textContent = '🐸 도망갔다! 잠깐만…';
  else if (selectedPower) { const f = FRIENDS[selectedPower]; el.hint.textContent = `${f.emoji} ${f.name}: 어디에 쓸까? 땅을 눌러!`; }
  else el.hint.textContent = hintForLayer(lastTouchedCell >= 0 ? topLayer(ch.dig, lastTouchedCell) : 'soil');
}

// ---------- 루프 ----------
function rendererPhase() {
  if (phase === 'title' || phase === 'card') return 'title';
  if (phase === 'found' || (phase === 'result' && resultKind === 'found')) return 'found';
  return 'dig';
}
function frame(t) {
  if (phase === 'dig' && ch) updateHud(t);
  const rp = rendererPhase();
  renderer.draw(rp === 'title' ? null : ch?.dig ?? null, layout, t, rp, t - foundAt);
  if (rp !== 'title' && ch) {
    effects.drawSky(SKY_TIME, SKY_BAND, t);
    if (rp === 'dig') {
      if (ch.hintUntil > t) effects.drawHint([...ch.dig.artifactCells], layout, t);
      effects.drawCracks(ch.crackCells, layout, t);
      effects.drawWorm(wormCell, layout, t, wormUntil);
    }
  }
  requestAnimationFrame(frame);
}
buildLevels();
setPhase('title');
requestAnimationFrame(frame);

// 교사·검증용 훅 (콘솔에서 sillaDebug.challenge 로 현재 판 상태를 본다)
window.sillaDebug = { get challenge() { return ch; }, get phase() { return phase; }, get layout() { return layout; } };
