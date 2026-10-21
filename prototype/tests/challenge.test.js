import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, ARTIFACTS, COLS } from '../src/levels.js';
import { topLayer } from '../src/dig-model.js';
import {
  CRACKS_TO_BREAK, WORM_FLEE_MS, BIRD_HINT_MS, SUNSET_WARN_MS, SNAKE_WOOD_FLOOR, WARN_WINDOW_MS,
  placeArtifact, createChallenge, tick, timeLeftRatio, isLocked,
  processEvents, afterRub, tapWood, usePower, stars,
} from '../src/challenge.js';

const rngOf = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const row = i => Math.floor(i / COLS), col = i => i % COLS;

function make(levelIndex, seed = 7) {
  return createChallenge(LEVELS[levelIndex], rngOf(seed));
}
function expose(ch, cell) { ch.dig.soil[cell] = 0; ch.dig.rock[cell] = 0; }

test('placeArtifact keeps the whole shape inside the interior', () => {
  const rng = rngOf(1);
  for (let k = 0; k < 200; k++) {
    for (const { shape } of Object.values(ARTIFACTS)) {
      const cells = placeArtifact(shape, rng);
      assert.equal(cells.length, 6);
      for (const c of cells) { assert.ok(row(c) >= 1 && row(c) <= 5, `row ${row(c)}`); assert.ok(col(c) >= 1 && col(c) <= 10, `col ${col(c)}`); }
      const r0 = row(cells[0]), c0 = col(cells[0]);
      shape.forEach(([dc, dr], i) => assert.equal(cells[i], (r0 + dr) * COLS + c0 + dc));
    }
  }
});

test('level 1 has no rock, level 3 full rock, level 2 partial with rock on artifact cells', () => {
  const l1 = make(0), l3 = make(2), l2 = make(1);
  assert.ok(l1.dig.rock.every(v => v === 0));
  assert.ok(l3.dig.rock.every(v => v === 1));
  const n = l2.dig.rock.reduce((a, v) => a + v, 0);
  assert.ok(n > 10 && n < 70, `partial rock count ${n}`);
  for (const c of l2.dig.artifactCells) assert.equal(l2.dig.rock[c], 1);
});

test('worms never sit on artifact cells and count matches level', () => {
  for (let i = 0; i < LEVELS.length; i++) {
    const ch = make(i, 11 + i);
    assert.equal(ch.worms.size, LEVELS[i].worms);
    for (const w of ch.worms) assert.ok(!ch.dig.artifactCells.has(w));
  }
});

test('tooHard on artifact cell warns first, cracks on a second offense within the window', () => {
  const ch = make(0);
  const a = [...ch.dig.artifactCells][0];
  const off = [...Array(84).keys()].find(i => !ch.dig.artifactCells.has(i));
  const out = processEvents(ch, [{ type: 'tooHard', cell: a }], 0);
  assert.deepEqual(out, [{ type: 'tooHard', cell: a }, { type: 'warn', cell: a }]);
  assert.equal(ch.cracks, 0);
  const out2 = processEvents(ch, [{ type: 'tooHard', cell: a }], WARN_WINDOW_MS);
  assert.deepEqual(out2, [{ type: 'tooHard', cell: a }, { type: 'crack', cell: a, cracks: 1 }]);
  assert.deepEqual(ch.crackCells, [a]);
  assert.deepEqual(processEvents(ch, [{ type: 'tooHard', cell: off }], 4000), [{ type: 'tooHard', cell: off }]);
  assert.equal(ch.cracks, 1);
});

test('a warning expires: offenses farther apart than the window only warn', () => {
  const ch = make(0);
  const a = [...ch.dig.artifactCells][0];
  processEvents(ch, [{ type: 'tooHard', cell: a }], 0);
  const out = processEvents(ch, [{ type: 'tooHard', cell: a }], WARN_WINDOW_MS + 1);
  assert.equal(out.at(-1).type, 'warn');
  assert.equal(ch.cracks, 0);
});

test('after a crack the next offense warns again (no double-crack streaks)', () => {
  const ch = make(0);
  const a = [...ch.dig.artifactCells][0];
  processEvents(ch, [{ type: 'tooHard', cell: a }], 0);
  processEvents(ch, [{ type: 'tooHard', cell: a }], 1000); // crack 1
  const out = processEvents(ch, [{ type: 'tooHard', cell: a }], 2000);
  assert.equal(out.at(-1).type, 'warn');
  assert.equal(ch.cracks, 1);
});

test('collapse on artifact cell cracks immediately (no warning)', () => {
  const ch = make(0);
  const a = [...ch.dig.artifactCells][2];
  const out = processEvents(ch, [{ type: 'collapse', cell: a }], 0);
  assert.equal(out.at(-1).type, 'crack');
  assert.equal(ch.cracks, 1);
});

test('third crack breaks the artifact and sets outcome', () => {
  const ch = make(0);
  const a = [...ch.dig.artifactCells][0];
  processEvents(ch, [{ type: 'collapse', cell: a }], 0);
  processEvents(ch, [{ type: 'collapse', cell: a }], 1000);
  const out = processEvents(ch, [{ type: 'collapse', cell: a }], 2000);
  assert.equal(ch.cracks, CRACKS_TO_BREAK);
  assert.equal(ch.outcome, 'broken');
  assert.equal(out.at(-1).type, 'broken');
  // 이후 입력은 통과만 하고 금은 더 늘지 않는다
  processEvents(ch, [{ type: 'collapse', cell: a }], 3000);
  assert.equal(ch.cracks, CRACKS_TO_BREAK);
});

test('tapWood warns, then cracks, only on wood over artifact', () => {
  const ch = make(0);
  const a = [...ch.dig.artifactCells][1];
  assert.deepEqual(tapWood(ch, a, 0), []); // 아직 흙 위
  expose(ch, a);
  assert.equal(topLayer(ch.dig, a), 'wood');
  assert.equal(tapWood(ch, a, 0)[0].type, 'warn');
  assert.equal(tapWood(ch, a, 500)[0].type, 'crack');
  const off = [...Array(84).keys()].find(i => !ch.dig.artifactCells.has(i));
  expose(ch, off);
  assert.deepEqual(tapWood(ch, off, 600), []);
  assert.equal(ch.cracks, 1);
});

test('rubbing a worm cell to zero releases the worm and locks input for 2s', () => {
  const ch = make(0);
  const w = [...ch.worms][0];
  assert.deepEqual(afterRub(ch, w, 100), []); // 흙이 아직 남아 있음
  ch.dig.soil[w] = 0;
  const out = afterRub(ch, w, 100);
  assert.deepEqual(out, [{ type: 'worm', cell: w }]);
  assert.ok(!ch.worms.has(w));
  assert.equal(isLocked(ch, 100 + WORM_FLEE_MS - 1), true);
  assert.equal(isLocked(ch, 100 + WORM_FLEE_MS), false);
  assert.deepEqual(afterRub(ch, w, 3000), []); // 한 번 나온 지렁이는 다시 안 나옴
});

test('tick warns once at 20s left and sets sunset at the end', () => {
  const ch = make(0);
  const sun = LEVELS[0].sunMs;
  assert.deepEqual(tick(ch, sun - SUNSET_WARN_MS - 1), []);
  assert.deepEqual(tick(ch, 1), [{ type: 'sunsetWarn' }]);
  assert.deepEqual(tick(ch, 1), []);
  assert.ok(Math.abs(timeLeftRatio(ch) - (SUNSET_WARN_MS - 1) / sun) < 1e-6);
  const out = tick(ch, SUNSET_WARN_MS - 1);
  assert.deepEqual(out, [{ type: 'sunset' }]);
  assert.equal(ch.outcome, 'sunset');
  assert.deepEqual(tick(ch, 1000), []);
  assert.equal(timeLeftRatio(ch), 0);
});

test('found beats sunset in the same frame', () => {
  const ch = make(0);
  const out = processEvents(ch, [{ type: 'artifactRevealed' }], 0);
  assert.equal(ch.outcome, 'found');
  assert.equal(out.at(-1).type, 'found');
  assert.deepEqual(tick(ch, 10 * 60 * 1000), []);
  assert.equal(ch.outcome, 'found');
});

test('frog power clears 3x3 soil and still releases a worm there', () => {
  const ch = make(0);
  const w = [...ch.worms][0];
  const { ok, events } = usePower(ch, 'frog', w, 500);
  assert.equal(ok, true);
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const r = row(w) + dr, c = col(w) + dc;
    if (r < 0 || r >= 7 || c < 0 || c >= COLS) continue;
    assert.equal(ch.dig.soil[r * COLS + c], 0);
  }
  assert.ok(events.some(e => e.type === 'worm' && e.cell === w));
  assert.equal(isLocked(ch, 600), true);
  assert.equal(ch.powers.frog, 0);
  assert.equal(usePower(ch, 'frog', 40, 5000).ok, false);
});

test('frog power with no soil in range does not consume the power', () => {
  const ch = make(0);
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) ch.dig.soil[(3 + dr) * COLS + 5 + dc] = 0;
  const { ok } = usePower(ch, 'frog', 3 * COLS + 5, 0);
  assert.equal(ok, false);
  assert.equal(ch.powers.frog, 1);
});

test('turtle power breaks rock only where soil is gone and glimmers artifact cells', () => {
  const ch = make(2); // 돌 100%, 거북 있음
  const a = [...ch.dig.artifactCells][0];
  ch.dig.soil[a] = 0; // 유물 칸 하나만 흙을 걷음
  const { ok, events } = usePower(ch, 'turtle', a, 0);
  assert.equal(ok, true);
  assert.equal(ch.dig.rock[a], 0);
  assert.ok(ch.dig.glimmered.has(a));
  assert.ok(events.some(e => e.type === 'glimmer' && e.cell === a));
  // 흙이 남은 이웃 칸의 돌은 그대로
  const nb = a + 1;
  assert.equal(ch.dig.soil[nb] > 0 ? ch.dig.rock[nb] : 0, ch.dig.soil[nb] > 0 ? 1 : 0);
  assert.equal(ch.powers.turtle, 0);
});

test('snake power lowers wood to 0.4 without cracks', () => {
  const ch = make(2);
  const a = [...ch.dig.artifactCells][0];
  expose(ch, a);
  const { ok } = usePower(ch, 'snake', a, 0);
  assert.equal(ok, true);
  assert.equal(ch.dig.wood[a], SNAKE_WOOD_FLOOR);
  assert.equal(ch.cracks, 0);
  assert.ok(!ch.dig.revealed.has(a));
  assert.equal(ch.powers.snake, 0);
});

test('bird power sets hint window and is single-use; unknown friend fails', () => {
  const ch = make(0);
  const { ok } = usePower(ch, 'bird', 0, 1000);
  assert.equal(ok, true);
  assert.equal(ch.hintUntil, 1000 + BIRD_HINT_MS);
  assert.equal(usePower(ch, 'bird', 0, 2000).ok, false);
  assert.equal(usePower(ch, 'turtle', 0, 2000).ok, false); // 레벨 1엔 거북 없음
});

test('stars: 3 for clean and fast, 2 for one crack, 1 otherwise, 0 if not found', () => {
  const ch = make(0);
  assert.equal(stars(ch), 0);
  tick(ch, LEVELS[0].sunMs * 0.5);
  processEvents(ch, [{ type: 'artifactRevealed' }], 0);
  assert.equal(stars(ch), 3);
  const ch2 = make(0);
  const a = [...ch2.dig.artifactCells][0];
  processEvents(ch2, [{ type: 'collapse', cell: a }, { type: 'artifactRevealed' }], 0);
  assert.equal(stars(ch2), 2);
  const ch3 = make(0);
  tick(ch3, LEVELS[0].sunMs * 0.7);
  processEvents(ch3, [{ type: 'artifactRevealed' }], 0);
  assert.equal(stars(ch3), 2); // 금 0개지만 느림
  const ch4 = make(0);
  processEvents(ch4, [{ type: 'collapse', cell: a }], 0);
  processEvents(ch4, [{ type: 'collapse', cell: a }, { type: 'artifactRevealed' }], 1500);
  assert.equal(stars(ch4), 1);
});
