// 유물마다 4컷 "기억 조각". 유물이 드러나는 동안 한 컷씩 열리고, 4컷째는 아이가 말풍선을 고른다.
// 그림: assets/higgsfield/comic-<id>.png (2×2 격자, 글자 없음). 글은 전부 여기 — 교사가 코드 모르고 고친다.
// 고증 원칙: 1500년 전 생활 장면은 "이렇게 썼을지도 몰라"로 말한다. 유물·장례 조롱 금지.
// cue: 몇 컷째를 언제 여는가 — glimmer(처음 반짝), half(유물 절반 드러남), reveal(다 드러남), pickup(꺼내기 전)
export const COMICS = {
  crown: {
    title: '금관의 기억',
    panels: [
      { who: 'frog', text: '머리에 금빛 숲이 올라가 있어!' },
      { who: 'snake', text: '걸을 때마다 달개가 달랑달랑. 눈부셨지.' },
      { who: 'bird', text: '멀리서도 누가 제일 높은 사람인지 보였어.' },
    ],
    question: '그러니까 금관은…',
    choices: [
      { text: '왕의 이름표야!', right: false, gag: { who: 'snake', text: '이름표면 글자가 있어야지. 금관엔 글자가 없어.' } },
      { text: '높은 사람이라는 표시야.', right: true, gag: { who: 'frog', text: '맞아! 그런데 누군지 이름은 아직 몰라.' } },
      { text: '모자 가게에서 파는 거야.', right: false, gag: { who: 'bird', text: '이 금으로 가게를 열면 열 채는 사겠다.' } },
    ],
  },
  saddle: {
    title: '말다래의 기억',
    panels: [
      { who: 'frog', text: '말을 타고 달렸어. 안장 옆에 판이 달려 있었지.' },
      { who: 'snake', text: '진흙이 튀어도 판이 막아 줬어. 그게 말다래.' },
      { who: 'bird', text: '자작나무 껍질에 하얀 말을 그렸어. 하늘을 나는 말!' },
    ],
    question: '말다래는 어디에 쓰는 물건?',
    choices: [
      { text: '방 벽에 거는 액자', right: false, gag: { who: 'snake', text: '액자였으면 흙탕물이 왜 묻어 있겠어.' } },
      { text: '말 안장 옆에 다는 가림판', right: true, gag: { who: 'frog', text: '맞아! 그래서 무덤 이름도 천마총이 됐어.' } },
      { text: '썰매', right: false, gag: { who: 'bird', text: '그걸 타고 내려오면 그림이 다 닳겠다.' } },
    ],
  },
  glass: {
    title: '유리잔의 기억',
    panels: [
      { who: 'snake', text: '아주 먼 서쪽 나라에서 유리를 불어 잔을 만들었어.' },
      { who: 'bird', text: '상인들 손에서 손으로, 먼 길을 건너왔지.' },
      { who: 'frog', text: '신라에서는 보물처럼 귀하게 여겼어. 푸른빛!' },
    ],
    question: '이 잔이 알려 주는 건?',
    choices: [
      { text: '신라 사람이 직접 서쪽에 갔다', right: false, gag: { who: 'snake', text: '물건이 온 건 맞는데, 사람이 갔는지는 몰라.' } },
      { text: '먼 곳과 물건이 오갔다', right: true, gag: { who: 'frog', text: '맞아! 신라는 먼 나라와도 이어져 있었어.' } },
      { text: '유리는 신라 특산품이다', right: false, gag: { who: 'bird', text: '그랬으면 이렇게 귀하게 묻지 않았겠지.' } },
    ],
  },
  ewer: {
    title: '유리병의 기억',
    panels: [
      { who: 'bird', text: '새 부리처럼 생긴 주둥이로 물을 따랐어. 내 부리 같지?' },
      { who: 'frog', text: '어느 날 손잡이가 툭! 깨져 버렸어.' },
      { who: 'snake', text: '버리지 않고 금실로 감아서 고쳤어.' },
    ],
    question: '이 병을 어떻게 여겼을까?',
    choices: [
      { text: '깨져서 버렸어', right: false, gag: { who: 'snake', text: '버렸으면 무덤에 왜 같이 묻혔겠어.' } },
      { text: '아껴서 고쳐 썼어', right: true, gag: { who: 'frog', text: '맞아! 금실 수리 자국이 그 증거야.' } },
      { text: '새 걸 하나 더 샀어', right: false, gag: { who: 'bird', text: '서쪽 나라까지 다시 주문하려면 몇 년은 걸려.' } },
    ],
  },
  belt: {
    title: '허리띠의 기억',
    panels: [
      { who: 'frog', text: '허리에 금판을 이어 만든 띠를 둘렀어.' },
      { who: 'snake', text: '물고기, 굽은 옥, 작은 칼… 드리개가 달랑달랑.' },
      { who: 'bird', text: '장인이 작은 금판을 하나하나 이어 붙였지.' },
    ],
    question: '물고기 모양은 뭘까?',
    choices: [
      { text: '낚시 도구', right: false, gag: { who: 'snake', text: '금 물고기로 낚시하면 물고기가 도망가겠다.' } },
      { text: '허리띠에 매단 장식', right: true, gag: { who: 'frog', text: '맞아! 높은 사람의 화려한 꾸밈이야.' } },
      { text: '도시락', right: false, gag: { who: 'bird', text: '…배고프니?' } },
    ],
  },
};

// 어느 유물이 몇 % 드러났을 때 몇 컷째를 여는가
export const PANEL_CUES = [0, 0.5, 1]; // 1컷: 첫 반짝임, 2컷: 절반, 3컷: 전부. 4컷(질문)은 발견 연출 뒤
