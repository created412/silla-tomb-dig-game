// 상태 기계: title → wake → dig → found → again
import { createDig, progress } from './dig-model.js';
import { layoutGrid } from './grid.js';
import { LINES } from './lines.js';
import { createDialogue } from './dialogue.js';
import { createRenderer } from './renderer.js';
import { createSfx } from './sfx.js';
import { attachInput } from './input.js';

const COLS = 12, ROWS = 7, PADDING = 24;
const TOP_PAD = 96, BOTTOM_PAD = 104; // HUD·대사 상자 자리 (CSS px)
const ARTIFACT_CELLS = [39, 40, 41, 42, 43, 44]; // 4행(0부터 3) 3~8열, 가로 6칸 금관
const REACTION_MS = 2000;
const FOUND_PAUSE_MS = 300;
const LOG_KEY = 'silla-proto-log';

const $ = id => document.getElementById(id);
const canvas = $('dig');
const el = {
  hud: $('hud'), hint: $('hint'),
  barSoil: $('bar-soil'), barRock: $('bar-rock'), barWood: $('bar-wood'),
  dialogue: $('dialogue'), speaker: $('speaker'), line: $('line'), tapHint: $('tap-hint'),
  title: $('title'), again: $('again'),
  btnStart: $('btn-start'), btnAgain: $('btn-again'), btnNo: $('btn-no'),
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
  if (!line) { el.dialogue.classList.add('hidden'); return; }
  el.dialogue.classList.remove('hidden');
  el.speaker.textContent = line.who === 'frog' ? '🐸' : '🐍';
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
  el.title.classList.toggle('hidden', phase !== 'title');
  el.again.classList.toggle('hidden', phase !== 'again');
  el.hud.classList.toggle('hidden', phase !== 'dig');
  if (phase === 'title' || phase === 'again') showLine(null);
}

function playTalk(id) {
  // 만담은 반응 대사 타이머가 끼어들어 줄을 건너뛰지 않도록 타이머를 먼저 지운다
  clearTimeout(reactionTimer);
  reactionTimer = null;
  dialogue.play(id);
}

function startWake() {
  state = createDig({ cols: COLS, rows: ROWS, artifactCells: ARTIFACT_CELLS });
  playTalk('wake');
  setPhase('wake');
  showLine(dialogue.current(), true);
}

function startDig() {
  digStartedAt = performance.now();
  setPhase('dig');
  showLine(null);
}

function onArtifactRevealed(now) {
  foundAt = now;
  renderer.flash(400, now);
  sfx.found();
  setTimeout(() => {
    playTalk('found');
    setPhase('found');
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
      case 'tooHard': playReaction('tooHard'); break;
      case 'collapse': renderer.shake(300, now); sfx.collapse(); playReaction('collapse'); break;
      case 'glimmer': sfx.glimmer(); playReaction('glimmer'); break;
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
});

// 화면(또는 대사 상자) 탭으로 만담 넘기기. dig 단계에서는 아무 일도 하지 않는다.
function advance() {
  if (phase === 'wake') {
    if (dialogue.next()) showLine(dialogue.current(), true);
    else startDig();
  } else if (phase === 'found') {
    if (dialogue.next()) showLine(dialogue.current(), true);
    else setPhase('again');
  }
}
canvas.addEventListener('pointerdown', advance);
el.dialogue.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); advance(); });

el.btnStart.addEventListener('click', () => { sfx.unlock(); startWake(); });
el.btnAgain.addEventListener('click', () => { logChoice('again'); startWake(); });
el.btnNo.addEventListener('click', () => { logChoice('no'); setPhase('title'); });

// ---------- HUD ----------
function updateHud() {
  const p = progress(state);
  el.barSoil.style.width = `${Math.round(p.soil * 100)}%`;
  el.barRock.style.width = `${Math.round(p.rock * 100)}%`;
  el.barWood.style.width = `${Math.round(p.wood * 100)}%`;
  if (p.soil < 0.999) el.hint.textContent = '손가락으로 쓱쓱 문질러!';
  else if (p.rock < 0.999) el.hint.textContent = '돌은 톡톡 두드려!';
  else el.hint.textContent = '붓으로 살살…';
}

// ---------- 루프 ----------
function frame(tMs) {
  if (phase === 'dig' || phase === 'wake') {
    if (phase === 'dig') updateHud();
    renderer.draw(state, layout, tMs);
  } else if (phase === 'found') {
    renderer.draw(state, layout, tMs);
    renderer.drawCrownBig(1.6, tMs);
  } else {
    renderer.draw(null, layout, tMs);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setPhase('title');
