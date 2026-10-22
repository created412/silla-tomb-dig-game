import { FRIENDS, ARTIFACTS } from './levels.js';
import { BOSS_STORY } from './boss-story.js';
import { BOSS_STEPS, createBoss, startBossStep, chooseBossFriend, hitBossTarget, nextBossStep, retryBossStep, saveBossBadge } from './boss-model.js';

const SYMBOLS = {
  bush: '<path fill="#4d7950" d="M8 70Q-5 40 22 34Q9 6 39 16Q55-10 69 17Q99 6 87 35Q112 51 91 76Z"/><path d="M26 70L50 30L77 69" fill="none" stroke="#a3bc65" stroke-width="5"/>',
  soil: '<path fill="#9f6735" stroke="#efbf71" stroke-width="4" d="M5 77Q25 66 30 40Q45 7 64 34Q77 66 96 77Z"/><path d="M32 55L47 31M52 66L65 46" stroke="#c79250" stroke-width="7" stroke-linecap="round"/>',
  rock: '<path fill="#8d9b95" stroke="#d4dfc4" stroke-width="4" d="M10 76L6 40L30 15L70 10L96 40L88 78Z"/><path fill="#b7c4af" d="M10 40L32 19L68 14L51 42Z"/><path d="M51 42L68 78" stroke="#627a72" stroke-width="5"/>',
  gap: '<rect x="8" y="16" width="84" height="62" rx="18" fill="#9a6738" stroke="#e8ba72" stroke-width="5"/><ellipse cx="50" cy="47" rx="22" ry="13" fill="#173c32"/>',
  relic: '<path d="M18 29L30 40L35 19L50 40L65 19L70 40L82 29L75 76H25Z" fill="#ffd56f" stroke="#9b6f25" stroke-width="4"/>',
};
const positions = [[24, 63], [49, 74], [73, 55]];
const targetArt = kind => `<svg viewBox="0 0 100 90" aria-hidden="true">${SYMBOLS[kind]}</svg>`;

export function createBossView({ voice, sfx, storage, onExit }) {
  const $ = id => document.getElementById(id);
  const root = $('boss');
  let state = null, queue = [], afterTalk = null, finalLabel = '', busy = false, timer = null, active = false;
  function cancelEffect() { clearTimeout(timer); timer = null; busy = false; $('boss-helper').classList.remove('acting'); $('boss-impact').textContent = ''; }
  function tell(lines, end, label = '작전 시작!') {
    cancelEffect(); voice.stop(); queue = [...lines]; afterTalk = end; finalLabel = label;
    $('boss-dialogue').classList.remove('hidden'); showTalk();
  }
  function showTalk() {
    const line = queue[0];
    if (!line) { $('boss-dialogue').classList.add('hidden'); voice.stop(); const done = afterTalk; afterTalk = null; done?.(); return; }
    $('boss-talk-title').textContent = line.title;
    $('boss-talk-art').dataset.boss = String(line.panel);
    $('boss-talk-actor').dataset.actor = line.who;
    $('boss-talk-who').textContent = FRIENDS[line.who].name;
    $('boss-talk-text').textContent = line.text;
    $('boss-talk-next').textContent = queue.length > 1 ? '다음 이야기 →' : finalLabel;
    $('boss-talk-next').focus({ preventScroll: true });
    voice.say(line.key);
  }
  $('boss-talk-next').addEventListener('click', () => { if (!active || !queue.length) return; queue.shift(); showTalk(); });
  function beginStep() {
    $('boss-feedback').textContent = '';
    render(); tell([BOSS_STORY.steps[state.step]], () => { startBossStep(state); render(); $('boss-friends').querySelector('button')?.focus({ preventScroll: true }); });
  }
  function open() {
    $('boss-feedback').textContent = '';
    cancelEffect(); active = true; state = createBoss(); root.classList.remove('hidden');
    $('boss-victory').classList.add('hidden'); $('boss-save-status').textContent = '저장하기를 눌러 수호 배지를 간직해!';
    $('boss-save').disabled = false; $('boss-save').textContent = '수호 배지 저장하기';
    render(); tell(BOSS_STORY.intro, beginStep, '친구들과 힘 모으기');
  }
  function close() {
    active = false; cancelEffect(); queue = []; afterTalk = null; voice.stop(); root.classList.add('hidden');
    $('boss-dialogue').classList.add('hidden'); $('boss-victory').classList.add('hidden'); onExit();
  }
  function targetButtons() {
    const step = BOSS_STEPS[state.step], kind = ['bush', 'soil', 'rock', 'gap'][state.step];
    const labels = ['풀숲', '흙더미', '돌', '틈'];
    let html = step.targets.map((id, i) => {
      const done = state.done.includes(id), [x, rawY] = positions[i], y = state.step === 3 && i === 1 ? 40 : rawY;
      const clue = state.selected && (state.step === 0 ? i === state.footprint : state.step === 3 ? i === state.done.length : !done);
      const footprint = state.step === 0 && state.selected && i === state.footprint;
      return `<button class="boss-target ${done ? 'done' : ''} ${clue ? 'clue' : ''}" data-target="${id}" style="--x:${x}%;--y:${y}%" ${done || state.phase !== 'play' || busy ? 'disabled' : ''} aria-label="${footprint ? '발자국이 있는 ' : ''}${labels[state.step]} ${i + 1}">${targetArt(kind)}${footprint ? '<span class="footprints">👣</span>' : ''}<span class="target-caption">${done ? '✓' : footprint ? '발자국!' : `${labels[state.step]} ${i + 1}`}</span></button>`;
    }).join('');
    if (state.step === 2) html += `<button class="boss-target relic-target" data-target="relic" style="--x:89%;--y:81%" aria-label="유물 자리, 건드리지 않기" ${state.phase !== 'play' || busy ? 'disabled' : ''}>${targetArt('relic')}<span class="target-caption">유물 자리</span></button>`;
    return html;
  }
  function render() {
    const step = BOSS_STEPS[state.step];
    root.dataset.step = state.step; root.dataset.state = state.phase;
    $('boss-heading').textContent = step.title;
    $('boss-hearts').textContent = '♥'.repeat(state.hearts) + '♡'.repeat(3 - state.hearts);
    $('boss-hearts').setAttribute('aria-label', `남은 기회 ${state.hearts}번`);
    $('boss-progress').innerHTML = BOSS_STEPS.map((s,i) => `<li ${i === state.step ? 'aria-current="step"' : ''} class="${i < state.step || state.phase === 'won' ? 'complete' : ''}">${i < state.step || state.phase === 'won' ? '✓' : FRIENDS[s.who].emoji}<span>${['찾기', '길 열기', '돌 막기', '장치 멈추기'][i]}</span></li>`).join('');
    $('boss-instruction').textContent = step.instruction;
    $('boss-warning').textContent = state.phase === 'clear' ? '도굴을 막았어! 한 걸음 더!' : state.hearts < 3 ? `도굴꾼이 다가와! 기회 ${state.hearts}번` : '세 번 실수하면 작전을 다시 세워!';
    $('boss-targets').innerHTML = targetButtons();
    $('boss-friends').innerHTML = Object.entries(FRIENDS).map(([who, f]) => `<button class="boss-friend" data-friend="${who}" aria-pressed="${state.selected === who}" ${state.phase !== 'play' || busy ? 'disabled' : ''}><canvas data-actor="${who}" aria-hidden="true"></canvas><strong>${f.name}</strong><small>${{bird:'위에서 찾기',frog:'폴짝 흙 걷기',turtle:'등껍질로 막기',snake:'좁은 틈 통과'}[who]}</small></button>`).join('');
    $('boss-continue').classList.toggle('hidden', state.phase !== 'clear');
    $('boss-continue').disabled = busy;
    $('boss-continue').textContent = state.step === 3 ? '관리인이 도착했어! →' : '다음 작전 →';
  }
  function feedback(result) {
    const who = FRIENDS[BOSS_STEPS[state.step].who].name;
    if (result.type === 'failed') {
      sfx.collapse(); render();
      tell([BOSS_STORY.failed], () => { retryBossStep(state); beginStep(); }, '이 단계 다시 도전'); return;
    }
    if (result.type === 'miss') {
      sfx.tap(); render();
      $('boss-feedback').textContent = result.reason === 'friend' ? `이 작전은 ${who}의 능력이 필요해!` : state.step === 3 ? '반짝이는 틈부터 차례대로 눌러 봐!' : state.step === 2 ? '유물 자리는 그대로! 돌을 눌러 막아 줘.' : '새가 찾은 발자국을 잘 봐!';
      root.classList.remove('mistake'); void root.offsetWidth; root.classList.add('mistake');
    } else if (result.type === 'choose') $('boss-feedback').textContent = '먼저 아래에서 도와줄 토우를 골라 줘!';
  }
  $('boss-friends').addEventListener('click', e => {
    const b = e.target.closest('[data-friend]'); if (!b || busy || !active || queue.length) return;
    const result = chooseBossFriend(state, b.dataset.friend);
    if (result.type !== 'selected') { feedback(result); return; }
    sfx.power(); render(); $('boss-feedback').textContent = state.step === 0 ? '발자국 발견! 표시가 있는 풀숲을 눌러!' : '준비 완료! 위의 목표를 눌러 줘.';
    ($('boss-targets').querySelector('.clue') || $('boss-targets').querySelector('button'))?.focus({ preventScroll: true });
  });
  $('boss-targets').addEventListener('click', e => {
    const b = e.target.closest('[data-target]'); if (!b || busy || !active || queue.length) return;
    const x = b.style.getPropertyValue('--x'), y = b.style.getPropertyValue('--y');
    const result = hitBossTarget(state, b.dataset.target);
    if (!['hit','clear'].includes(result.type)) { feedback(result); return; }
    busy = true; sfx.power(); render();
    $('boss-helper').dataset.actor = BOSS_STEPS[state.step].who;
    $('boss-helper').style.setProperty('--x', x); $('boss-helper').style.setProperty('--y', y);
    $('boss-helper').classList.add('acting');
    $('boss-impact').style.left = x; $('boss-impact').style.top = y;
    $('boss-impact').textContent = ['찾았다!', '폴짝!', '든든!', '쏙!'][state.step];
    $('boss-feedback').textContent = `${state.done.length} / ${BOSS_STEPS[state.step].count} 성공!`;
    timer = setTimeout(() => {
      cancelEffect(); if (!active) return; render();
      if (state.phase === 'clear') { sfx.found(); $('boss-continue').focus({ preventScroll: true }); }
      else $('boss-targets').querySelector('.clue:not(:disabled), button:not(:disabled)')?.focus({ preventScroll: true });
    }, 650);
  });
  $('boss-continue').addEventListener('click', () => {
    if (!active || busy || !nextBossStep(state)) return;
    $('boss-feedback').textContent = '';
    if (state.phase === 'won') tell(BOSS_STORY.ending, victory, '수호 배지 받기'); else beginStep();
  });
  function victory() {
    render(); $('boss-victory').classList.remove('hidden'); sfx.found();
    $('boss-treasures').innerHTML = Object.entries(ARTIFACTS).map(([id,a])=>`<canvas data-art="${id}" aria-label="${a.name}"></canvas>`).join('');
    $('boss-save').focus({ preventScroll: true });
  }
  $('boss-save').addEventListener('click', () => {
    if (!active) return;
    const saved = saveBossBadge(storage,state);
    $('boss-save-status').textContent = saved ? '수호 배지를 저장했어! 다음에 와도 볼 수 있어.' : '이 기기에서는 저장할 수 없어. 지금 받은 배지는 여기서 볼 수 있어.';
    if (saved) { $('boss-save').disabled = true; $('boss-save').textContent = '✓ 저장 완료'; sfx.star(); }
  });
  $('boss-home').addEventListener('click',close); $('boss-exit').addEventListener('click',close); $('boss-replay').addEventListener('click',open);
  root.addEventListener('keydown', e => {
    if(e.key !== 'Tab') return;
    const modal = !$('boss-dialogue').classList.contains('hidden') ? $('boss-dialogue') : !$('boss-victory').classList.contains('hidden') ? $('boss-victory') : root;
    const buttons = [...modal.querySelectorAll('button:not(:disabled)')].filter(b=>b.offsetParent!==null);
    if(e.shiftKey && document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1)?.focus();}
    else if(!e.shiftKey && document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0]?.focus();}
  });
  return { open, close, get state() { return state; } };
}
