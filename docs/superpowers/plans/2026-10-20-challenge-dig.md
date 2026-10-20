# 실패가 있는 발굴 도전 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codex의 "토우 탐험대"를 5레벨 발굴 도전 게임으로 바꾼다. 유물이 깨지고(금 3개), 해가 지고(제한시간), 땅속이 매번 다르고(무작위 유물·꽝 돌·지렁이), 토우 능력은 한 판 1회, 별 3단계.

**Architecture:** 도전 규칙은 `challenge.js`(순수, `dig-model.js` 위에 얹음)와 `levels.js`(데이터), `stars-store.js`(저장)에 두고 `node --test`로 고정. 화면은 `main.js`(단계 기계) + 기존 `renderer.js`(Codex 디오라마 렌더러, 수정 없음) + 새 `effects.js`(하늘·해·어둠·금·지렁이 오버레이). Codex의 탐험대·박물관·학습·저장 모듈은 삭제.

**Tech Stack:** 바닐라 ES 모듈, Canvas 2D, Web Audio, Node 24 `node --test`. 빌드·의존성 없음.

**Spec:** `docs/superpowers/specs/2026-10-20-challenge-dig-design.md`

## Global Constraints

- `dig-model.js`, `grid.js`, `input.js`, `dialogue.js`, `hud.js`, `renderer.js`, `terrain.js`, `characters.js`, `clay-art.js`, `generated-art.js`, `artwork.js`와 기존 테스트 33개는 수정하지 않는다.
- 손맛 수치 불변: RUB 600ms/셀, TAP 0.34×3, 4연타 <250ms 와르르, BRUSH 900ms/셀, GENTLE_MAX_SPEED 0.6 CSS px/ms, tooHard 쿨다운 1000ms.
- 상대 경로만. `index.html`은 `src/main.js`를 모듈로 로드.
- 글자 20px 이상, 터치 타깃 44px 이상. 숫자 타이머 없음.
- 무작위는 주입한 `rng()`(0≤x<1)로만. `Math.random`은 `main.js`에서 주입할 때만.
- 한 줄 대사 40자 이내, 반말. 유물·장례 조롱 금지, 피·해골·유령 금지.
- 격자 12×7, 셀 인덱스 `row*12+col`.

## Review Focus

1. 지렁이 도망 2초 동안 해는 흐르고 입력은 막힌다. 그 사이 포인터를 뗐다 다시 누르면 잠금 해제 뒤 정상 동작해야 한다 (input.js는 getState가 null을 주면 추적을 시작하지 않는다 → 잠금 중 pointerdown은 버려지고, 해제 뒤 새 pointerdown부터 동작). Task 6.
2. 나무 탭 = 금 판정은 `input.js` 바깥에서 한다. 흔들림 10 CSS px 이내·300ms 이내 조건이 input.js와 같아야 "돌을 두드리려다 나무를 살짝 스친" 경우에 이중 판정이 생기지 않는다. Task 5 테스트.
3. 해가 지는 순간과 유물이 드러나는 순간이 같은 프레임이면 **찾았다**가 이긴다. Task 2 테스트.
4. 두꺼비 능력으로 지렁이 칸을 걷으면 지렁이가 나와 도망간다(능력이 지렁이를 피하는 치트가 아니다). Task 2 테스트.
5. 별 저장이 깨진 JSON·다른 버전이면 기본값으로 시작하고 예외를 던지지 않는다. Task 3 테스트.

---

## File Structure

**삭제** (Task 1): `prototype/src/{quest-main,quest-model,adventure-art,adventure-model,adventure-ui,companion-model,companion-ui,home-art,learning-data,learning-model,learning-view,story-data,story-model,story-ui,ui-icons}.js`, `prototype/{quest.html,quest.css,adventure.css,companion.css,expedition-design.css,learning.css,story.css,clay-world.css}`, `prototype/assets/{expedition-island,tomb-map-1,tomb-map-2}.svg`, `tools/` 전체.

**생성**
- `prototype/src/levels.js` — ARTIFACTS(모양 오프셋·이름), LEVELS(5개), FRIENDS(이름·능력명). 데이터만.
- `prototype/src/challenge.js` — 한 판의 도전 상태와 규칙. 순수.
- `prototype/src/stars-store.js` — 별 저장·해금. 순수(storage 주입).
- `prototype/src/effects.js` — 하늘·해·어둠·금·지렁이·별 그리기. 캔버스만 받음.
- `prototype/tests/{levels,challenge,stars-store}.test.js`
- `prototype/index.html`, `prototype/style.css`, `prototype/src/main.js` — 전면 재작성.

**유지·수정**: `prototype/src/lines.js`(대사 추가), `prototype/src/sfx.js`(소리 추가), `prototype/src/artifact-stories.js`(유지), `prototype/README.md`(재작성), `prototype/assets/higgsfield/*`(유지).

---

### Task 1: Codex 잔재 정리와 유물 데이터 이전

**Files:**
- Delete: 위 "삭제" 목록
- Create: `prototype/src/levels.js`
- Test: `prototype/tests/levels.test.js`

**Interfaces:**
- Produces:
  ```js
  export const COLS = 12, ROWS = 7;
  export const ARTIFACTS = { crown:{name:'금관', shape:[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]]}, saddle:{name:'천마 그림 말다래', shape:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]}, glass:{name:'유리잔', shape:[[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]]}, ewer:{name:'봉수형 유리병', shape:[[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]]}, belt:{name:'금제 허리띠', shape:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]} };
  export const FRIENDS = { frog:{name:'두꺼비', power:'폴짝 흙 걷기'}, bird:{name:'새', power:'반짝 탐색'}, turtle:{name:'거북', power:'든든 돌 밀기'}, snake:{name:'뱀', power:'구불 틈 열기'} };
  export const LEVELS = [
    { id:'crown',  tomb:'천마총',   sunMs:100000, rockCoverage:0,   worms:2, friends:['frog','bird'], scene:1 },
    { id:'saddle', tomb:'천마총',   sunMs:90000,  rockCoverage:0.4, worms:3, friends:['frog','bird','turtle'], scene:1 },
    { id:'glass',  tomb:'천마총',   sunMs:85000,  rockCoverage:1,   worms:3, friends:['frog','bird','turtle','snake'], scene:1 },
    { id:'ewer',   tomb:'황남대총', sunMs:80000,  rockCoverage:1,   worms:4, friends:['frog','bird','turtle','snake'], scene:2 },
    { id:'belt',   tomb:'황남대총', sunMs:75000,  rockCoverage:1,   worms:5, friends:['frog','bird','turtle','snake'], scene:2 },
  ];
  ```
  (모양은 Codex `adventure-data.js` ITEMS.cells에서 정규화한 것. crown 39..44 = 1×6, saddle 28,29,30,40,41,42 = 3×2, glass 31,32,43,44,55,56 = 2×3, ewer 28,29,40,41,52,53 = 2×3, belt 38,39,40,50,51,52 = 3×2.)

- [ ] **Step 1: Write the failing test** `prototype/tests/levels.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, ARTIFACTS, FRIENDS } from '../src/levels.js';

test('every level names an artifact, 6-cell shape, friends known, sun decreasing', () => {
  assert.equal(LEVELS.length, 5);
  let prevSun = Infinity;
  for (const l of LEVELS) {
    assert.ok(ARTIFACTS[l.id], l.id);
    assert.equal(ARTIFACTS[l.id].shape.length, 6);
    for (const f of l.friends) assert.ok(FRIENDS[f], f);
    assert.ok(l.sunMs < prevSun); prevSun = l.sunMs;
    assert.ok(l.rockCoverage >= 0 && l.rockCoverage <= 1);
    assert.ok(l.worms >= 1);
  }
});
```

- [ ] **Step 2: Run it** `npm test` — Expected: FAIL, "Cannot find module … levels.js"
- [ ] **Step 3: Create `prototype/src/levels.js`** with the Interfaces block verbatim.
- [ ] **Step 4: Run** `npm test` — Expected: 34 pass, 0 fail.
- [ ] **Step 5: Delete the Codex files** listed above with `git rm`. Check nothing left imports them: `grep -rn "quest-\|adventure-\|learning-\|story-\|companion-\|home-art\|ui-icons" prototype/src prototype/*.html prototype/*.css` → Expected: only `main.js` (to be rewritten in Task 7) and no others. `git rm -r tools`.
- [ ] **Step 6: Run** `npm test` — Expected: 34 pass.
- [ ] **Step 7: Commit** `refactor(prototype): 레벨 데이터 분리, Codex 탐험대·박물관·학습 모듈 삭제`

---

### Task 2: challenge.js — 배치·돌·지렁이·금·해·능력·별 (순수)

**Files:**
- Create: `prototype/src/challenge.js`
- Test: `prototype/tests/challenge.test.js`

**Interfaces:**
- Consumes: `levels.js` (LEVELS, ARTIFACTS, COLS, ROWS), `dig-model.js` (`createDig`, `topLayer`, `tap`, `rub`), `grid.js` (`neighbors4` 아님 — 3×3은 직접 계산)
- Produces:
  ```js
  export const CRACKS_TO_BREAK = 3;
  export const WORM_FLEE_MS = 2000;
  export const BIRD_HINT_MS = 3000;
  export const SUNSET_WARN_MS = 20000;
  export const SNAKE_WOOD_FLOOR = 0.4;
  export const DARK_START = 0.75;             // 해 진행 75%부터 어두워짐
  export function placeArtifact(shape, rng) → number[]   // 0행·6행·0열·11열 제외한 사각형 안에 모양이 들어가도록 좌상단을 rng로 고름
  export function createChallenge(level, rng) → ch
    // ch = { level, dig, worms:Set<number>, cracks:0, crackCells:number[], sunMs, elapsedMs:0,
    //        powers:{[who]:1} (level.friends만), fleeUntil:-Infinity, hintUntil:-Infinity, warned:false, outcome:null }
    // dig.rock: coverage 0 → 전부 0; 1 → 전부 1; 0<c<1 → 각 셀 rng()<c 이면 1 아니면 0 (유물 칸은 coverage>0이면 항상 1)
    // worms: 유물 칸이 아닌 셀 중 rng로 level.worms개 (중복 없음)
  export function tick(ch, dtMs) → events        // outcome 있으면 []. elapsed += dt. 남은 시간 ≤ SUNSET_WARN_MS 이고 !warned → [{type:'sunsetWarn'}], warned=true. elapsed ≥ sunMs → outcome='sunset', [{type:'sunset'}]
  export function timeLeftRatio(ch) → 0..1
  export function darkness(ch) → 0..1            // 진행률 p: p<DARK_START → 0, else (p-DARK_START)/(1-DARK_START)
  export function isLocked(ch, nowMs) → boolean  // fleeUntil > nowMs
  export function processEvents(ch, events, nowMs) → events  // 입력 이벤트를 그대로 통과시키고 파생 이벤트를 뒤에 붙임:
    // tooHard(cell∈artifact) → crack, collapse(cell∈artifact) → crack, artifactRevealed → outcome='found' + {type:'found'}
    // crack: cracks++, crackCells.push(cell), {type:'crack',cell,cracks}; cracks≥3 → outcome='broken', {type:'broken'}
    // outcome이 이미 있으면 입력을 통과만 시킨다. found와 sunset이 겹치면 found가 이긴다: processEvents가 found를 먼저 보면 tick은 이후 []를 준다.
  export function afterRub(ch, cell, nowMs) → events  // dig.soil[cell]===0 && worms.has(cell) → worms.delete, fleeUntil=now+WORM_FLEE_MS, [{type:'worm',cell}]
  export function tapWood(ch, cell, nowMs) → events   // topLayer==='wood' && artifact cell → crack(같은 규칙). 아니면 []
  export function usePower(ch, who, cell, nowMs) → { ok, events }
    // powers[who]!==1 → ok:false. 3×3(격자 안) 각 셀에:
    // frog: topLayer==='soil' → soil=0, 그 뒤 afterRub 규칙으로 지렁이 검사(이벤트 합침). 한 칸도 못 걷으면 ok:false(능력 소모 안 함)
    // turtle: topLayer==='rock' → rock=0, tapLog.delete, 유물 칸이면 dig.glimmered.add + {type:'glimmer',cell}. 한 칸도 없으면 ok:false
    // snake: topLayer==='wood' → wood=min(wood, SNAKE_WOOD_FLOOR). 한 칸도 없으면 ok:false. (금 없음, revealed 변화 없음)
    // bird: cell 무시, hintUntil=now+BIRD_HINT_MS, ok:true
    // ok면 powers[who]=0
  export function stars(ch) → 0|1|2|3  // outcome!=='found' → 0; cracks===0 && timeLeftRatio≥0.4 → 3; cracks≤1 → 2; else 1
  ```

- [ ] **Step 1: Write the failing tests** `prototype/tests/challenge.test.js` (seeded rng helper: `const rngOf=(seed)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}`)

```js
test('placeArtifact keeps the whole shape inside the interior', …)  // 200회 반복, 각 셀 row∈[1,5], col∈[1,10], 모양 오프셋 유지
test('level 1 has no rock, level 3 has full rock, level 2 partial with rock on artifact cells', …)
test('worms never sit on artifact cells and count matches level', …)
test('tooHard on artifact cell adds a crack; off artifact does not', …)
test('collapse on artifact cell adds a crack', …)
test('third crack breaks the artifact and sets outcome', …)   // crack 이벤트 3개 → broken, outcome==='broken'
test('tapWood cracks only on wood over artifact', …)          // soil 위 탭 → [], 흙·돌 0으로 만든 유물 칸 → crack
test('rubbing a worm cell to zero releases the worm and locks input for 2s', …)  // afterRub → worm, isLocked(now+1999) true, (now+2000) false, worms.size 감소
test('tick warns once at 20s left and sets sunset at the end', …)
test('found beats sunset in the same frame', …)                // processEvents(artifactRevealed) 뒤 tick(큰 dt) → [] , outcome==='found'
test('frog power clears 3x3 soil and still releases a worm there', …)  // Review Focus 4
test('frog power with no soil in range does not consume the power', …)
test('turtle power breaks rock only where soil is gone and glimmers artifact cells', …)
test('snake power lowers wood to 0.4 without cracks', …)
test('bird power sets hint window and is single-use', …)
test('stars: 3 for clean and fast, 2 for one crack, 1 otherwise, 0 if not found', …)
```

- [ ] **Step 2: Run** `node --test prototype/tests/challenge.test.js` — Expected: FAIL, module not found.
- [ ] **Step 3: Implement `prototype/src/challenge.js`** per Interfaces. 3×3: `for dr,dc in -1..1`, 격자 안만.
- [ ] **Step 4: Run** `npm test` — Expected: 34 + 16 = 50 pass.
- [ ] **Step 5: Commit** `feat(prototype): 도전 규칙 모듈 (무작위 배치·꽝 돌·지렁이·금·해·토우 능력·별)`

---

### Task 3: stars-store.js (순수)

**Files:** Create `prototype/src/stars-store.js`, Test `prototype/tests/stars-store.test.js`

**Interfaces:**
```js
export const STARS_KEY = 'silla-dig-stars-v1';
export function loadStars(storage) → {[levelId]: 0..3}   // storage 없음/깨진 JSON/version≠1 → 전부 0. 예외 없음
export function saveStar(storage, starsObj, levelId, n) → newObj  // max(기존, n), setItem({version:1,stars}) try/catch
export function isUnlocked(starsObj, index) → boolean    // index===0 || starsObj[LEVELS[index-1].id] ≥ 1
```

- [ ] **Step 1: Tests**: 기본값 전부 0 / 깨진 JSON → 0, 예외 없음 / saveStar는 최고값 유지 / isUnlocked 0은 항상, 1은 crown≥1일 때 / storage가 throw해도 saveStar는 객체를 돌려준다.
- [ ] **Step 2: Run** — Expected: FAIL module not found.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` — Expected: 55 pass.
- [ ] **Step 5: Commit** `feat(prototype): 별 저장·해금`

---

### Task 4: 대사와 소리

**Files:** Modify `prototype/src/lines.js`, `prototype/src/sfx.js`

**Interfaces:**
- lines.js LINES에 추가 (who: 'frog'|'snake'):
  ```
  crack1: [frog '으악! 금 갔어! 살살!']
  crack2: [snake '한 번만 더 가면 끝이야…']
  broken: [frog '으아아아!', snake '…복원실로 가자. 다시 파면 돼.']
  sunsetWarn: [snake '해 넘어간다… 서둘러.']
  sunset: [frog '깜깜해… 아무것도 안 보여.', snake '내일 다시. 해는 또 뜨니까.']
  worm: [frog '지, 지렁이다!!', snake '…저게 뭐가 무섭다고.']
  star3: [snake '완벽해. 내가 가르친 보람이 있네.', frog '네가 뭘 가르쳤는데!']
  star2: [frog '찾았다! 조금 긁혔지만!', snake '…다음엔 더 살살.']
  star1: [snake '찾긴 찾았네.', frog '찾았으면 된 거지!']
  powerUsed: [snake '능력은 한 판에 한 번이야.']
  ```
  기존 found 만담의 "금관이야!"는 레벨에 따라 바뀌어야 하므로 `found[0].text`를 `'찾았다! {name}이야!'`로 바꾸고 main.js가 `{name}`을 치환한다.
- sfx.js에 추가: `crackHit()`(낮은 쩍, square 160→60 120ms + sine 50), `shatter()`(crack ×3 간격 60ms + sawtooth 하강 400ms), `worm()`(sine 600→900→600 빠른 흔들 180ms), `star()`(triangle 880, 60ms, gain .2 — 호출마다 같은 음; main이 3번 간격 두고 호출), `sunset()`(sine 330→165 600ms gain .12), `power()`(triangle 440→660 120ms).

- [ ] **Step 1: Add lines and sfx.** (데이터·브라우저 전용, 테스트 없음 — dialogue.test는 LINES 구조를 검사하지 않음.) 40자 확인: `node -e "import('./prototype/src/lines.js').then(m=>{for(const [k,v] of Object.entries(m.LINES))for(const l of v)if([...l.text].length>40)console.log(k,l.text)})"` → Expected: 출력 없음.
- [ ] **Step 2: Run** `npm test` — Expected: 55 pass.
- [ ] **Step 3: Commit** `feat(prototype): 금·해·지렁이·별 대사와 효과음`

---

### Task 5: effects.js — 하늘·해·어둠·금·지렁이·별 그리기

**Files:** Create `prototype/src/effects.js`

**Interfaces:**
- Consumes: `grid.js` `cellRect`
- Produces:
  ```js
  export function createEffects(canvas) → {
    drawSky(progress, bandH, tMs)       // 캔버스 위쪽 0..bandH: 하늘 그라데이션(낮 #9fd3e8 → 노을 #f2a65a → 밤 #1b2440 by progress), 해는 x = w*(0.08+0.84*progress), y = bandH*(0.9 - 0.7*sin(π·progress)), 반지름 bandH*0.22, 노랑→주황. progress<0.25엔 구름 2개 정도(선택)
    drawDarkness(d)                     // 전체에 rgba(10,16,40, 0.8*d)
    drawCracks(cells, layout, tMs)      // 각 셀에 흰빛 금 선 2~3개 (셀 중심에서 뻗는 꺾인 선, 셀 인덱스로 시드), 선 색 #f8f4e6 + 그림자 #2a1a0a
    drawWorm(cell, layout, tMs, untilMs) // untilMs 전까지: 분홍 S자 선(두께 cell*0.12) + 눈 2개, sin(t/80)로 꿈틀, 위로 cell*0.3 튀어 오른 상태
    drawHint(cells, layout, tMs)        // 별(노랑) 깜빡임 (renderer.hint 대신 사용: renderer는 수정하지 않으므로 여기서 그림)
    drawStars(n, tMs, sinceMs)          // found 화면: 화면 상단 중앙 별 3개 틀, sinceMs마다 0.5초 간격으로 n개 켜짐 (켜질 때 scale 1.6→1 팝)
  }
  ```
- [ ] **Step 1: Implement** (브라우저 전용, 테스트 없음). 모든 치수는 `dp = canvas.width / canvas.getBoundingClientRect().width`로 CSS px 기준.
- [ ] **Step 2: Syntax check** `node --check prototype/src/effects.js` — Expected: 출력 없음.
- [ ] **Step 3: Commit** `feat(prototype): 하늘·해·어둠·금·지렁이·별 오버레이`

---

### Task 6: index.html + style.css

**Files:** Rewrite `prototype/index.html`, `prototype/style.css`

**Structure** (id 고정, main.js가 참조):
```html
<div id="stage">
  <canvas id="dig"></canvas>
  <div id="hud" class="hidden"><div id="level-name"></div><div id="hint"></div><div id="cracks" aria-label="유물 금"><span class="crack"></span><span class="crack"></span><span class="crack"></span></div></div>
  <div id="powers" class="hidden"><!-- main.js가 버튼 생성: <button data-who="frog" class="power"><span class="emoji">🐸</span><span class="name">두꺼비</span><span class="desc">폴짝 흙 걷기</span></button> --></div>
  <div id="dialogue" class="hidden"><span id="speaker"></span><span id="line"></span><span id="tap-hint">▶</span></div>
  <div id="title" class="overlay"><h1>토우 친구들과<br>신라 발굴 도전</h1><p class="sub">해 지기 전에, 유물을 깨뜨리지 말고!</p><div id="levels"></div></div>
  <div id="card" class="overlay hidden"><h2 id="card-title"></h2><p id="card-info"></p><p id="card-friends"></p><button id="btn-start" class="big">파러 가자!</button><button id="btn-back" class="big ghost">무덤 고르기</button></div>
  <div id="result" class="overlay hidden"><h2 id="result-title"></h2><p id="result-sub"></p><div class="row"><button id="btn-retry" class="big">다시 파기</button><button id="btn-next" class="big">다음 무덤</button><button id="btn-story" class="big ghost">유물 이야기</button><button id="btn-home" class="big ghost">무덤 고르기</button></div></div>
  <dialog id="story"><button id="story-close" class="big ghost">닫기</button><h2 id="story-title"></h2><p id="story-what"></p><p id="story-hello"></p><p id="story-note"></p></dialog>
</div>
```
- `#levels`의 카드: `<button class="level" data-index="0"><span class="num">1</span><span class="name">금관</span><span class="tomb">천마총</span><span class="stars">☆☆☆</span></button>`; 잠김은 `disabled` + `🔒`.
- `#powers`는 오른쪽 세로 열(위치 absolute, right 12px, top 50% 변환), 버튼 64×64 이상, `[data-used="1"]`은 흐림+취소선, `[aria-pressed=true]`는 금색 테두리.
- 색: 기존 테마(청록 #143c30, 금 #ffd47a, 종이 #fff7e2). 폰트 시스템. `#stage{height:100dvh}` with `100vh` 폴백. `user-select:none; -webkit-touch-callout:none`.
- `#cracks .crack`은 회색 금 아이콘 3개, `.on`이면 흰색으로 켜짐 + 흔들 애니메이션.

- [ ] **Step 1: Write both files.**
- [ ] **Step 2: Commit** `feat(prototype): 도전판 화면 뼈대와 스타일`

---

### Task 7: main.js — 단계 기계와 연결

**Files:** Rewrite `prototype/src/main.js`

**Interfaces:** Consumes everything above plus `renderer.js` (`createRenderer(canvas)` → `draw(state,layout,t,phase,elapsed)`, `setArtifact`, `setScene`, `setCrew`, `react`, `speak`, `shake`, `flash`, `addDust(cell,layout,t,kind)`, `reset`), `input.js` (`attachInput`, `DRAG_THRESHOLD_PX`, `TAP_MAX_MS`), `hud.js`, `dialogue.js`, `artifact-stories.js`.

**Phases:** `title` → `card` → (`wake` 레벨1 첫 판만) → `dig` → `found` | `broken` | `sunset` → `result`.

**Layout:** `TOP_PAD = 72` (하늘 띠 56 + 여백), `BOTTOM_PAD = 150` (토우 서는 자리), `RIGHT_PAD = 110` (능력 열). `layoutGrid({width: canvas.width - RIGHT_PAD*dpr, height: canvas.height-(TOP_PAD+BOTTOM_PAD)*dpr, cols:12, rows:7, padding:16*dpr})`, `layout.y0 += TOP_PAD*dpr`.

**Key behaviors:**
- `startLevel(index)`: `ch = createChallenge(LEVELS[index], Math.random)`; `renderer.reset(); setArtifact(id); setScene(level.scene===2); setCrew(level.friends)`; 능력 버튼 생성; 금 표시 초기화; phase=`dig` (또는 레벨1 첫 판이면 `wake` 만담 뒤 dig). `digStartedAt`.
- `attachInput(canvas, { getLayout, getState: () => phase==='dig' && !isLocked(ch, now()) ? ch.dig : null, onEvents: e => handle(processEvents(ch, e, now())), onRub: cell => { dust; sfx.rub(); handle(afterRub(ch, cell, now())); }, onBrush: sfx.brush, onTouchCell: cell => lastTouchedCell=cell, onRockDrag: () => playReaction('rockDrag') })`.
- 나무 탭 판정 (Review Focus 2): canvas `pointerdown`에 CSS 좌표·시각 기록, `pointerup`에서 `hypot ≤ DRAG_THRESHOLD_PX && dt < TAP_MAX_MS && phase==='dig' && !locked` → `handle(tapWood(ch, cellAt(...), now()))`. 능력 선택 중(`selectedPower`)이면 탭은 능력 사용으로 간다 (아래).
- 능력: 버튼 클릭 → `selectedPower=who`(bird는 즉시 `usePower`). 땅 pointerdown(셀 안)에서 `selectedPower`면 `usePower(ch, who, cell, now())` → ok면 파티클(frog 'soil'×9, turtle 'rock'×9, snake 'wood'), `sfx.power()`, `renderer.speak(who)`+`react('glimmer')`, 버튼 `data-used=1`; ok 아니면 `playReaction`에 who별 안내("흙이 있는 곳에…" 등 lines.js `powerMiss`에 추가해도 됨 — 빌더 선택). 선택 해제. 선택 중에는 getState가 null을 주어 일반 발굴 입력을 막는다.
- `handle(events)`: `tooHard`→react('tooHard'), speak frog, reaction; `collapse`→shake, sfx.collapse, reaction; `glimmer`→sfx.glimmer, reaction; `chip`/`rockBroken`→sfx.tap/crack, dust; `crack`→sfx.crackHit, shake 250, 금 아이콘 n개 `.on`, reaction `crack1`(1개)/`crack2`(2개); `broken`→`onBroken()`; `worm`→sfx.worm, wormCell/wormUntil 기록, react('tooHard') frog, reaction `worm`; `found`→`onFound()`; `sunsetWarn`→reaction `sunsetWarn`, sfx.sunset; `sunset`→`onSunset()`.
- `onFound()`: `foundAt=now`, flash, sfx.found, phase=`found`, 300ms 뒤 `playTalk('found')`(0번째 줄 `{name}` 치환), 만담 끝나면 `showResult('found')`: 별 `n=stars(ch)`, `saveStar`, 별 켜질 때마다 `sfx.star()`(0.5초 간격), 대사 `star3/star2/star1`, 버튼: 다시 파기·다음 무덤(마지막 레벨이면 숨김)·유물 이야기·무덤 고르기.
- `onBroken()`: 유물 칸마다 `addDust(cell,layout,t,'gold')`, shake 600, sfx.shatter, phase=`broken`, 700ms 뒤 `playTalk('broken')` → 끝나면 `showResult('broken')` (제목 "유물이 깨졌어…", 버튼: 다시 파기·무덤 고르기).
- `onSunset()`: sfx.sunset, phase=`sunset`(어둠 1.0), `playTalk('sunset')` → `showResult('sunset')` (제목 "해가 졌어…").
- 프레임: `dt = min(50, t-lastT)`. phase==='dig' → `handle(tick(ch, dt))`; `renderer.draw(ch?.dig ?? null, layout, t, phaseForRenderer, t-foundAt)`; 그 위에 `effects.drawSky(1-timeLeftRatio, TOP_PAD-16 CSS px, t)` (dig/found/broken/sunset), `drawHint` (hintUntil>t), `drawCracks(ch.crackCells)`, `drawWorm`(wormUntil>t), `drawDarkness(phase==='sunset'?1:darkness(ch))`, result에서 `drawStars`. HUD: `hint` = `hintForLayer(topLayer(dig,lastTouchedCell))`, 잠금 중엔 "🐸 도망갔다! 잠깐만…".
- `phaseForRenderer`: title→'title', card→'title', wake/dig/broken/sunset→'dig', found/result(found)→'found' (elapsed), result(broken|sunset)→'dig'.
- 제목 화면 `#levels`: `loadStars` → 카드 5개, 잠김은 disabled. 클릭 → `card` 표시 (해 시간은 "해 ☀️ 보통/짧음" 대신 레벨 표의 초를 "해가 떠 있는 시간: 약 1분 40초"처럼 **문장**으로; 숫자 타이머 금지는 발굴 중 표시에 한함).
- `playTalk`/`playReaction`/`advance` 150ms 가드: 기존 0차 main.js와 동일 방식.

- [ ] **Step 1: Write main.js.**
- [ ] **Step 2: Syntax check** `node --check prototype/src/main.js`.
- [ ] **Step 3: Browser check** (`python -m http.server 5173 --directory prototype`, Chrome): 레벨 1에서 (a) 찾았다 → 별, (b) 나무 탭 3번 → 깨짐, (c) 가만히 100초 → 해 짐. 콘솔 오류 0. 각 결말 스크린샷.
- [ ] **Step 4: Commit** `feat(prototype): 5레벨 발굴 도전 — 금·해·지렁이·토우 능력·별`

---

### Task 8: README와 인수인계 문서 갱신

**Files:** Rewrite `prototype/README.md`; `docs/handoff/2026-10-19-codex-visual-redesign.md` 맨 위에 "2026-10-20: 이 문서의 작업은 끝났고, 이후 도전판으로 재구성됨 → `docs/superpowers/specs/2026-10-20-challenge-dig-design.md`" 한 줄.

- [ ] **Step 1: Write.**
- [ ] **Step 2: `npm test`** — Expected: 55 pass.
- [ ] **Step 3: Commit** `docs(prototype): 도전판 실행·규칙 안내`
