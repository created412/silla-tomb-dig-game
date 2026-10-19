// 상태 기계: title → wake → dig → found → again
import { createDig, progress, topLayer } from './dig-model.js';
import { hintForLayer } from './hud.js';
import { layoutGrid } from './grid.js';
import { LINES } from './lines.js';
import { createDialogue } from './dialogue.js';
import { createRenderer } from './renderer.js';
import { createSfx } from './sfx.js';
import { attachInput } from './input.js';

const COLS = 12, ROWS = 7, PADDING = 24;
const TOP_PAD = 112, BOTTOM_PAD = 142; // HUD·토우·말풍선 자리 (CSS px)
const ARTIFACT_CELLS = [39, 40, 41, 42, 43, 44]; // 4행(0부터 3) 3~8열, 가로 6칸 금관
const REACTION_MS = 2000;
const FOUND_PAUSE_MS = 2600;
const LOG_KEY = 'silla-proto-log';
const ADVANCE_GUARD_MS = 150; // 두 손가락 탭으로 대사 두 줄이 넘어가지 않게

const $ = id => document.getElementById(id);
const canvas = $('dig');
const el = {
  hud: $('hud'), hint: $('hint'),
  barSoil: $('bar-soil'), barRock: $('bar-rock'), barWood: $('bar-wood'),
  dialogue: $('dialogue'), speaker: $('speaker'), line: $('line'), tapHint: $('tap-hint'),
  title: $('title'), again: $('again'),
  btnStart: $('btn-start'), btnAgain: $('btn-again'), btnNo: $('btn-no'),
  stage: $('stage'), heading: $('game-heading'), discovery: $('discovery'), layers: $('layers'),
};

const renderer = createRenderer(canvas);
const sfx = createSfx();
const dialogue = createDialogue(LINES);

let phase = 'title';
let state = null;
let layout = null;
let reactionTimer = null;
let digStartedAt = 0;
let foundAt = 0;
let lastTouchedCell = -1;
let lastAdvanceAt = -Infinity;
let foundTimer = null;
let revealReady = false;

// ---------- 레이아웃 ----------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  layout = layoutGrid({
    width: canvas.width,
    height: canvas.height - (TOP_PAD + BOTTOM_PAD) * dpr,
    cols: COLS, rows: ROWS, padding: PADDING * dpr,
  });
  layout.y0 += TOP_PAD * dpr;
}
window.addEventListener('resize', resize);
resize();

// ---------- 대사 표시 ----------
function showLine(line, tappable) {
  renderer.speak(line?.who || null);
  if (!line) { el.dialogue.classList.add('hidden'); return; }
  el.dialogue.classList.remove('hidden');
  el.dialogue.dataset.speaker = line.who;
  el.dialogue.disabled = !tappable;
  el.speaker.textContent = line.who === 'frog' ? '개구리' : '뱀';
  el.line.textContent = line.text;
  el.tapHint.classList.toggle('hidden', !tappable);
}

function playReaction(id) {
  if (!dialogue.playIfIdle(id)) return;
  showLine(dialogue.current(), false);
  clearTimeout(reactionTimer);
  reactionTimer = setTimeout(() => {
    dialogue.next();
    showLine(dialogue.current(), false);
  }, REACTION_MS);
}

// ---------- 단계 전환 ----------
function setPhase(next) {
  phase = next;
  el.stage.dataset.phase = phase;
  el.title.classList.toggle('hidden', phase !== 'title');
  el.again.classList.toggle('hidden', phase !== 'again');
  el.hud.classList.toggle('hidden', phase !== 'dig');
  el.heading.classList.toggle('hidden', phase === 'title' || phase === 'again');
  el.discovery.classList.toggle('hidden', phase !== 'found');
  if (phase === 'title' || phase === 'again') showLine(null);
}

function playTalk(id) {
  // 만담은 반응 대사 타이머가 끼어들어 줄을 건너뛰지 않도록 타이머를 먼저 지운다
  clearTimeout(reactionTimer);
  reactionTimer = null;
  dialogue.play(id);
}

function startWake() {
  clearTimeout(foundTimer);
  revealReady = false;
  renderer.reset();
  state = createDig({ cols: COLS, rows: ROWS, artifactCells: ARTIFACT_CELLS });
  playTalk('wake');
  setPhase('wake');
  showLine(dialogue.current(), true);
}

function startDig() {
  digStartedAt = performance.now();
  lastTouchedCell = -1;
  setPhase('dig');
  showLine(null);
}

function onArtifactRevealed(now) {
  foundAt = now;
  clearTimeout(reactionTimer);
  showLine(null);
  revealReady = false;
  setPhase('found');
  renderer.react('artifactRevealed', now);
  renderer.flash(650, now);
  sfx.found();
  foundTimer = setTimeout(() => {
    playTalk('found');
    revealReady = true;
    showLine(dialogue.current(), true);
  }, FOUND_PAUSE_MS);
}

function logChoice(choice) {
  try {
    const arr = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    arr.push({ choice, digMs: Math.round(foundAt - digStartedAt), at: new Date().toISOString() });
    localStorage.setItem(LOG_KEY, JSON.stringify(arr));
  } catch { /* 저장 불가 환경 */ }
}

// ---------- 이벤트 처리 ----------
function onEvents(events) {
  const now = performance.now();
  for (const e of events) {
    switch (e.type) {
      case 'tooHard': renderer.react('tooHard', now); playReaction('tooHard'); break;
      case 'collapse': renderer.react('collapse', now); renderer.addDust(e.cell, layout, now, 'collapse'); renderer.shake(450, now); sfx.collapse(); playReaction('collapse'); break;
      case 'glimmer': renderer.react('glimmer', now); sfx.glimmer(); playReaction('glimmer'); break;
      case 'chip': sfx.tap(); renderer.addDust(e.cell, layout, now, 'rock'); break;
      case 'rockBroken': sfx.crack(); renderer.addDust(e.cell, layout, now, 'rock'); break;
      case 'artifactCell': sfx.tap(); break;
      case 'artifactRevealed': onArtifactRevealed(now); break;
    }
  }
}

attachInput(canvas, {
  getLayout: () => layout,
  getState: () => (phase === 'dig' ? state : null),
  onEvents,
  onRub: (cell) => { renderer.addDust(cell, layout, performance.now()); sfx.rub(); },
  onBrush: (cell) => { renderer.addDust(cell, layout, performance.now(), 'wood'); sfx.brush(); },
  onTouchCell: (cell) => { lastTouchedCell = cell; },
  onRockDrag: () => playReaction('rockDrag'),
});

// 화면(또는 대사 상자) 탭으로 만담 넘기기. dig 단계에서는 아무 일도 하지 않는다.
function advance() {
  const t = performance.now();
  if (t - lastAdvanceAt < ADVANCE_GUARD_MS) return;
  lastAdvanceAt = t;
  if (phase === 'wake') {
    if (dialogue.next()) showLine(dialogue.current(), true);
    else startDig();
  } else if (phase === 'found' && revealReady) {
    if (dialogue.next()) showLine(dialogue.current(), true);
    else setPhase('again');
  }
}
canvas.addEventListener('pointerdown', advance);
el.dialogue.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); advance(); });
el.dialogue.addEventListener('click', (ev) => { if (ev.detail === 0) advance(); });

el.btnStart.addEventListener('click', () => { sfx.unlock(); startWake(); });
el.btnAgain.addEventListener('click', () => { logChoice('again'); startWake(); });
el.btnNo.addEventListener('click', () => { logChoice('no'); setPhase('title'); });

// ---------- HUD ----------
function updateHud() {
  const p = progress(state);
  el.barSoil.style.transform = `scaleY(${1 - p.soil})`;
  el.barRock.style.transform = `scaleY(${1 - p.rock})`;
  el.barWood.style.transform = `scaleY(${1 - p.wood})`;
  // 안내는 마지막으로 만진 셀의 맨 위 층 기준 (전체 진행률 기준이면 돌을 보면서도 "문질러"라고 함)
  const layer = lastTouchedCell >= 0 ? topLayer(state, lastTouchedCell) : 'soil';
  el.hint.textContent = hintForLayer(layer);
  el.layers.dataset.active = layer;
}

// ---------- 루프 ----------
function frame(tMs) {
  if (phase === 'dig') updateHud();
  renderer.draw(state, layout, tMs, phase, tMs - foundAt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setPhase('title');
