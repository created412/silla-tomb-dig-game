// 레벨·유물·토우 데이터. 교사가 코드 없이 난이도·문구를 조정하는 곳.
// rockCoverage: 흙 아래 돌이 있는 비율(0~1). worms: 지렁이 수. 시간 제한은 없다(2026-10-21 기획자 결정).
export const COLS = 12, ROWS = 7;

// shape: [col, row] 오프셋. 6칸.
export const ARTIFACTS = {
  crown:  { name: '금관',            shape: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
  saddle: { name: '천마 그림 말다래', shape: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
  glass:  { name: '유리잔',          shape: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },
  ewer:   { name: '봉수형 유리병',    shape: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },
  belt:   { name: '금제 허리띠',      shape: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
};

// 토우 친구. joinsAt: 처음 쓸 수 있는 무덤(0부터). intro: 합류 장면 대사. real: 도감의 "실제 토우" 설명(교사 승인 대상).
// 이 캐릭터들은 실제 토우를 보고 만든 창작 캐릭터이며 특정 출토품이 아니다.
export const FRIENDS = {
  frog: {
    name: '두꺼비', emoji: '🐸', power: '폴짝 흙 걷기', joinsAt: 0,
    desc: '누른 자리 둘레 3×3 흙을 한 번에 걷어.',
    intro: ['나는 두꺼비! 겁은 많은데 파는 건 잘해.', '흙 위를 누르면 폴짝 뛰어서 넓게 걷어 줄게.'],
    real: '신라 토우에는 개구리·두꺼비 모양이 있어. 뱀이 개구리를 쫓는 장면이 붙은 토기도 남아 있지.',
  },
  bird: {
    name: '새', emoji: '🐦', power: '반짝 탐색', joinsAt: 0,
    desc: '하늘에서 봐서 유물 자리를 3초 동안 알려 줘.',
    intro: ['나는 새! 위에서 보면 다 보여.', '날 누르면 반짝이는 자리를 찍어 줄게.'],
    real: '새 모양 토우와 새 장식은 신라 무덤에서 자주 나와. 새가 하늘과 땅을 이어 준다고 여겼다고 보는 사람도 있어.',
  },
  turtle: {
    name: '거북', emoji: '🐢', power: '든든 돌 밀기', joinsAt: 1,
    desc: '흙이 걷힌 돌을 3×3 한 번에 밀어내. 와르르 없음.',
    intro: ['나는 거북. 느리지만 틀린 적은 없어.', '돌이 보이면 날 불러. 등껍질로 밀어 줄게.'],
    real: '거북 모양 토우도 있어. 거북은 오래 사는 동물이라 귀하게 여겼다고 해.',
  },
  snake: {
    name: '뱀', emoji: '🐍', power: '구불 틈 열기', joinsAt: 2,
    desc: '나무 틈으로 들어가 3×3 나무를 반 넘게 걷어.',
    intro: ['…나는 뱀. 좁은 틈은 내 전문이야.', '나무가 보이면 날 눌러. 금은 안 내고 들어가.'],
    real: '뱀 토우는 개구리를 쫓는 모습으로 자주 나와. 이 둘이 우리 만담 콤비의 뿌리야.',
  },
};

// 도감 맨 위 "토우가 뭐야?" 설명
export const TOWOO_ABOUT = [
  '토우는 흙으로 빚어 구운 작은 인형이야. 손가락만 해.',
  '신라 무덤에서 많이 나와. 동물, 사람, 집, 배 모양까지 있어.',
  '이 친구들은 실제 토우를 보고 만든 창작 캐릭터야. 진짜 유물은 아니야.',
];

export const LEVELS = [
  { id: 'crown',  tomb: '천마총',   rockCoverage: 0,   worms: 2, friends: ['frog', 'bird'], scene: 1 },
  { id: 'saddle', tomb: '천마총',   rockCoverage: 0.4, worms: 3, friends: ['frog', 'bird', 'turtle'], scene: 1 },
  { id: 'glass',  tomb: '천마총',   rockCoverage: 1,   worms: 3, friends: ['frog', 'bird', 'turtle', 'snake'], scene: 1 },
  { id: 'ewer',   tomb: '황남대총', rockCoverage: 1,   worms: 4, friends: ['frog', 'bird', 'turtle', 'snake'], scene: 2 },
  { id: 'belt',   tomb: '황남대총', rockCoverage: 1,   worms: 5, friends: ['frog', 'bird', 'turtle', 'snake'], scene: 2 },
];
