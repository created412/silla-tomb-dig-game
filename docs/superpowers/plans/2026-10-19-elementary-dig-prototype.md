# 초등판 0차 손맛 시제품 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 무덤 1(천마총 기반)의 흙·돌·나무 3층을 파 내려가 금관 1개를 드러내고, 뱀·개구리 토우 만담 2개가 나오는 브라우저 시제품. 아이 3~5명이 "또 파고 싶다"고 하는지 보는 용도.

**Architecture:** 순수 로직(발굴 격자 모델, 대사 큐)과 화면(캔버스 렌더러, 포인터 입력)을 분리한다. 로직은 시간과 좌표를 인자로 받는 순수 함수라 Node 내장 테스트로 검증하고, 렌더러·입력·효과음은 브라우저에서 눈으로 확인한다. 빌드 도구·의존성 없음, 정적 파일만.

**Tech Stack:** HTML5 Canvas 2D, ES modules, Web Audio(합성 효과음), Node 24 내장 `node --test`. 외부 패키지 0개.

**Spec:** `docs/plans/01-초등용-게임계획서.md` (v3.0) — 특히 6-1 "3층 뚫기 발굴", 4장 토우 콤비, 12-1 "0차 손맛 시제품".

## Global Constraints

- 시간 제한·생명·영구 파손 없음. 돌무지 "와르르"는 다시 쌓일 뿐 손해가 없다. (스펙 6-1, 8장)
- 반복 클릭을 강요하지 않는다. 돌은 셀당 3번 두드리면 깨진다. (스펙 6-1)
- 나무 방 층은 붓으로 살살: 세게 문지르면 진척 없이 🐸가 "살살!" 하고 막는다. (스펙 6-1)
- 유물이 드러나는 순간은 짧은 정지·확대·효과음으로 "찾았다"를 분명히 보여 준다. (스펙 6-1)
- 금관은 캐릭터화하지 않는다. 시제품에서는 단순 도형으로 그린 금관 실루엣을 쓰고, 실제 사진은 권리 확인 뒤 교체한다. (스펙 4장, 13장)
- 한 화면 지시는 한 문장, 대사는 두 줄 이내. (스펙 8장)
- PC 마우스와 태블릿 터치 모두 동작. 가로 화면 기준. (스펙 11장)
- 색: 흙빛 `#8b6a3e`, 돌 `#6e6e6e`, 나무 `#5a3b1e`, 청록 `#2f6f6b`, 금 `#e0b84a`. (스펙 11장 + 목업)
- 모든 파일은 `prototype/` 아래. 로그인·서버 없음. 외부 패키지 없음.

## Review Focus

1. 포인터가 캔버스 밖으로 나갔다가 들어올 때 속도 계산이 폭주해 나무 층에서 "살살" 이벤트가 연속 발생하면 안 된다. → Task 4 `tooHard` 1초 스로틀 테스트, Task 6 `pointerleave`에서 추적 초기화.
2. 돌 셀을 손가락으로 문지르면(드래그) 아무 일도 안 일어나야 하고, 두드려야 깨진다. 아이가 이걸 모르면 막힌다. → Task 3 테스트 + Task 7 HUD 문구 "돌은 톡톡 두드려!".
3. 멀티터치(손가락 두 개)로 같은 셀을 동시에 두드리면 연타로 오인돼 와르르가 나면 안 된다. → Task 6에서 첫 포인터만 추적(`isPrimary`).
4. 창 크기가 바뀌거나 태블릿을 돌리면 격자 좌표가 틀어진다. → Task 6 `cellAt()` 테스트는 캔버스 크기를 인자로 받고, Task 7 `resize`에서 재계산.
5. 와르르가 유물 셀 위에서 일어나 이미 드러난 유물을 다시 덮으면 안 된다. 돌만 다시 쌓이고 나무·유물 상태는 유지. → Task 3 `collapse` 테스트.

---

## File Structure

```
prototype/
  index.html              페이지 뼈대, 캔버스, HUD·대사 상자 DOM
  style.css               레이아웃·색·글자 크기
  src/
    dig-model.js          순수 로직: 3층 격자, rub/tap/brush, 이벤트
    lines.js              대사 데이터 (만담 2개 + 반응 대사 3개)
    dialogue.js           순수 로직: 대사 큐 (play/next/current)
    grid.js               순수 로직: 캔버스 좌표 ↔ 셀 인덱스
    renderer.js           캔버스 그리기 (층·유물·반짝임·먼지·흔들림)
    sfx.js                Web Audio 합성 효과음 (문지르기·톡·와르르·찾았다)
    input.js              포인터 이벤트 → tap/drag + 속도 → 모델 호출
    main.js               상태 기계: title → wake → dig → found → again
  tests/
    dig-model.test.js
    dialogue.test.js
    grid.test.js
package.json              "test": "node --test prototype/tests/"
```

`package.json`은 저장소 루트에 둔다(테스트 명령만, 의존성 없음).

---

### Task 1: 발굴 모델 — 흙 층 문지르기

**Files:**
- Create: `package.json`
- Create: `prototype/src/dig-model.js`
- Test: `prototype/tests/dig-model.test.js`

**Interfaces:**
- Produces:
  - `createDig({cols, rows, artifactCells}) -> DigState` — `cols*rows` 셀. `DigState = { cols, rows, soil: Float64Array, rock: Float64Array, wood: Float64Array, artifactCells: Set<number>, revealed: Set<number>, glimmered: Set<number>, tapLog: Map<number, number[]>, lastTooHardAt: number, done: boolean }`. 모든 층 초기값 1.
  - `topLayer(state, i) -> 'soil' | 'rock' | 'wood' | 'floor'` — 첫 번째로 값이 0보다 큰 층. 셋 다 0이면 `'floor'`.
  - `rub(state, i, dtMs) -> Event[]` — `topLayer`가 `'soil'`일 때만 `soil[i] -= RUB_RATE * dtMs`, 0 아래로 내려가지 않음. 그 외 층이면 빈 배열.
  - 상수: `RUB_RATE = 1 / 600` (흙 한 셀에 600ms 문지르기).
  - `Event = { type: string, cell?: number }`.

- [ ] **Step 1: package.json 작성**

```json
{ "name": "silla-dig-prototype", "private": true, "type": "module",
  "scripts": { "test": "node --test prototype/tests/" } }
```

- [ ] **Step 2: 실패하는 테스트 작성**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDig, topLayer, rub, RUB_RATE } from '../src/dig-model.js';

test('createDig: 모든 층 1, 유물 셀 기록', () => {
  const s = createDig({ cols: 4, rows: 2, artifactCells: [5, 6] });
  assert.equal(s.soil.length, 8);
  assert.equal(s.soil[0], 1); assert.equal(s.rock[0], 1); assert.equal(s.wood[0], 1);
  assert.ok(s.artifactCells.has(5));
  assert.equal(s.done, false);
});

test('topLayer: 위에서부터 첫 양수 층', () => {
  const s = createDig({ cols: 1, rows: 1, artifactCells: [] });
  assert.equal(topLayer(s, 0), 'soil');
  s.soil[0] = 0; assert.equal(topLayer(s, 0), 'rock');
  s.rock[0] = 0; assert.equal(topLayer(s, 0), 'wood');
  s.wood[0] = 0; assert.equal(topLayer(s, 0), 'floor');
});

test('rub: 흙을 600ms 문지르면 0, 음수 금지', () => {
  const s = createDig({ cols: 1, rows: 1, artifactCells: [] });
  rub(s, 0, 300); assert.ok(Math.abs(s.soil[0] - 0.5) < 1e-9);
  rub(s, 0, 1000); assert.equal(s.soil[0], 0);
});

test('rub: 흙이 없으면 돌·나무는 변하지 않음', () => {
  const s = createDig({ cols: 1, rows: 1, artifactCells: [] });
  s.soil[0] = 0;
  const ev = rub(s, 0, 500);
  assert.deepEqual(ev, []); assert.equal(s.rock[0], 1); assert.equal(s.wood[0], 1);
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/dig-model.js'`

- [ ] **Step 4: `prototype/src/dig-model.js`에 `createDig`, `topLayer`, `rub`, `RUB_RATE` 구현**

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: 4 passing

- [ ] **Step 6: Commit**

```bash
git add package.json prototype/src/dig-model.js prototype/tests/dig-model.test.js
git commit -m "feat(prototype): dig model with soil rubbing"
```

---

### Task 2: 발굴 모델 — 돌 두드리기와 와르르

**Files:**
- Modify: `prototype/src/dig-model.js`
- Test: `prototype/tests/dig-model.test.js`

**Interfaces:**
- Consumes: Task 1의 `createDig`, `topLayer`.
- Produces:
  - `tap(state, i, nowMs) -> Event[]` — `topLayer`가 `'rock'`일 때만 `rock[i] -= TAP_AMOUNT`(0 아래 금지). 그 외 층이면 빈 배열(흙 위 탭은 무효, 나무 위 탭도 무효).
  - 연타 판정: `tapLog[i]`에 시각을 쌓고, 최근 `RAPID_TAPS`(4)개의 탭 간격이 모두 `RAPID_INTERVAL_MS`(250) 미만이면 **와르르**: `i`와 상하좌우 이웃 중 `topLayer === 'rock'`인 셀의 `rock`을 1로 되돌리고 `tapLog[i]`를 비운 뒤 `[{type:'collapse', cell:i}]` 반환. 나무·유물·`revealed`는 건드리지 않는다.
  - 돌이 깨져 0이 된 순간 그 셀이 `artifactCells`에 있고 `glimmered`에 없으면 `glimmered`에 넣고 `{type:'glimmer', cell:i}` 추가.
  - 상수: `TAP_AMOUNT = 0.34`, `RAPID_TAPS = 4`, `RAPID_INTERVAL_MS = 250`.

- [ ] **Step 1: 실패하는 테스트 추가**

```js
import { tap, TAP_AMOUNT } from '../src/dig-model.js';

function bare(cols, rows, artifactCells = []) {
  const s = createDig({ cols, rows, artifactCells });
  s.soil.fill(0); return s;            // 흙 다 걷힌 상태
}

test('tap: 돌은 3번 두드리면 0', () => {
  const s = bare(1, 1);
  tap(s, 0, 0); tap(s, 0, 1000); assert.ok(s.rock[0] > 0);
  tap(s, 0, 2000); assert.equal(s.rock[0], 0);
});

test('tap: 흙이 남아 있으면 무효', () => {
  const s = createDig({ cols: 1, rows: 1, artifactCells: [] });
  assert.deepEqual(tap(s, 0, 0), []); assert.equal(s.rock[0], 1);
});

test('tap: 250ms 미만 간격 4연타면 와르르, 이웃 돌만 복구', () => {
  const s = bare(3, 3);                 // 가운데 4
  s.rock[1] = 0.3; s.rock[4] = 0.3; s.rock[0] = 0.3; s.wood[4] = 0.2;
  let ev = [];
  for (const t of [0, 100, 200, 300]) ev = tap(s, 4, t);
  assert.deepEqual(ev, [{ type: 'collapse', cell: 4 }]);
  assert.equal(s.rock[4], 1); assert.equal(s.rock[1], 1);
  assert.equal(s.rock[0], 0.3);        // 대각선은 그대로
  assert.equal(s.wood[4], 0.2);        // 나무는 그대로
});

test('tap: 느린 탭은 와르르 아님', () => {
  const s = bare(1, 1);
  let ev = [];
  for (const t of [0, 300, 600, 900]) ev = tap(s, 0, t);
  assert.ok(!ev.some(e => e.type === 'collapse'));
});

test('tap: 유물 셀의 돌이 0이 되면 glimmer 한 번', () => {
  const s = bare(1, 1, [0]);
  tap(s, 0, 0); tap(s, 0, 1000);
  const ev = tap(s, 0, 2000);
  assert.deepEqual(ev, [{ type: 'glimmer', cell: 0 }]);
  assert.deepEqual(tap(s, 0, 3000), []);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `tap is not a function`

- [ ] **Step 3: `tap` 및 상수 구현**

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 9 passing

- [ ] **Step 5: Commit**

```bash
git add prototype/src/dig-model.js prototype/tests/dig-model.test.js
git commit -m "feat(prototype): rock tapping with rapid-tap collapse and glimmer"
```

---

### Task 3: 발굴 모델 — 나무 층 살살 붓질과 유물 드러남

**Files:**
- Modify: `prototype/src/dig-model.js`
- Test: `prototype/tests/dig-model.test.js`

**Interfaces:**
- Consumes: Task 1~2.
- Produces:
  - `brush(state, i, dtMs, speedPxPerMs, nowMs) -> Event[]` — `topLayer`가 `'wood'`일 때만. `speedPxPerMs <= GENTLE_MAX_SPEED`이면 `wood[i] -= BRUSH_RATE * dtMs`(0 아래 금지). 더 빠르면 진척 없이, `nowMs - state.lastTooHardAt >= TOO_HARD_COOLDOWN_MS`일 때만 `{type:'tooHard', cell:i}`를 내고 `lastTooHardAt = nowMs`.
  - `wood[i]`가 0이 된 순간 `i`가 `artifactCells`에 있으면 `revealed`에 넣고 `{type:'artifactCell', cell:i}`. `revealed.size === artifactCells.size`가 되면 `done = true`로 하고 `{type:'artifactRevealed'}`를 한 번 더 추가.
  - `progress(state) -> { soil: number, rock: number, wood: number, artifact: number }` — 각 층 걷힌 비율(0~1)과 유물 드러난 비율.
  - 상수: `BRUSH_RATE = 1 / 900`, `GENTLE_MAX_SPEED = 0.6`(px/ms), `TOO_HARD_COOLDOWN_MS = 1000`.

- [ ] **Step 1: 실패하는 테스트 추가**

```js
import { brush, progress } from '../src/dig-model.js';

function woodOnly(cols, rows, artifactCells = []) {
  const s = bare(cols, rows, artifactCells); s.rock.fill(0); return s;
}

test('brush: 살살 900ms면 나무 0', () => {
  const s = woodOnly(1, 1);
  brush(s, 0, 450, 0.3, 0); assert.ok(Math.abs(s.wood[0] - 0.5) < 1e-9);
  brush(s, 0, 1000, 0.3, 500); assert.equal(s.wood[0], 0);
});

test('brush: 세게 하면 진척 없고 tooHard, 1초에 한 번만', () => {
  const s = woodOnly(1, 1);
  assert.deepEqual(brush(s, 0, 100, 2.0, 0), [{ type: 'tooHard', cell: 0 }]);
  assert.equal(s.wood[0], 1);
  assert.deepEqual(brush(s, 0, 100, 2.0, 500), []);
  assert.deepEqual(brush(s, 0, 100, 2.0, 1000), [{ type: 'tooHard', cell: 0 }]);
});

test('brush: 돌이 남아 있으면 무효', () => {
  const s = bare(1, 1);
  assert.deepEqual(brush(s, 0, 100, 0.1, 0), []); assert.equal(s.wood[0], 1);
});

test('brush: 유물 셀 드러남과 전체 완료', () => {
  const s = woodOnly(2, 1, [0, 1]);
  assert.deepEqual(brush(s, 0, 2000, 0.1, 0), [{ type: 'artifactCell', cell: 0 }]);
  assert.equal(s.done, false);
  assert.deepEqual(brush(s, 1, 2000, 0.1, 0),
    [{ type: 'artifactCell', cell: 1 }, { type: 'artifactRevealed' }]);
  assert.equal(s.done, true);
});

test('progress: 비율 계산', () => {
  const s = createDig({ cols: 2, rows: 1, artifactCells: [0] });
  s.soil[0] = 0;
  const p = progress(s);
  assert.equal(p.soil, 0.5); assert.equal(p.rock, 0); assert.equal(p.artifact, 0);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `brush is not a function`

- [ ] **Step 3: `brush`, `progress`, 상수 구현**

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 14 passing

- [ ] **Step 5: Commit**

```bash
git add prototype/src/dig-model.js prototype/tests/dig-model.test.js
git commit -m "feat(prototype): gentle brushing, artifact reveal, progress"
```

---

### Task 4: 대사 데이터와 대사 큐

**Files:**
- Create: `prototype/src/lines.js`
- Create: `prototype/src/dialogue.js`
- Test: `prototype/tests/dialogue.test.js`

**Interfaces:**
- Produces:
  - `lines.js`: `export const LINES = { wake: Line[], found: Line[], tooHard: Line[], collapse: Line[], glimmer: Line[] }`, `Line = { who: 'frog' | 'snake', text: string }`. 각 줄 2줄(40자) 이내. 정확한 대사:
    - `wake` (만담 1): 🐍 "저기 반짝이는 거, 내가 먼저 봤어." / 🐸 "너는 손도 없잖아! 내가 팔게!" / 🐍 "…그럼 네가 파. 나는 널 먹을게." / 🐸 "히이익! 얼른 파자!"
    - `found` (만담 2): 🐸 "찾았다! 금관이야!" / 🐍 "내가 먼저 봤으니까 내 거야." / 🐸 "네가 뭘 봐! 눈도 안 깜빡이면서!" / 🐍 "…그래서 잘 보여."
    - `tooHard`: 🐸 "살살! 살살!"
    - `collapse`: 🐍 "와르르… 천천히 톡톡 해."
    - `glimmer`: 🐸 "어? 뭔가 반짝여!"
  - `dialogue.js`: `createDialogue(lines) -> Dialogue`, `Dialogue.play(id) -> void`(큐 교체, 인덱스 0), `Dialogue.current() -> Line | null`, `Dialogue.next() -> Line | null`(다음 줄로 이동 후 반환, 끝이면 `null`이고 `current()`도 `null`), `Dialogue.isPlaying() -> boolean`, `Dialogue.playIfIdle(id) -> boolean`(재생 중이면 무시하고 `false`).

- [ ] **Step 1: 실패하는 테스트 작성**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LINES } from '../src/lines.js';
import { createDialogue } from '../src/dialogue.js';

test('LINES: 만담 2개는 4줄, 반응 대사는 1줄, 모두 40자 이내', () => {
  assert.equal(LINES.wake.length, 4); assert.equal(LINES.found.length, 4);
  for (const id of ['tooHard', 'collapse', 'glimmer']) assert.equal(LINES[id].length, 1);
  for (const arr of Object.values(LINES)) for (const l of arr) {
    assert.ok(['frog', 'snake'].includes(l.who)); assert.ok(l.text.length <= 40);
  }
});

test('dialogue: play/next/current 순서', () => {
  const d = createDialogue({ a: [{ who: 'frog', text: '1' }, { who: 'snake', text: '2' }] });
  assert.equal(d.current(), null); assert.equal(d.isPlaying(), false);
  d.play('a');
  assert.equal(d.current().text, '1'); assert.equal(d.isPlaying(), true);
  assert.equal(d.next().text, '2');
  assert.equal(d.next(), null); assert.equal(d.current(), null);
});

test('dialogue: playIfIdle은 재생 중이면 무시', () => {
  const d = createDialogue({ a: [{ who: 'frog', text: '1' }], b: [{ who: 'snake', text: '2' }] });
  d.play('a');
  assert.equal(d.playIfIdle('b'), false); assert.equal(d.current().text, '1');
  d.next();
  assert.equal(d.playIfIdle('b'), true); assert.equal(d.current().text, '2');
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/lines.js'`

- [ ] **Step 3: `lines.js`, `dialogue.js` 구현**

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 17 passing

- [ ] **Step 5: Commit**

```bash
git add prototype/src/lines.js prototype/src/dialogue.js prototype/tests/dialogue.test.js
git commit -m "feat(prototype): toy-figurine dialogue lines and queue"
```

---

### Task 5: 격자 좌표 변환

**Files:**
- Create: `prototype/src/grid.js`
- Test: `prototype/tests/grid.test.js`

**Interfaces:**
- Produces:
  - `layoutGrid({ width, height, cols, rows, padding }) -> Layout` — `Layout = { cell: number, x0: number, y0: number, cols, rows }`. `cell = floor(min((width-2*padding)/cols, (height-2*padding)/rows))`, 격자를 캔버스 중앙에 둔다.
  - `cellAt(layout, px, py) -> number | -1` — 격자 밖이면 -1.
  - `cellRect(layout, i) -> { x, y, w, h }`.
  - `neighbors4(cols, rows, i) -> number[]` — 상하좌우, 경계 밖 제외. (Task 2의 와르르가 이 함수를 쓰도록 `dig-model.js`에서 import한다. 이미 Task 2에서 내부 구현했다면 여기로 옮기고 테스트가 그대로 통과하는지 확인한다.)

- [ ] **Step 1: 실패하는 테스트 작성**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutGrid, cellAt, cellRect, neighbors4 } from '../src/grid.js';

test('layoutGrid: 셀 크기는 가로·세로 중 작은 쪽, 중앙 정렬', () => {
  const L = layoutGrid({ width: 1000, height: 500, cols: 10, rows: 5, padding: 50 });
  assert.equal(L.cell, 80);
  assert.equal(L.x0, (1000 - 800) / 2); assert.equal(L.y0, (500 - 400) / 2);
});

test('cellAt: 안쪽은 인덱스, 바깥은 -1', () => {
  const L = layoutGrid({ width: 1000, height: 500, cols: 10, rows: 5, padding: 50 });
  assert.equal(cellAt(L, L.x0 + 1, L.y0 + 1), 0);
  assert.equal(cellAt(L, L.x0 + 81, L.y0 + 81), 11);
  assert.equal(cellAt(L, 0, 0), -1);
  assert.equal(cellAt(L, L.x0 + 800, L.y0 + 1), -1);
});

test('cellRect', () => {
  const L = layoutGrid({ width: 1000, height: 500, cols: 10, rows: 5, padding: 50 });
  assert.deepEqual(cellRect(L, 11), { x: L.x0 + 80, y: L.y0 + 80, w: 80, h: 80 });
});

test('neighbors4: 경계 처리', () => {
  assert.deepEqual(neighbors4(3, 3, 4).sort(), [1, 3, 5, 7]);
  assert.deepEqual(neighbors4(3, 3, 0).sort(), [1, 3]);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/grid.js'`

- [ ] **Step 3: `grid.js` 구현, `dig-model.js`가 `neighbors4`를 import하도록 수정**

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 21 passing

- [ ] **Step 5: Commit**

```bash
git add prototype/src/grid.js prototype/src/dig-model.js prototype/tests/grid.test.js
git commit -m "feat(prototype): grid layout and coordinate helpers"
```

---

### Task 6: 포인터 입력 → 모델 호출

**Files:**
- Create: `prototype/src/input.js`
- Test: 브라우저 수동 확인 (Task 8에서).

**Interfaces:**
- Consumes: `cellAt`(Task 5), `rub/tap/brush/topLayer`(Task 1~3).
- Produces: `attachInput(canvas, { getLayout, getState, onEvents, now = () => performance.now() }) -> detach()`.
  - `pointerdown`(primary만): 시작 좌표·시각 기록, `moved = false`. `canvas.setPointerCapture`.
  - `pointermove`(primary, 눌린 상태): 이전 점과 거리 > 6px이면 `moved = true`. 셀 `i = cellAt(...)`. `dt = now - prevT`, `speed = dist / dt`. `topLayer`가 `'soil'`이면 `rub(state, i, dt)`, `'wood'`이면 `brush(state, i, dt, speed, now)`, `'rock'`이면 아무것도 안 함. 반환 이벤트가 있으면 `onEvents(events)`.
  - `pointerup`: `moved === false`이고 누른 시간 < 300ms이면 `tap(state, i, now)` → `onEvents`.
  - `pointerleave`/`pointercancel`: 추적 상태 초기화(속도 폭주 방지).
  - 캔버스 CSS 크기와 내부 해상도가 다를 수 있으므로 좌표는 `getBoundingClientRect()` 기준으로 변환한 뒤 `canvas.width / rect.width` 배율을 곱한다.
  - `touch-action: none`을 캔버스 스타일에 준다(스크롤 방지).

- [ ] **Step 1: `input.js` 구현**

- [ ] **Step 2: 문법 확인**

Run: `node --check prototype/src/input.js`
Expected: 출력 없음(성공)

- [ ] **Step 3: Commit**

```bash
git add prototype/src/input.js
git commit -m "feat(prototype): pointer input mapped to rub/tap/brush"
```

---

### Task 7: 렌더러와 효과음

**Files:**
- Create: `prototype/src/renderer.js`
- Create: `prototype/src/sfx.js`
- Test: 브라우저 수동 확인 (Task 8에서).

**Interfaces:**
- Consumes: `topLayer`, `cellRect`, `DigState`.
- Produces:
  - `createRenderer(canvas) -> { draw(state, layout, fx, tMs), addDust(cell, layout), shake(ms), flash(ms) }`. `fx` 내부 상태: 먼지 입자 배열, 흔들림 종료 시각, 플래시 종료 시각.
  - 그리기 순서: 배경(어두운 청록 `#1f3b3a`) → 셀마다 `topLayer`에 따라: `floor`이면 유물 셀은 금관 조각을, 아니면 바닥 `#3a2a18`; `wood`는 `#5a3b1e` 판자 선 + 투명도 `wood[i]`; `rock`은 `#6e6e6e` 둥근 돌 + 투명도 `rock[i]`; `soil`은 `#8b6a3e` + 투명도 `soil[i]`. 투명도가 낮을수록 아래 층이 비친다(층을 아래에서 위로 겹쳐 그린다).
  - 반짝임: `glimmered`에 있고 `wood[i] > 0`인 셀에 `#e0b84a` 방사형 그라데이션, `tMs`로 숨 쉬듯 깜빡임.
  - 금관: `drawCrown(ctx, rect)` — 가로로 이어진 유물 영역을 하나의 금관으로 본다. 각 셀은 전체 금관 그림의 해당 조각만 클리핑해 그린다. 금관은 사각 띠 + 세 개의 "出"자 세움 장식 + 작은 원(달개) 정도의 단순 도형. 사진 교체는 후속.
  - 먼지: 문지를 때 `addDust`로 흙색 입자 6개, 0.5초 낙하 후 소멸.
  - 흔들림: `shake(300)` 동안 캔버스를 ±4px 랜덤 이동. 플래시: `flash(400)` 동안 흰색 반투명 덮개가 사라짐.
  - `sfx.js`: `createSfx() -> { rub(), tap(), collapse(), glimmer(), found(), unlock() }`. Web Audio 오실레이터로 합성: rub은 짧은 노이즈 느낌(저역 사인 30ms), tap은 200Hz 사각파 40ms, collapse는 하강 톤 300ms, glimmer는 상승 두 음, found는 3음 아르페지오. `unlock()`은 첫 사용자 제스처에서 `AudioContext.resume()`. 실패해도 게임은 진행(try/catch).

- [ ] **Step 1: `renderer.js` 구현**

- [ ] **Step 2: `sfx.js` 구현**

- [ ] **Step 3: 문법 확인**

Run: `node --check prototype/src/renderer.js && node --check prototype/src/sfx.js`
Expected: 출력 없음

- [ ] **Step 4: Commit**

```bash
git add prototype/src/renderer.js prototype/src/sfx.js
git commit -m "feat(prototype): canvas renderer, crown, particles, synth sfx"
```

---

### Task 8: 페이지와 상태 기계, 브라우저 확인

**Files:**
- Create: `prototype/index.html`
- Create: `prototype/style.css`
- Create: `prototype/src/main.js`
- Test: 브라우저 수동 확인 + `node --check`.

**Interfaces:**
- Consumes: 모든 이전 Task.
- Produces: 상태 기계 `phase: 'title' | 'wake' | 'dig' | 'found' | 'again'`.
  - 격자: `cols = 12, rows = 7`. 유물 셀: 4행(0부터 3)의 3~8열 → 인덱스 `[39,40,41,42,43,44]` (6칸 가로 금관).
  - `title`: 제목 "토우 친구들과 무덤 주인 찾기 — 시제품", 큰 버튼 "파러 가자!". 누르면 `sfx.unlock()`, `dialogue.play('wake')`, `phase='wake'`.
  - `wake`: 대사 상자에 `current()` 표시(화자 이모지 🐸/🐍 + 글). 화면 아무 데나 탭하면 `next()`; `null`이면 `phase='dig'`.
  - `dig`: 입력 활성. HUD 상단에 현재 안내 한 문장: 흙이 남았으면 "손가락으로 쓱쓱 문질러!", 흙이 다 걷히고 돌이 남았으면 "돌은 톡톡 두드려!", 나무만 남았으면 "붓으로 살살…". 하단에 세 층 진행 막대(`progress`).
  - 이벤트 처리: `tooHard` → `dialogue.playIfIdle('tooHard')`; `collapse` → `renderer.shake(300)`, `sfx.collapse()`, `dialogue.playIfIdle('collapse')`; `glimmer` → `sfx.glimmer()`, `dialogue.playIfIdle('glimmer')`; `artifactCell` → `sfx.tap()`; `artifactRevealed` → `renderer.flash(400)`, `sfx.found()`, 300ms 정지 후 `dialogue.play('found')`, `phase='found'`.
  - `dig` 중 반응 대사(`tooHard`/`collapse`/`glimmer`)는 2초 뒤 자동으로 사라진다(`next()`를 타이머로 호출). 만담(`wake`/`found`)은 탭으로 넘긴다.
  - `found`: 금관을 화면 중앙에 1.6배로 확대해 보여 주며 만담 2 진행. 끝나면 `phase='again'`.
  - `again`: 큰 글씨 "또 파고 싶어?" 와 버튼 두 개 "응, 또!" / "아니". "응, 또!"는 `createDig`로 초기화 후 `phase='wake'`. "아니"는 `title`로. 어느 쪽을 눌렀는지와 소요 시간(ms)을 `localStorage['silla-proto-log']` 배열에 JSON으로 덧붙인다(검증 기록용, try/catch).
  - 캔버스는 `window.resize`마다 `canvas.width/height`를 컨테이너 크기(장치 픽셀 비율 반영)로 맞추고 `layoutGrid`를 다시 계산한다. `padding = 24`.
  - `requestAnimationFrame` 루프에서 `renderer.draw`.
  - `style.css`: 전체 화면 어두운 청록 배경, 대사 상자는 하단 고정 흰 바탕·둥근 모서리·글자 22px, HUD 안내 20px, 버튼 최소 높이 56px(어린이 터치), 글꼴은 시스템 산세리프.

- [ ] **Step 1: `index.html`, `style.css`, `main.js` 작성**

- [ ] **Step 2: 문법 확인**

Run: `node --check prototype/src/main.js`
Expected: 출력 없음

- [ ] **Step 3: 정적 서버로 띄워 브라우저 확인**

Run: `npx --yes serve prototype -l 5173` (또는 `python -m http.server 5173 --directory prototype`)
확인 목록:
1. "파러 가자!" → 만담 1 네 줄이 탭마다 넘어가고 끝나면 발굴 화면.
2. 흙을 드래그하면 먼지가 나고 걷힌다. 돌 위를 드래그해도 아무 일 없고 HUD가 "톡톡 두드려!"로 바뀐다.
3. 돌을 3번 두드리면 깨진다. 빠르게 4번 두드리면 흔들리며 돌이 다시 쌓이고 🐍 대사.
4. 유물 셀의 돌이 깨지면 금빛이 비치고 🐸 "어? 뭔가 반짝여!".
5. 나무를 빠르게 문지르면 "살살! 살살!"만 나오고 안 걷힌다. 천천히 하면 걷힌다.
6. 금관 6칸이 다 드러나면 플래시·소리·확대·만담 2 → "또 파고 싶어?" 화면.
7. 태블릿(또는 크롬 기기 모드 터치)에서 스크롤 없이 같은 동작. 창 크기를 바꿔도 격자가 중앙에 맞게 다시 그려진다.
8. 콘솔에 오류 없음.

- [ ] **Step 4: 발견한 문제 수정 후 전체 테스트**

Run: `npm test`
Expected: 21 passing

- [ ] **Step 5: Commit**

```bash
git add prototype/index.html prototype/style.css prototype/src/main.js
git commit -m "feat(prototype): playable dig prototype with title/wake/dig/found/again flow"
```

---

### Task 9: 시제품 안내 문서

**Files:**
- Create: `prototype/README.md`

- [ ] **Step 1: README 작성** — 실행 방법(정적 서버 한 줄), 테스트 방법(`npm test`), 검증 질문("또 파고 싶어?" 기록이 `localStorage`에 쌓이며 개발자 도구에서 `silla-proto-log`로 확인), 아직 없는 것(단서 카드, 박물관, 토우 합류, 실제 유물 사진, 음성), 금관 도형은 임시이며 권리 확인 뒤 사진으로 교체한다는 안내.

- [ ] **Step 2: Commit**

```bash
git add prototype/README.md
git commit -m "docs(prototype): how to run and what to observe"
```

---

## 검토 뒤 보정 (2026-10-19 최종 리뷰 반영)

- HUD 안내는 전체 진행률이 아니라 **마지막으로 만진 셀의 맨 위 층** 기준이다(`hud.js`의 `hintForLayer`). 전체 기준이면 돌을 보면서도 "문질러"가 나온다.
- `tap`은 돌을 깎을 때마다 `{type:'chip'}`, 돌이 0이 되면 `{type:'rockBroken'}`을 낸다(소리·먼지용). 나무 위 탭은 돌에서 시작한 연타가 이어질 때만 기록한다.
- `rub`/`brush`는 값이 `SNAP_THRESHOLD`(0.08) 아래로 내려가면 0으로 맞춘다. 보이지 않는 찌꺼기가 다음 층 조작을 막지 않게 한다.
- 입력의 거리·속도는 CSS px 기준이고(`DRAG_THRESHOLD_PX` 10), 멈춰 있던 시간은 `MAX_DT_MS`(50)까지만 진척에 반영한다. 격자 안에서 처음 눌린 포인터 하나만 추적한다(가장자리를 쥔 엄지 무시). 돌 위를 40 CSS px 이상 문지르면 `onRockDrag`로 🐍 반응 대사. `input.js`는 가짜 캔버스로 Node에서 테스트한다.

## Self-Review

- **Spec coverage**: 0차 범위(3층 뚫기, 유물 1개, 만담 2개)는 Task 1~8이 덮는다. 반응 대사 3개(살살·와르르·반짝)는 스펙 6-1의 조작 규칙에서 바로 나오므로 포함. 단서 카드·박물관·토우 합류는 1차 범위라 제외(README에 명시).
- **Step scan**: 각 코드 스텝은 시그니처·상수·파일이 고정되어 있고, 렌더러·입력은 테스트 대신 Task 8의 확인 목록으로 검증한다.
- **Type consistency**: `DigState` 필드명(`soil/rock/wood/artifactCells/revealed/glimmered/tapLog/lastTooHardAt/done`)과 이벤트 타입(`collapse/glimmer/tooHard/artifactCell/artifactRevealed`)을 Task 2·3·8에서 동일하게 썼다. `neighbors4`는 Task 2에서 내부 구현 후 Task 5에서 `grid.js`로 옮긴다고 명시했다.
- **Review Focus**: 5개 항목 모두 Task 2·3·6·8의 테스트 또는 확인 목록에 연결했다.
- **Proportion**: 테스트 코드가 가장 길지만 스펙의 수치(600ms, 3탭, 250ms 4연타, 1초 쿨다운)를 고정하는 데 필요한 양이다.
