// 단계 기계: title → card → (wake) → dig → found | broken → result
// 발굴 중 4컷 "기억 조각"이 끼어들고, 처음 깬 무덤 뒤에는 새 토우 합류 장면이 나온다.
import { topLayer } from './dig-model.js';
import { hintForLayer } from './hud.js';
import { layoutGrid, cellAt } from './grid.js';
import { LINES } from './lines.js';
import { createDialogue } from './dialogue.js';
import { createRenderer } from './renderer.js';
import { createSfx } from './sfx.js';
import { attachInput } from './input.js';
import { createEffects } from './effects.js';
import { LEVELS, ARTIFACTS, FRIENDS, TOWOO_ABOUT, COLS, ROWS } from './levels.js';
import {
  createChallenge, processEvents, afterRub, tapWood, usePower, stars, isLocked,
  WORM_FLEE_MS,
} from './challenge.js';
import { loadStars, saveStar, isUnlocked } from './stars-store.js';
import { ARTIFACT_STORIES } from './artifact-stories.js';
import { COMICS } from './comics.js';
import { paintDom, comicSheet } from './art-dom.js?v=guardian-1';
import { createVoicePlayer } from './voice-player.js?v=guardian-1';
import { createBossView } from './boss.js';
import { bossUnlocked, loadBossBadge } from './boss-model.js';
import { createMusicPlayer } from './music-player.js';

const TOP_PAD = 72, BOTTOM_PAD = 176, RIGHT_PAD = 126, SKY_BAND = 56; // CSS px. 아래 176 = 대사 상자(~60) + 토우(~100)
const ADVANCE_GUARD_MS = 150, REVEAL_MS = 2400, PANEL_MIN_MS = 1500;
const SKY_TIME = 0.15; // 하늘은 아침 해 고정 (시간 제한 없음)

const $ = id => document.getElementById(id);
const canvas = $('dig');
const el = {
  stage: $('stage'), hud: $('hud'), levelName: $('level-name'), hint: $('hint'), cracks: [...document.querySelectorAll('#cracks .crack')],
  powers: $('powers'), dialogue: $('dialogue'), speaker: $('speaker'), line: $('line'),
  title: $('title'), levels: $('levels'), shelf: $('shelf'), btnDex: $('btn-dex'),
  card: $('card'), cardKicker: $('card-kicker'), cardTitle: $('card-title'), cardInfo: $('card-info'), cardFriends: $('card-friends'),
  btnStart: $('btn-start'), btnBack: $('btn-back'),
  result: $('result'), resultArt: $('result-art'), resultTitle: $('result-title'), resultSub: $('result-sub'), resultStars: [...document.querySelectorAll('#result-stars span')],
  resultStarsBox: $('result-stars'), btnRetry: $('btn-retry'), btnNext: $('btn-next'), btnStory: $('btn-story'), btnHome: $('btn-home'),
  story: $('story'), storyClose: $('story-close'), storyTitle: $('story-title'), storyMeta: $('story-meta'), storyArt: $('story-art'), storyWhat: $('story-what'), storyHello: $('story-hello'), storyNote: $('story-note'),
  comic: $('comic'), comicTitle: $('comic-title'), comicCanvas: $('comic-canvas'), comicWho: $('comic-who'), comicText: $('comic-text'), comicChoices: $('comic-choices'), comicNext: $('comic-next'),
  join: $('join'), joinActor: $('join-actor'), joinName: $('join-name'), joinPower: $('join-power'), joinIntro: $('join-intro'), joinWhen: $('join-when'), joinOk: $('join-ok'),
  dex: $('dex'), dexClose: $('dex-close'), dexAbout: $('dex-about-text'), dexCards: $('dex-cards'),
};

const renderer = createRenderer(canvas);
const effects = createEffects(canvas);
const sfx = createSfx();
const dialogue = createDialogue(LINES);
// 화면 안의 소리 제어에 음악 버튼을 함께 둔다. 발굴판의 여백은 바꾸지 않는다.
for (const host of document.querySelectorAll('.voice-controls, .title-row, #card .row, .boss-header, .boss-award .row, #dex .dex-panel')) {
  const button = document.createElement('button');
  button.type = 'button'; button.dataset.musicToggle = ''; button.className = 'music-toggle';
  if (host.classList.contains('boss-header')) button.classList.add('music-compact');
  host.append(button);
}
function showMusicState({ enabled, status }) {
  document.querySelectorAll('[data-music-toggle]').forEach(button => {
    const label = !enabled ? '음악 꺼짐' : ['blocked', 'unavailable'].includes(status) ? '음악 다시 재생' : '음악 켜짐';
    button.textContent = button.classList.contains('music-compact') ? (enabled ? '♫' : '♪') : `♪ ${label}`;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', `${label} · 배경음악 ${['blocked', 'unavailable'].includes(status) && enabled ? '다시 재생' : enabled ? '끄기' : '켜기'}`);
    button.title = label;
  });
}
const music = createMusicPlayer(showMusicState);
showMusicState({ enabled: true, status: 'ready' });
document.querySelectorAll('[data-music-toggle]').forEach(button => button.addEventListener('click', () => music.toggle()));
document.addEventListener('pointerdown', e => { if (!e.target.closest('[data-music-toggle]')) music.unlock(); });
document.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key) && !e.target.closest('[data-music-toggle]')) music.unlock(); });
document.addEventListener('visibilitychange', () => music.setHidden(document.hidden));
music.setHidden(document.hidden);
const voice = createVoicePlayer(({ muted, status }) => {
  music.setSpeaking(!muted && ['loading', 'playing'].includes(status));
  document.querySelectorAll('[data-voice-mute]').forEach(b => { b.textContent = muted ? '소리 꺼짐' : '소리 켜짐'; b.setAttribute('aria-pressed', String(muted)); });
  document.querySelectorAll('[data-voice-status]').forEach(e => { e.textContent = muted ? '' : status === 'playing' ? '듣는 중…' : status === 'paused' ? '다시 듣기를 눌러 줘' : status === 'unavailable' ? '목소리를 불러오지 못했어' : ''; });
  document.querySelectorAll('[data-voice-replay]').forEach(b => { b.disabled = muted; });
});
document.querySelectorAll('[data-voice-replay]').forEach(b => b.addEventListener('click', () => voice.replay()));
document.querySelectorAll('[data-voice-mute]').forEach(b => b.addEventListener('click', () => voice.toggleMute()));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let storage = null; try { storage = localStorage; } catch { /* 저장 불가 */ }
const bossView = createBossView({ voice, sfx, storage, onExit: () => { buildLevels(); setPhase('title'); $('btn-boss').focus({ preventScroll: true }); } });

let phase = 'title';
let levelIndex = 0, level = LEVELS[0], ch = null, layout = null;
let starsObj = loadStars(storage);
let selectedPower = null;
let wormCell = -1, wormUntil = -Infinity;
let foundAt = 0, resultKind = null, resultTimers = [];
let lastTouchedCell = -1, lastAdvanceAt = -Infinity;
let talkId = null, wakeShown = false, lineIndex = 0, reactionId = null;
let glimmerShown = false;
let panelsShown = 0, comicOpen = false, comicTimer = null, comicOnClose = null; // 4컷
let joinQueue = [], joinOnDone = null;                                           // 합류 장면
const now = () => performance.now();
// 받침에 따라 조사 고르기: josa('금관','을','를') → '을', josa('말다래','을','를') → '를'
function josa(word, withBatchim, without) {
  const code = word.charCodeAt(word.length - 1);
  const hangul = code >= 0xac00 && code <= 0xd7a3;
  return hangul && (code - 0xac00) % 28 !== 0 ? withBatchim : without;
}
const fillName = text => text.replace('{name}이', ARTIFACTS[level.id].name + josa(ARTIFACTS[level.id].name, '이', '')).replace('{name}', ARTIFACTS[level.id].name);
const inputBlocked = () => comicOpen || !el.dialogue.classList.contains('hidden') || !el.join.classList.contains('hidden') || !el.dex.classList.contains('hidden');

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
function showLine(line) {
  voice.stop();
  if (!line) { el.dialogue.classList.add('hidden'); return; }
  const id = talkId || reactionId;
  el.dialogue.classList.remove('hidden');
  el.speaker.textContent = FRIENDS[line.who]?.name || '토우 친구';
  el.line.textContent = fillName(line.text);
  $('dialogue-actor').dataset.actor = line.who;
  $('dialogue-page').textContent = `${lineIndex + 1} / ${LINES[id]?.length || 1}`;
  $('dialogue-scene').dataset.scene = id === 'wake' ? (lineIndex < 3 ? '0' : '1') : id === 'found' || id?.startsWith('star') ? '3' : id === 'glimmer' ? '1' : '2';
  $('dialogue-title').textContent = id === 'wake' ? '아주 오래 잠들었던 작은 친구들' : id === 'found' ? '찾았다! 되살아나는 기억' : id?.startsWith('star') ? '함께해서 해냈어!' : '토우 친구의 한마디';
  $('dialogue-next').textContent = lineIndex + 1 < (LINES[id]?.length || 1) ? '다음 이야기 →' : (phase === 'wake' || phase === 'dig') ? '발굴하러 가자 →' : '계속하기 →';
  $('dialogue-next').focus({ preventScroll: true });
  renderer.speak(line.who);
  voice.say(id === 'found' && lineIndex === 0 ? `found-${level.id}` : `line-${id}-${lineIndex}`);
}

// 모든 대사는 직접 넘긴다. 짧은 반응도 읽는 동안 발굴 입력을 막는다.
function playReaction(id) {
  if (talkId || comicOpen || !el.join.classList.contains('hidden') || el.story.open) return;
  if (id === 'glimmer' && glimmerShown) return;
  if (!dialogue.playIfIdle(id)) return;
  if (id === 'glimmer') glimmerShown = true;
  reactionId = id; lineIndex = 0;
  showLine(dialogue.current());
}

// 꼭 보여야 하는 반응: 보이던 반응을 끊고 바로 띄운다 (지렁이, 금)
function forceReaction(id) {
  if (talkId) return;
  reactionId = id; lineIndex = 0;
  dialogue.play(id);
  showLine(dialogue.current());
}

// 만담: 탭으로 넘기고, 끝나면 onEnd
let talkEnd = null;
function playTalk(id, onEnd) {
  reactionId = null; lineIndex = 0;
  talkId = id; talkEnd = onEnd;
  dialogue.play(id);
  showLine(dialogue.current());
}
function advance() {
  const t = now();
  if (t - lastAdvanceAt < ADVANCE_GUARD_MS) return;
  lastAdvanceAt = t;
  if (el.dialogue.classList.contains('hidden')) return;
  const line = dialogue.next();
  lineIndex++;
  if (line) { showLine(line); return; }
  const end = talkEnd; talkId = null; talkEnd = null; reactionId = null;
  showLine(null);
  end?.();
}
$('dialogue-next').addEventListener('click', advance);
// 키보드 탭도 현재 이야기 안에 머문다.
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const overlay = [el.dialogue, el.comic, el.join].find(x => !x.classList.contains('hidden'));
  if (!overlay) return;
  const buttons = [...overlay.querySelectorAll('button:not(:disabled)')].filter(b => b.offsetParent !== null);
  const first = buttons[0], last = buttons.at(-1);
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
});

// ---------- 단계 ----------
// 화면을 넘길 때 이전 화면의 타이머·대사 큐·만화·합류가 따라오지 않게 전부 비운다
function clearTransient() {
  for (const t of resultTimers) clearTimeout(t); resultTimers = [];
  reactionId = null;
  clearTimeout(comicTimer); comicTimer = null;
  talkId = null; talkEnd = null; comicOnClose = null; joinQueue = []; joinOnDone = null;
  comicOpen = false; el.comic.classList.add('hidden'); el.join.classList.add('hidden');
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
const unlockedCount = () => LEVELS.filter((_, i) => isUnlocked(starsObj, i)).length;

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
  // 찾은 유물 선반
  el.shelf.innerHTML = '';
  for (const l of LEVELS) if ((starsObj[l.id] ?? 0) > 0) {
    const c = document.createElement('canvas'); c.dataset.art = l.id; c.title = ARTIFACTS[l.id].name; el.shelf.appendChild(c);
  }
  const unlocked = bossUnlocked(starsObj), badge = loadBossBadge(storage);
  $('btn-boss').disabled = !unlocked;
  $('btn-boss').querySelector('strong').textContent = unlocked ? (badge ? '✦ 유적 수호대 · 다시 도전' : '유적을 지켜라!') : '🔒 유적을 지켜라';
  $('btn-boss').querySelector('small').textContent = unlocked ? '도굴꾼 등장! 네 친구의 힘을 모아!' : '유물 다섯 개를 찾으면 열려!';
}

function openBoss() {
  if (!bossUnlocked(starsObj)) return;
  clearTransient(); setSelectedPower(null); sfx.unlock(); setPhase('boss'); bossView.open();
}
$('btn-boss').addEventListener('click', openBoss);

function openCard(i) {
  levelIndex = i; level = LEVELS[i];
  el.cardKicker.textContent = `무덤 ${i + 1} · ${level.tomb}`;
  const name = ARTIFACTS[level.id].name;
  el.cardTitle.textContent = `${name}${josa(name, '을', '를')} 찾아라`;
  el.cardInfo.textContent = `🪱 지렁이 ${level.worms}마리 · ${level.rockCoverage ? `🪨 돌 ${Math.round(level.rockCoverage * 100)}%` : '🪨 돌 없음'} · 지금까지 ${starText(starsObj[level.id] ?? 0)}`;
  el.cardFriends.innerHTML = Object.entries(FRIENDS).map(([who, f]) => {
    const here = level.friends.includes(who);
    return `<span class="chip ${here ? '' : 'locked'}"><canvas data-actor="${who}" data-seed="${who.length * 97}" ${here ? '' : 'data-locked="1"'}></canvas><span>${f.name}<small>${here ? f.power : `무덤 ${f.joinsAt + 1}부터`}</small></span></span>`;
  }).join('');
  renderer.setScene(level.scene === 2);
  comicSheet(level.id); // 4컷 그림 미리 불러오기
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
  glimmerShown = false;
  renderer.reset();
  renderer.setArtifact(level.id);
  renderer.setScene(level.scene === 2);
  renderer.setCrew(level.friends);
  buildPowers();
  el.cracks.forEach(c => c.classList.remove('on'));
  el.levelName.textContent = `무덤 ${levelIndex + 1} · ${ARTIFACTS[level.id].name}`;
  selectedPower = null; wormCell = -1; wormUntil = -Infinity; lastTouchedCell = -1; resultKind = null; panelsShown = 0;
  if (levelIndex === 0 && !wakeShown) {
    wakeShown = true;
    setPhase('wake');
    playTalk('wake', () => setPhase('dig'));
  } else {
    setPhase('dig');
  }
}

// ---------- 4컷 기억 조각 ----------
// n: 0~2 이야기 컷, 3 질문 컷. 닫히면 onClose.
function showPanel(n, onClose) {
  voice.stop();
  const comic = COMICS[level.id]; if (!comic) { onClose?.(); return; }
  comicOpen = true; comicOnClose = onClose; panelsShown = Math.max(panelsShown, n + 1);
  setSelectedPower(null);
  el.comicTitle.textContent = `${comic.title} · ${n + 1} / 4`;
  el.comicCanvas.dataset.comic = level.id; el.comicCanvas.dataset.panel = String(n);
  el.comicChoices.innerHTML = ''; el.comicChoices.classList.toggle('hidden', n !== 3);
  el.comicNext.classList.toggle('hidden', n === 3);
  el.comic.classList.remove('hidden');
  sfx.glimmer();
  if (n < 3) {
    const p = comic.panels[n];
    el.comicWho.textContent = FRIENDS[p.who].name; el.comicText.textContent = p.text;
    $('comic-actor').dataset.actor = p.who;
    voice.say(`comic-${level.id}-${n}`);
    el.comicNext.disabled = true;
    clearTimeout(comicTimer);
    comicTimer = setTimeout(() => { el.comicNext.disabled = false; el.comicNext.focus({ preventScroll: true }); }, PANEL_MIN_MS);
  } else {
    el.comicWho.textContent = '같이 생각해 볼까?'; el.comicText.textContent = comic.question;
    $('comic-actor').dataset.actor = 'bird';
    voice.say(`question-${level.id}`);
    comic.choices.forEach((c, k) => {
      const b = document.createElement('button'); b.textContent = c.text; b.dataset.k = k;
      b.addEventListener('click', () => answerChoice(k));
      el.comicChoices.appendChild(b);
    });
    el.comicChoices.querySelector('button')?.focus({ preventScroll: true });
  }
}
function answerChoice(k) {
  const comic = COMICS[level.id], c = comic.choices[k];
  const b = el.comicChoices.querySelector(`button[data-k="${k}"]`);
  if (!b || b.disabled) return;
  el.comicWho.textContent = FRIENDS[c.gag.who].name; el.comicText.textContent = c.gag.text;
  $('comic-actor').dataset.actor = c.gag.who;
  voice.say(`answer-${level.id}-${k}`);
  if (c.right) {
    sfx.found();
    b.dataset.right = '1';
    for (const x of el.comicChoices.querySelectorAll('button')) x.disabled = true;
    el.comicNext.textContent = '계속 ▶'; el.comicNext.disabled = false; el.comicNext.classList.remove('hidden');
  } else {
    sfx.collapse();
    if (ch) ch.quizMiss = true;
    b.dataset.wrong = '1'; b.disabled = true;
  }
}
function closePanel() {
  voice.stop();
  el.comic.classList.add('hidden'); comicOpen = false;
  el.comicNext.textContent = '계속 발굴하기 →';
  const f = comicOnClose; comicOnClose = null; f?.();
}
el.comicNext.addEventListener('click', () => { if (!el.comicNext.disabled) closePanel(); });

// 발굴 중 컷 열기 조건: 1컷 = 유물 칸 하나가 나무까지 드러남, 2컷 = 유물 3칸 이상 완전히 드러남
function checkComicCues() {
  if (!ch || inputBlocked() || phase !== 'dig') return;
  if (panelsShown === 0) {
    for (const i of ch.dig.artifactCells) if (ch.dig.soil[i] === 0 && ch.dig.rock[i] === 0) { showPanel(0); return; }
  } else if (panelsShown === 1 && ch.dig.revealed.size >= 3) {
    showPanel(1);
  }
}

// ---------- 합류 장면 ----------
function showJoin(who, onDone) {
  const f = FRIENDS[who];
  el.joinActor.dataset.actor = who;
  el.joinName.textContent = `${f.emoji} ${f.name}`;
  el.joinPower.textContent = `능력: ${f.power} — ${f.desc}`;
  el.joinIntro.textContent = f.intro.join(' ');
  el.joinWhen.textContent = `무덤 ${f.joinsAt + 1}부터 오른쪽 버튼에서 나를 눌러 봐.`;
  el.join.classList.remove('hidden');
  voice.say(`join-${who}`);
  el.joinOk.focus({ preventScroll: true });
  sfx.found();
  joinOnDone = onDone;
}
el.joinOk.addEventListener('click', () => {
  voice.stop();
  el.join.classList.add('hidden');
  const next = joinQueue.shift();
  if (next) showJoin(next, joinOnDone); else { const f = joinOnDone; joinOnDone = null; f?.(); }
});
// 이번 판을 처음 깼고 다음 무덤에 새 친구가 있으면 합류 장면을 큐에 담는다
function queueJoins(prevStars) {
  joinQueue = [];
  if (prevStars > 0 || levelIndex + 1 >= LEVELS.length) return;
  const next = LEVELS[levelIndex + 1];
  for (const who of next.friends) if (!level.friends.includes(who)) joinQueue.push(who);
}
function runJoins(onDone) {
  const first = joinQueue.shift();
  if (first) showJoin(first, onDone); else onDone();
}

// ---------- 도감 ----------
function openDex() {
  el.dexAbout.innerHTML = TOWOO_ABOUT.map(t => `<p>${t}</p>`).join('');
  const open = unlockedCount();
  el.dexCards.innerHTML = Object.entries(FRIENDS).map(([who, f]) => {
    const met = f.joinsAt < open;
    return `<div class="dex-card ${met ? '' : 'locked'}"><canvas data-actor="${who}" data-seed="${who.length * 131}" ${met ? '' : 'data-locked="1"'}></canvas><h3>${met ? `${f.emoji} ${f.name}` : '???'}</h3><div class="power">${met ? f.power : `무덤 ${f.joinsAt + 1}에서 만나`}</div><p>${met ? f.desc : '아직 흙 속에서 자고 있어.'}</p>${met ? `<p class="real">${f.real}</p>` : ''}</div>`;
  }).join('');
  el.dex.classList.remove('hidden');
}
el.btnDex.addEventListener('click', () => { sfx.unlock(); openDex(); });
el.dexClose.addEventListener('click', () => el.dex.classList.add('hidden'));

// ---------- 토우 능력 ----------
function setSelectedPower(who) {
  selectedPower = who;
  for (const b of el.powers.querySelectorAll('button.power')) b.setAttribute('aria-pressed', String(b.dataset.who === who));
  updateHud(now());
}
function onPowerButton(who) {
  if (phase !== 'dig' || !ch || inputBlocked()) return;
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
  if (phase !== 'dig' || !selectedPower || !ch || isLocked(ch, now()) || inputBlocked()) return;
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
  getState: () => (phase === 'dig' && ch && !selectedPower && !isLocked(ch, now()) && !inputBlocked() ? ch.dig : null),
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

// 찾았다: 연출 → 3컷 → 만담 → 4컷(질문) → (합류) → 결과
function onFound(t) {
  foundAt = t;
  setSelectedPower(null);
  renderer.flash(500, t);
  renderer.react('artifactRevealed', t);
  sfx.found();
  setPhase('found');
  dialogue.play('__none__'); reactionId = null; showLine(null);
  const prevStars = starsObj[level.id] ?? 0;
  resultTimers.push(setTimeout(() => {
    showPanel(2, () => playTalk('found', () => showPanel(3, () => {
      queueJoins(prevStars);
      runJoins(() => showResult('found'));
    })));
  }, REVEAL_MS));
}

function onBroken(t) {
  setSelectedPower(null);
  renderer.shake(600, t);
  renderer.react('collapse', t);
  sfx.shatter();
  for (const cell of ch.dig.artifactCells) { renderer.addDust(cell, layout, t, 'gold'); renderer.addDust(cell, layout, t, 'rock'); }
  setPhase('broken');
  dialogue.play('__none__'); reactionId = null; showLine(null);
  resultTimers.push(setTimeout(() => playTalk('broken', () => showResult('broken')), 800));
}

function showResult(kind) {
  resultKind = kind;
  const name = ARTIFACTS[level.id].name;
  el.resultStars.forEach(s => s.classList.remove('on'));
  el.resultStarsBox.classList.toggle('hidden', kind !== 'found');
  el.resultArt.classList.toggle('hidden', kind !== 'found');
  el.resultArt.dataset.art = level.id;
  el.btnNext.classList.toggle('hidden', kind !== 'found');
  el.btnNext.textContent = levelIndex === LEVELS.length - 1 ? '마지막 도전 · 유적 지키기 ▶' : '다음 무덤 ▶';
  el.btnStory.classList.toggle('hidden', kind !== 'found');
  if (kind === 'found') {
    const n = stars(ch);
    starsObj = saveStar(storage, starsObj, level.id, n);
    el.resultTitle.textContent = `찾았다! ${name}`;
    el.resultSub.textContent = n === 3 ? '금 하나 없이, 질문도 맞혔어. 완벽!' : ch.quizMiss && ch.cracks === 0 ? '찾았어! 다음엔 기억 조각을 잘 봐.' : n === 2 ? '금이 조금 갔지만 찾았어.' : '겨우 찾았어. 다음엔 더 살살!';
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
el.btnNext.addEventListener('click', () => { sfx.unlock(); if (levelIndex === LEVELS.length - 1) openBoss(); else openCard(levelIndex + 1); });
el.btnHome.addEventListener('click', () => { buildLevels(); setPhase('title'); });
el.btnStory.addEventListener('click', () => {
  const s = ARTIFACT_STORIES[level.id]; if (!s) return;
  el.storyTitle.textContent = ARTIFACTS[level.id].name;
  el.storyMeta.textContent = [s.period, s.age, s.place].filter(Boolean).join(' · ');
  el.storyArt.dataset.art = level.id;
  el.storyWhat.textContent = s.what;
  el.storyHello.textContent = (s.hello ?? []).join(' ');
  el.storyNote.textContent = s.note ?? '';
  el.story.showModal();
  voice.say(`story-${level.id}`);
});
el.storyClose.addEventListener('click', () => el.story.close());
el.story.addEventListener('close', () => voice.stop());

// ---------- HUD ----------
function updateHud(t) {
  if (!ch) return;
  if (isLocked(ch, t)) el.hint.textContent = '🐸 도망갔다! 잠깐만…';
  else if (selectedPower) { const f = FRIENDS[selectedPower]; el.hint.textContent = `${f.emoji} ${f.name}: 어디에 쓸까? 땅을 눌러!`; }
  else if (ch.dig.revealed.size >= 3 && !ch.dig.done) {
    const left = ch.dig.artifactCells.size - ch.dig.revealed.size;
    el.hint.textContent = `발굴 ${ch.dig.revealed.size} / ${ch.dig.artifactCells.size} · 반짝이는 ${left}곳을 마저 걷어 줘!`;
  } else el.hint.textContent = hintForLayer(lastTouchedCell >= 0 ? topLayer(ch.dig, lastTouchedCell) : 'soil');
}

// ---------- 루프 ----------
function rendererPhase() {
  if (phase === 'boss') return 'title';
  if (phase === 'title' || phase === 'card') return 'title';
  if (phase === 'found' || (phase === 'result' && resultKind === 'found')) return 'found';
  return 'dig';
}
function frame(t) {
  if (phase === 'dig' && ch) {
    updateHud(t); checkComicCues();
    if (ch.dig.revealed.size >= 3 && !ch.dig.done) {
      renderer.hint([...ch.dig.artifactCells].filter(i => !ch.dig.revealed.has(i)), t + 100);
    }
  }
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
  paintDom(document, t, reduced.matches);
  requestAnimationFrame(frame);
}
buildLevels();
setPhase('title');
requestAnimationFrame(frame);

// 교사·검증용 훅 (콘솔에서 sillaDebug.challenge 로 현재 판 상태를 본다)
window.sillaDebug = { get challenge() { return ch; }, get phase() { return phase; }, get layout() { return layout; }, get panels() { return panelsShown; }, get boss() { return bossView.state; } };
