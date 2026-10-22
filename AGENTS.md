# AGENTS.md

신라 고분 발굴 교육 게임. 초등판 0차 시제품이 `prototype/`에 있다.

- 지금 진행 중인 작업과 제약은 **`docs/handoff/2026-10-19-codex-visual-redesign.md`** 를 먼저 읽는다.
- Suno BGM 작업을 이어갈 때는 **`docs/visual-review/suno-bgm.md`** 의 생성 실패 상태와 입력 보존 절차를 먼저 확인한다.
- 실행: `python -m http.server 5173 --directory prototype` · 테스트: `npm test` (Node 24, 33개 통과 유지)
- 바닐라 ES 모듈, 빌드·npm 의존성 없음, 상대 경로만 (GitHub Pages 하위 주소에서 서비스됨)
- `prototype/src/{dig-model,grid,input,dialogue,hud}.js`와 `prototype/tests/`는 손대지 않는다
- 화면·대사는 한국어, 초등 5~6학년 대상, 무섭거나 유물·장례를 조롱하는 표현 금지
- 저작권 불명 이미지 금지. 직접 그린 SVG/캔버스 또는 CC0만
