// 관찰 사실, 추론, 가상 토우 대사를 구분한다. 출처/검토 범위: docs/visual-review/story.md
export const ARTIFACTS = [
  {
    id:'crown', name:'금관', location:'첫 단서 · 흙 속의 금빛', foundTitle:'찾았다, 신라의 금관!',
    foundHint:'빛나는 장식에 어떤 이야기가 담겼을까?', cells:[39,40,41,42,43,44],
    observations:[
      {id:'gold',label:'금으로 만든 띠',text:'빛나는 금으로 띠와 장식을 만들었어.',x:50,y:66},
      {id:'ornaments',label:'세움 장식과 굽은 옥',text:'나뭇가지·뿔 모양 장식에 옥도 달렸어.',x:52,y:28},
    ],
    question:'금관에서 주인의 어떤 모습을 짐작할까?',
    options:['높은 지위의 사람이었을 거야','정확히 어느 왕인지 알겠어'],answer:0,
    retry:'뱀: 이름표인 줄 알았는데… 이름이 없네!',
    reason:'화려한 금 장신구는 높은 지위를 짐작하게 해.',
    clue:'높은 지위', caption:'금관으로 보아 높은 지위의 사람이었을 거야.',
    memory:'개구리: 반짝이는 장식은 기억나. 얼굴은 흐릿해.',
    next:'옆의 나무 바닥을 더 살펴보자',
  },
  {
    id:'saddle',name:'천마 그림 말다래',location:'두 번째 단서 · 나무 바닥',foundTitle:'나무껍질에 그림이 있어!',
    foundHint:'원본은 전문가에게 맡기고 복제 그림을 살펴봐.',cells:[28,29,30,40,41,42],
    observations:[
      {id:'horse',label:'하늘을 달리는 듯한 그림',text:'말처럼 생긴 동물이 힘차게 달리는 그림이야.',x:50,y:48},
      {id:'strap',label:'위쪽의 띠고리',text:'안장에 매달아 진흙이 튀는 것을 막았어.',x:35,y:15},
    ],
    question:'이 물건은 어떤 생활과 이어질까?',
    options:['무덤 벽에 그림을 그리는 생활','말을 타는 생활'],answer:1,
    retry:'뱀: 벽에 걸려 했더니… 안장에 다는 거네!',
    reason:'말다래는 안장 옆에 다는 물건이야. 벽화가 아니야.',
    clue:'말을 타는 생활',caption:'말다래는 말을 타는 생활과 관련된 단서야.',
    memory:'개구리: 다그닥 소리가 떠올라! 말과 관련 있겠어.',
    next:'거북이 가리킨 푸른빛을 따라가자',
  },
  {
    id:'glass',name:'유리잔',location:'세 번째 단서 · 푸른빛',foundTitle:'마지막 단서, 푸른 유리잔!',
    foundHint:'이 작은 잔은 얼마나 먼 길을 왔을까?',cells:[31,32,43,44,55,56],
    observations:[
      {id:'blue',label:'짙은 남색 유리',text:'빛을 비추면 속이 비치는 남색 유리잔이야.',x:45,y:48},
      {id:'pattern',label:'줄무늬와 거북등무늬',text:'비슷한 유리그릇이 먼 지역에서도 발견돼.',x:62,y:68},
    ],
    question:'유리잔은 어떤 이야기를 들려줄까?',
    options:['주인이 직접 외국에 갔다는 증거야','먼 지역과 물건이 오갔을 수 있어'],answer:1,
    retry:'뱀: 잔은 왔어도, 주인이 갔는지는 모르겠네.',
    reason:'먼 곳과의 교류를 짐작해. 정확한 제작지는 더 연구해.',
    clue:'먼 곳과의 교류',caption:'유리잔은 먼 지역과 물건이 오간 흔적일 수 있어.',
    memory:'거북: 세 물건이 한 사람의 삶을 조금씩 보여 주네.',
    next:'세 단서로 주인의 이야기를 모으자',
  },
];

export const NICKNAMES=['빛나는 말발자국','푸른 잔의 주인','세 단서의 주인'];
export const STORY_TALKS={
  join:[
    {who:'frog',text:'금관은 찾았는데… 우리 주인은 누구지?'},
    {who:'turtle',text:'잠깐. 금관만으로 이름은 알 수 없어.'},
    {who:'snake',text:'돌인 줄 알았더니, 너도 토우였어?'},
    {who:'turtle',text:'난 거북이야. 흔적을 하나씩 모아 보자.'},
  ],
  toSaddle:[
    {who:'frog',text:'기억이 조금 돌아왔어. 반짝이는 장식!'},
    {who:'turtle',text:'옆의 나무 바닥에도 무언가 남아 있어.'},
    {who:'snake',text:'내가 틈을 찾았어. 이번엔 내 차례지?'},
    {who:'frog',text:'길은 네가, 붓질은 우리 탐험대가!'},
  ],
  saddleFound:[
    {who:'frog',text:'말처럼 생긴 그림이야! 벽화인가?'},
    {who:'turtle',text:'자작나무 껍질로 만든 말다래야.'},
    {who:'turtle',text:'원본은 전문가에게. 우린 복제 그림을 보자.'},
    {who:'snake',text:'좋아. 그림 속 단서를 찾아보자.'},
  ],
  toGlass:[
    {who:'frog',text:'다그닥! 그림을 보니 그 소리가 떠올라.'},
    {who:'snake',text:'그건 네가 입으로 낸 소리잖아.'},
    {who:'turtle',text:'저쪽 틈에 푸른빛이 보여. 마지막 단서야.'},
    {who:'frog',text:'정말! 이번에도 살살 찾아보자.'},
  ],
  glassFound:[
    {who:'snake',text:'파란 돌인 줄 알았는데… 잔이네?'},
    {who:'frog',text:'속이 비쳐! 무늬도 있어.'},
    {who:'turtle',text:'먼 지역의 유리그릇과 닮은 점이 있어.'},
    {who:'frog',text:'이제 세 단서를 한자리에 모아 보자!'},
  ],
};
