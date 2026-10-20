export const CHAPTERS=[
 {title:'반짝이는 기억',site:'천마총에서 착안',items:['crown','saddle','glass'],names:['빛나는 말발자국','푸른 잔의 주인','세 단서의 주인'],intro:['개구리: 우리 주인이 기억 안 나. 같이 찾아줄래?','뱀: 네 손을 빌려줘. 나는 손이 없거든.'],ending:'새: 저쪽엔 언덕이 두 개야! 나랑 가 볼래?'},
 {title:'두 언덕의 비밀',site:'황남대총에서 착안',items:['ewer','belt','mounds'],names:['소중한 것을 지킨 사람들','두 언덕의 반짝이','금실로 이은 기억'],intro:['새: 반짝이는 자리는 내가 찾아줄게!','거북: 이번에는 물건에 남은 손길도 살펴보자.'],ending:'개구리: 이름은 몰라도, 남긴 흔적은 기억할 수 있겠다!'},
];
export const ITEMS=[
 {id:'crown',name:'금관',kind:'dig',cells:[39,40,41,42,43,44],hint:'금으로 만든 화려한 장식이야.',question:'무엇을 알 수 있을까?',choices:['높은 지위','정확한 이름'],icons:['person','name'],answer:0,clue:'높은 지위',reason:'화려한 금 장식으로 높은 지위를 짐작해.',joke:'뱀: 이름표인 줄 알았는데… 텅 비었네!',comic:'scroll',next:'나무 바닥에 그림이 숨어 있어!'},
 {id:'saddle',name:'천마 그림 말다래',kind:'dig',cells:[28,29,30,40,41,42],hint:'안장에 달아 진흙이 튀는 걸 막았어.',question:'어디에 쓰는 물건일까?',choices:['말의 안장 옆','방 안의 벽'],icons:['horse','frame'],answer:0,clue:'말을 타는 생활',reason:'말다래는 말의 안장 옆에 다는 물건이야.',joke:'개구리: 액자야? 뱀: 내 꼬리도 액자 아니야!',comic:'frame',next:'거북: 저쪽에 푸른빛이 보여.'},
 {id:'glass',name:'유리잔',kind:'dig',cells:[31,32,43,44,55,56],hint:'먼 지역에서도 비슷한 유리잔이 나와.',question:'어떤 흔적일까?',choices:['주인이 직접 여행','먼 곳과 물건 교류'],icons:['traveler','trade'],answer:1,clue:'먼 곳과 교류',reason:'물건이 오간 흔적이야. 주인이 갔는지는 몰라.',joke:'뱀: 여행은 내가 갈게! …짐은 누가 들지?',comic:'trip',next:'세 기억을 모았어. 주인을 꾸며 보자!'},
 {id:'ewer',name:'봉수형 유리병',kind:'dig',cells:[28,29,40,41,52,53],hint:'깨진 손잡이를 금실로 고친 흔적이 있어.',question:'이 병을 어떻게 여겼을까?',choices:['아껴서 고쳐 썼어','깨진 걸 몰랐어'],icons:['repair','sleep'],answer:0,clue:'아껴서 고쳐 쓴 물건',reason:'금실로 수리한 흔적에서 아꼈던 마음을 짐작해.',joke:'뱀: 나도 못 봤어… 새: 잠깐, 눈부터 떠!',comic:'sleep',next:'새: 다른 쪽 방에도 금빛이 있어!'},
 {id:'belt',name:'금제 허리띠',kind:'dig',cells:[38,39,40,50,51,52],hint:'물고기와 굽은 옥 모양 장식이 달렸어.',question:'무엇을 꾸미는 물건일까?',choices:['낚싯줄','사람의 허리'],icons:['fish','person'],answer:1,clue:'화려하게 꾸민 허리',reason:'여러 장식을 늘어뜨린 금제 허리띠야.',joke:'뱀: 물고기다! 새: 그건 물고기 모양 장식!',comic:'fish',next:'새: 위에서 보니 이상해. 언덕이… 두 개?'},
 {id:'mounds',name:'두 봉분 조사 그림',kind:'survey',cells:[],hint:'땅 위에서 살펴본 황남대총의 모습이야.',question:'봉분은 어떻게 이어졌을까?',choices:['하나의 봉분','두 봉분이 붙었어'],icons:['one-hill','two-hills'],answer:1,clue:'이어진 두 봉분',reason:'남쪽과 북쪽의 두 무덤이 맞붙어 있어.',joke:'뱀: 하나! 새: 네 꼬리가 하나를 가렸잖아!',comic:'tail',next:'두 언덕의 기억도 우리 박물관으로!'},
];
export const SILLY=['헤드폰','스마트폰','게임패드','우주선','스케이트보드','전동킥보드'];
export const DECOR={wall:[{name:'숲빛',need:0,color:'#244f45'},{name:'햇살',need:3,color:'#705438'},{name:'밤하늘',need:9,color:'#2d365e'}],floor:[{name:'흙빛',need:0,color:'#a88254'},{name:'풀빛',need:6,color:'#6e8556'},{name:'돌빛',need:12,color:'#7c8990'}],light:[{name:'포근',need:0,color:'#fff1b3'},{name:'노을',need:9,color:'#ffc38b'},{name:'달빛',need:15,color:'#c9e4ff'}]};
export const itemById=id=>ITEMS.find(i=>i.id===id);
