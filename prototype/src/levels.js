// 레벨·유물·토우 데이터. 교사가 코드 없이 난이도를 조정하는 곳.
// sunMs: 해가 떠 있는 시간. rockCoverage: 흙 아래 돌이 있는 비율(0~1). worms: 지렁이 수.
export const COLS = 12, ROWS = 7;

// shape: [col, row] 오프셋. 6칸.
export const ARTIFACTS = {
  crown:  { name: '금관',            shape: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
  saddle: { name: '천마 그림 말다래', shape: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
  glass:  { name: '유리잔',          shape: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },
  ewer:   { name: '봉수형 유리병',    shape: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },
  belt:   { name: '금제 허리띠',      shape: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
};

export const FRIENDS = {
  frog:   { name: '두꺼비', emoji: '🐸', power: '폴짝 흙 걷기' },
  bird:   { name: '새',     emoji: '🐦', power: '반짝 탐색' },
  turtle: { name: '거북',   emoji: '🐢', power: '든든 돌 밀기' },
  snake:  { name: '뱀',     emoji: '🐍', power: '구불 틈 열기' },
};

export const LEVELS = [
  { id: 'crown',  tomb: '천마총',   sunMs: 100000, rockCoverage: 0,   worms: 2, friends: ['frog', 'bird'], scene: 1 },
  { id: 'saddle', tomb: '천마총',   sunMs: 90000,  rockCoverage: 0.4, worms: 3, friends: ['frog', 'bird', 'turtle'], scene: 1 },
  { id: 'glass',  tomb: '천마총',   sunMs: 85000,  rockCoverage: 1,   worms: 3, friends: ['frog', 'bird', 'turtle', 'snake'], scene: 1 },
  { id: 'ewer',   tomb: '황남대총', sunMs: 80000,  rockCoverage: 1,   worms: 4, friends: ['frog', 'bird', 'turtle', 'snake'], scene: 2 },
  { id: 'belt',   tomb: '황남대총', sunMs: 75000,  rockCoverage: 1,   worms: 5, friends: ['frog', 'bird', 'turtle', 'snake'], scene: 2 },
];
