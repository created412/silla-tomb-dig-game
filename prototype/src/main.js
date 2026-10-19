// 발굴 → 관찰 → 추리 → 세 단서 → 전시. 발굴 입력 모델은 그대로 사용한다.
import { createDig, progress, topLayer } from './dig-model.js';
import { hintForLayer } from './hud.js';
import { layoutGrid } from './grid.js';
import { LINES } from './lines.js';
import { createDialogue } from './dialogue.js';
import { createRenderer } from './renderer.js';
import { createSfx } from './sfx.js';
import { attachInput } from './input.js';
import { ARTIFACTS, STORY_TALKS } from './story-data.js';
import { createStory, discover, nextArtifact, saveExhibit, loadExhibit } from './story-model.js';
import { createStoryUI } from './story-ui.js';

const COLS = 12, ROWS = 7, PADDING = 24;
const TOP_PAD = 112, BOTTOM_PAD = 142; // HUD·토우·말풍선 자리 (CSS px)
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
const dialogue = createDialogue({ ...LINES, ...STORY_TALKS });
let story = createStory(), talkThen = null, totalDigMs = 0, completedRun = false;
let storage = null;
try { storage = window.localStorage; } catch { /* 저장 차단 환경에서도 진행 */ }
const storyUI = createStoryUI($('story'), {
  onNext() {
    if (story.index === 2) { storyUI.board(story); return; }
    runStoryTalk(story.index === 0 ? 'toSaddle' : 'toGlass', () => {
      if (!nextArtifact(story)) return;
      prepareDig(); startDig();
    });
  },
  onComplete(exhibit) {
    const saved = saveExhibit(storage, exhibit);
    completedRun = true; setPhase('museum'); storyUI.museum(exhibit, saved); refreshExhibit();
  },
  onRestart() { finishChoice('again'); startWake(); },
  onHome() { finishChoice('no'); setPhase('title'); },
});
function refreshExhibit() { $('btn-exhibit').classList.toggle('hidden', !loadExhibit(storage)); }
function finishChoice(choice) { if (completedRun) { logChoice(choice); completedRun = false; } }
function prepareDig() {
  const artifact = ARTIFACTS[story.index];
  state = createDig({ cols: COLS, rows: ROWS, artifactCells: artifact.cells });
  if (story.index > 0) {
    state.soil.fill(0); state.rock.fill(0);
    artifact.cells.forEach(cell => state.glimmered.add(cell));
  }
  renderer.setArtifact(artifact.id);
  el.heading.querySelector('.site-name').textContent = artifact.location;
  el.discovery.querySelector('h2').textContent = artifact.foundTitle;
  el.discovery.querySelector('p').textContent = artifact.foundHint;
}
function inspectArtifact() { setPhase('story'); showLine(null); storyUI.inspect(story); }
function runStoryTalk(id, then) {
  talkThen = then; playTalk(id); setPhase('storyTalk'); showLine(dialogue.current(), true);
}

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
  el.speaker.textContent = { frog: '개구리', snake: '뱀', turtle: '거북' }[line.who];
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
  if (phase === 'museum') el.heading.querySelector('.site-name').textContent = '우리의 첫 전시';
  el.title.classList.toggle('hidden', phase !== 'title');
  el.again.classList.toggle('hidden', phase !== 'again');
  el.hud.classList.toggle('hidden', phase !== 'dig');
  el.heading.classList.toggle('hidden', phase === 'title' || phase === 'again');
  el.discovery.classList.toggle('hidden', phase !== 'found');
  if (phase !== 'story' && phase !== 'museum') storyUI.hide();
  if (['title', 'again', 'story', 'museum'].includes(phase)) showLine(null);
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
  story = createStory(); totalDigMs = 0; completedRun = false; talkThen = null;
  prepareDig();
  playTalk('wake');
  setPhase('wake');
  showLine(dialogue.current(), true);
}

function startDig() {
  digStartedAt = performance.now();
  lastTouchedCell = story.index > 0 ? ARTIFACTS[story.index].cells[0] : -1;
  setPhase('dig');
  showLine(null);
}

function onArtifactRevealed(now) {
  foundAt = now;
  totalDigMs += now - digStartedAt;
  discover(story);
  clearTimeout(reactionTimer);
  showLine(null);
  revealReady = false;
  setPhase('found');
  renderer.react('artifactRevealed', now);
  renderer.flash(650, now);
  sfx.found();
  foundTimer = setTimeout(() => {
    playTalk(['found', 'saddleFound', 'glassFound'][story.index]);
    revealReady = true;
    showLine(dialogue.current(), true);
  }, FOUND_PAUSE_MS);
}

function logChoice(choice) {
  try {
    const arr = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    arr.push({ choice, digMs: Math.round(totalDigMs), at: new Date().toISOString() });
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
    else if (story.index === 0) {
      renderer.setCompanion(true); runStoryTalk('join', inspectArtifact);
    } else inspectArtifact();
  } else if (phase === 'storyTalk') {
    if (dialogue.next()) showLine(dialogue.current(), true);
    else { const then = talkThen; talkThen = null; then?.(); }
  }
}
canvas.addEventListener('pointerdown', advance);
el.dialogue.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); advance(); });
el.dialogue.addEventListener('click', (ev) => { if (ev.detail === 0) advance(); });

el.btnStart.addEventListener('click', () => { sfx.unlock(); startWake(); });
$('btn-exhibit').addEventListener('click', () => {
  const exhibit = loadExhibit(storage);
  if (exhibit) { setPhase('museum'); storyUI.museum(exhibit, true, true); }
});
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
  const renderPhase = phase === 'museum' ? 'story' : phase === 'storyTalk' ? 'found' : phase;
  renderer.draw(state, layout, tMs, renderPhase, tMs - foundAt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setPhase('title');
refreshExhibit();
