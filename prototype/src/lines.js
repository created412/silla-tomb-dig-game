// 토우 콤비 대사. who: 'frog' (🐸 두꺼비) | 'snake' (🐍 뱀). 각 줄 40자 이내, 반말.
// found[0]의 {name}은 main.js가 유물 이름으로 바꾼다.
export const LINES = {
  wake: [
    { who: 'frog', text: '오래 잠들었더니… 우리 주인이 기억 안 나.' },
    { who: 'snake', text: '저기 반짝이는 게 단서 아닐까?' },
    { who: 'frog', text: '같이 찾아줄래? 나는 손이 너무 작아.' },
    { who: 'snake', text: '나는 손도 없어. 네 손을 빌려줘!' },
  ],
  found: [
    { who: 'frog', text: '찾았다! {name}이야!' },
    { who: 'snake', text: '이걸 쓰던 사람… 우리 주인이었을까?' },
    { who: 'frog', text: '반짝이는 건 기억나는데, 이름은 안 떠올라.' },
    { who: 'snake', text: '잠깐, 저 돌이 우리 말을 듣고 있어.' },
  ],
  tooHard: [{ who: 'frog', text: '살살! 살살!' }],
  collapse: [{ who: 'snake', text: '와르르… 천천히 톡톡 해.' }],
  glimmer: [{ who: 'frog', text: '어? 뭔가 반짝여!' }],
  rockDrag: [{ who: 'snake', text: '돌은 문질러도 소용없어. 톡톡 두드려.' }],

  crack1: [{ who: 'frog', text: '으악! 금 갔어! 살살!' }],
  crack2: [{ who: 'snake', text: '한 번만 더 가면 끝이야…' }],
  broken: [
    { who: 'frog', text: '으아아아!' },
    { who: 'snake', text: '…복원실로 가자. 다시 파면 돼.' },
  ],
  sunsetWarn: [{ who: 'snake', text: '해 넘어간다… 서둘러.' }],
  sunset: [
    { who: 'frog', text: '깜깜해… 아무것도 안 보여.' },
    { who: 'snake', text: '내일 다시. 해는 또 뜨니까.' },
  ],
  worm: [
    { who: 'frog', text: '지, 지렁이다!!' },
    { who: 'snake', text: '…저게 뭐가 무섭다고.' },
  ],
  star3: [
    { who: 'snake', text: '완벽해. 내가 가르친 보람이 있네.' },
    { who: 'frog', text: '네가 뭘 가르쳤는데!' },
  ],
  star2: [
    { who: 'frog', text: '찾았다! 조금 긁혔지만!' },
    { who: 'snake', text: '…다음엔 더 살살.' },
  ],
  star1: [
    { who: 'snake', text: '찾긴 찾았네.' },
    { who: 'frog', text: '찾았으면 된 거지!' },
  ],
  powerUsed: [{ who: 'snake', text: '능력은 한 판에 한 번이야.' }],
  powerMissFrog: [{ who: 'frog', text: '흙이 있는 곳을 눌러 줘!' }],
  powerMissTurtle: [{ who: 'snake', text: '흙을 걷어서 돌이 보이는 곳에.' }],
  powerMissSnake: [{ who: 'snake', text: '나무가 보이는 틈이어야 들어가지.' }],
  locked: [{ who: 'snake', text: '두꺼비 도망갔다. 잠깐만…' }],
};
