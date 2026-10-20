import {ITEMS,itemById} from './adventure-data.js';
import {createDig,rub,tap,brush,topLayer} from './dig-model.js';
export const QUEST_KEY='silla-towoo-quest-v2';
export const NAMES={frog:'두꺼비',bird:'새',turtle:'거북',snake:'뱀'};
export const POWERS={frog:'폴짝 흙 걷기',bird:'반짝 탐색',turtle:'든든 돌 밀기',snake:'구불 틈 열기'};
export const MISSIONS=[
 {id:'crown',title:'잠든 친구와 첫 금빛',place:'천마총에서 착안',need:['frog'],reward:'bird',story:'두꺼비와 흙을 걷자, 금빛 아래에서 새 토우가 꼼지락!',goal:'두꺼비로 흙을 걷고, 붓으로 금관 찾기',rock:false},
 {id:'saddle',title:'새가 본 하얀 말',place:'천마총에서 착안',need:['bird','frog'],reward:'turtle',story:'새가 하얀 그림을 봤대. 날아가 찾으면 거북 친구도 만날 거야.',goal:'새로 위치 찾기 → 두꺼비로 흙 걷기 → 붓질',rock:false},
 {id:'glass',title:'돌무지 너머 푸른빛',place:'천마총에서 착안',need:['frog','turtle'],reward:'snake',story:'거북이 단단한 돌을 밀어 주면, 뱀이 쉬던 틈이 열려!',goal:'두꺼비로 흙 걷기 → 거북으로 돌 밀기 → 붓질',rock:true},
 {id:'ewer',title:'뱀이 찾은 좁은 틈',place:'황남대총에서 착안',need:['bird','frog','turtle','snake'],reward:null,story:'새가 두 번째 무덤을 찾았어. 이번엔 뱀만 들어갈 수 있는 틈이 보여.',goal:'새로 찾고 → 흙과 돌 걷고 → 뱀으로 틈 열기',rock:true},
 {id:'belt',title:'네 친구의 금빛 작전',place:'황남대총에서 착안',need:['bird','frog','turtle','snake'],reward:null,story:'길게 이어진 금빛! 네 친구가 힘을 합쳐 마지막 유물을 찾아보자.',goal:'네 토우의 능력을 조합해 금제 허리띠 찾기',rock:true},
 {id:'mounds',title:'하늘에서 잇는 두 기억',place:'황남대총에서 착안',need:['bird'],reward:null,story:'유물은 모았어. 이제 새와 두 언덕을 살피면 기억 지도가 완성돼!',goal:'새를 움직여 두 봉분을 각각 조사하기',survey:true},
];
export const freshQuest=()=>({version:2,step:0,friends:[],relics:[],done:[],dig:null,survey:[],slots:Array(6).fill(null),decor:0,practice:0});
export const mission=s=>MISSIONS[Math.min(s.step,5)];
export function wakeToad(s){if(s.step!==0||s.friends.includes('frog'))return false;s.friends.push('frog');return true;}
export function makeSite(n){const m=MISSIONS[n],i=itemById(m.id);if(m.survey)return null;const d=createDig({cols:12,rows:7,artifactCells:i.cells});if(!m.rock)d.rock.fill(0);return d;}
export function packSite(n,d,used,scanned){return {mission:n,soil:[...d.soil],rock:[...d.rock],wood:[...d.wood],used:[...used],scanned:!!scanned};}
export function unpackSite(n,p){const d=makeSite(n);if(!d||!p||p.mission!==n)return {dig:d,used:[],scanned:false};for(const k of ['soil','rock','wood'])d[k].set(p[k]);for(const i of d.artifactCells){if(d.rock[i]===0&&d.soil[i]===0)d.glimmered.add(i);if(d.wood[i]===0)d.revealed.add(i);}d.done=d.revealed.size===d.artifactCells.size;return {dig:d,used:[...p.used],scanned:p.scanned};}
const near=(a,b,r=1)=>Math.abs(a%12-b%12)<=r&&Math.abs(Math.floor(a/12)-Math.floor(b/12))<=r;
export function usePower(s,n,d,who,cell,used,now=0){
 if(!s.friends.includes(who)||!Number.isInteger(cell)||cell<0||cell>=84||!d||d.done)return {ok:false,events:[],message:'아직 함께하지 않는 친구야.'};
 if(who==='bird'){const found=[...d.artifactCells].some(i=>near(i,cell,2));if(found&&!used.includes(who))used.push(who);return {ok:found,events:[],scanned:found,message:found?'찾았다! 반짝이는 자리 아래에 유물이 있어.':'여긴 아닌가 봐. 다른 흙더미를 살펴보자!'};}
 const cells=Array.from({length:84},(_,i)=>i).filter(i=>near(i,cell,who==='frog'?1:1));let count=0;const events=[];
 for(const i of cells){const layer=topLayer(d,i);
  if(who==='frog'&&layer==='soil'){rub(d,i,600);if(d.rock[i]===0&&d.artifactCells.has(i))d.glimmered.add(i);count++;}
  if(who==='turtle'&&layer==='rock'){d.tapLog.delete(i);for(let k=0;k<3;k++)events.push(...tap(d,i,now-600+k*300));count++;}
  if(who==='snake'&&layer==='wood'&&d.wood[i]>.4){events.push(...brush(d,i,(d.wood[i]-.4)*900,.1,now));count++;}
 }
 if(count&&!used.includes(who))used.push(who);
 return {ok:count>0,events,message:count?{frog:'폴짝! 흙이 넓게 걷혔어.',turtle:'으쌰! 돌을 밀어 길을 냈어.',snake:'구불구불! 틈을 열었어. 마지막은 붓으로 살살!'}[who]:{frog:'흙이 남은 곳에 폴짝 뛰어 봐.',turtle:'먼저 흙을 걷고, 보이는 돌을 골라 줘.',snake:'흙과 돌을 걷은 다음 나무 틈을 골라 줘.'}[who]};
}
export const readyToBrush=(n,used)=>MISSIONS[n].need.every(w=>used.includes(w));
export function completeMission(s,n,d,used){
 const m=MISSIONS[n];if(n!==s.step||!m||s.done.includes(m.id))return false;
 if(m.survey?![0,1].every(x=>s.survey.includes(x)):!d?.done||!readyToBrush(n,used))return false;
 s.done.push(m.id);if(!s.relics.includes(m.id))s.relics.push(m.id);if(m.reward&&!s.friends.includes(m.reward))s.friends.push(m.reward);s.step++;s.dig=null;return true;
}
export function placeRelic(s,id,slot){if(!s.relics.includes(id)||!Number.isInteger(slot)||slot<0||slot>=6)return false;const previous=s.slots.indexOf(id),other=s.slots[slot];if(previous>=0)s.slots[previous]=other;else if(other)return false;s.slots[slot]=id;return true;}
export function parseQuest(raw){try{const v=JSON.parse(raw),unique=a=>Array.isArray(a)&&new Set(a).size===a.length,ids=ITEMS.map(i=>i.id);
 if(v?.version!==2||!Number.isInteger(v.step)||v.step<0||v.step>6||!unique(v.friends)||v.friends.some(w=>!NAMES[w])||!unique(v.relics)||v.relics.some(id=>!ids.includes(id))||!unique(v.done)||v.done.join(',')!==MISSIONS.slice(0,v.step).map(m=>m.id).join(',')||v.done.some(id=>!v.relics.includes(id)))return null;
 if(v.step>0&&!v.friends.includes('frog')||v.step>0&&!v.friends.includes('bird')||v.step>1&&!v.friends.includes('turtle')||v.step>2&&!v.friends.includes('snake'))return null;
 const allowed=['frog',...MISSIONS.slice(0,v.step).map(m=>m.reward).filter(Boolean)];if(v.friends.some(w=>!allowed.includes(w))||v.relics.some(id=>!v.done.includes(id)))return null;
 if(!unique(v.survey)||v.survey.some(n=>![0,1].includes(n))||!Array.isArray(v.slots)||v.slots.length!==6||!unique(v.slots.filter(Boolean))||v.slots.some(id=>id!==null&&!v.relics.includes(id))||![0,1,2].includes(v.decor)||!Number.isSafeInteger(v.practice)||v.practice<0)return null;
 if(v.step<5&&v.survey.length||v.step===6&&v.survey.length!==2)return null;
 if(v.dig!==null){const p=v.dig;if(v.step>=5||p.mission!==v.step||!unique(p.used)||p.used.some(w=>!v.friends.includes(w))||typeof p.scanned!=='boolean'||['soil','rock','wood'].some(k=>!Array.isArray(p[k])||p[k].length!==84||p[k].some(n=>!Number.isFinite(n)||n<0||n>1)))return null;
  if(p.soil.some((a,i)=>a>0&&p.wood[i]!==1)||p.rock.some((a,i)=>a>0&&p.wood[i]!==1))return null;
 }
 return {...freshQuest(),...v};}catch{return null;}}
export function migrateAdventure(v){const s=freshQuest();if(!v)return s;for(const m of MISSIONS){if(m.survey||!v.clues?.includes(m.id))break;s.done.push(m.id);s.relics.push(m.id);s.step++;}if(v.friends?.includes('frog')||s.step)s.friends.push('frog');for(const m of MISSIONS.slice(0,s.step))if(m.reward&&!s.friends.includes(m.reward))s.friends.push(m.reward);s.slots=v.slots?.slice(0,6).map(id=>s.relics.includes(id)?id:null)||s.slots;return s;}
export function readQuest(storage,legacy){try{const raw=storage?.getItem(QUEST_KEY);if(raw!==null&&raw!==undefined)return parseQuest(raw)||freshQuest();}catch{}return migrateAdventure(legacy);}
export function writeQuest(storage,s){try{storage.setItem(QUEST_KEY,JSON.stringify(s));return true;}catch{return false;}}
