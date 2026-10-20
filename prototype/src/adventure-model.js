import {CHAPTERS,ITEMS,DECOR,itemById} from './adventure-data.js';
export const ADVENTURE_KEY='silla-adventure-v1';
export const freshAdventure=()=>({version:1,chapter:0,index:0,dig:null,found:[],clues:[],misses:{},owners:[[],[]],names:[null,null],slots:Array(8).fill(null),labels:[],decor:{wall:0,floor:0,light:0},friends:['frog','snake'],aids:[],completed:[]});
export const currentItem=s=>itemById(CHAPTERS[s.chapter].items[s.index]);
export function markFound(s){const i=currentItem(s);if(i&&!s.found.includes(i.id))s.found.push(i.id);s.dig=null;}
export function captureDig(s,state){const i=currentItem(s);if(!i||i.kind!=='dig'||s.found.includes(i.id))return;s.dig={id:i.id,soil:Array.from(state.soil),rock:Array.from(state.rock),wood:Array.from(state.wood)};}
export function restoreDig(s,state){const d=s.dig;if(!d||d.id!==currentItem(s)?.id)return false;for(const k of ['soil','rock','wood'])state[k].set(d[k]);for(const cell of state.artifactCells){if(state.soil[cell]===0&&state.rock[cell]===0)state.glimmered.add(cell);if(state.wood[cell]===0)state.revealed.add(cell);}return true;}
export function answerCard(s,id,answer){const i=currentItem(s);if(!i||i.id!==id||!s.found.includes(id)||![0,1].includes(answer))return 'locked';if(s.clues.includes(id))return 'solved';if(answer!==i.answer){s.misses[id]=(s.misses[id]||0)+1;return 'retry';}s.clues.push(id);return 'solved';}
export function advanceItem(s){const i=currentItem(s);if(!i||!s.clues.includes(i.id))return false;s.index++;return true;}
export function attachSticker(s,id){if(!CHAPTERS[s.chapter].items.includes(id)||!s.clues.includes(id))return false;if(!s.owners[s.chapter].includes(id))s.owners[s.chapter].push(id);return true;}
export function finishOwner(s,nameIndex){if(s.index!==3||s.owners[s.chapter].length!==3||!Number.isInteger(nameIndex)||!CHAPTERS[s.chapter].names[nameIndex])return false;s.names[s.chapter]=CHAPTERS[s.chapter].names[nameIndex];if(!s.completed.includes(s.chapter))s.completed.push(s.chapter);return true;}
export function placeItem(s,id,slot){if(!s.clues.includes(id)||!Number.isInteger(slot)||slot<0||slot>=8)return false;const old=s.slots.indexOf(id),other=s.slots[slot];if(old===slot)return true;if(old<0&&other)return false;if(old>=0)s.slots[old]=other;s.slots[slot]=id;return true;}
export function attachLabel(s,id){if(!s.slots.includes(id)||!s.clues.includes(id))return false;if(!s.labels.includes(id))s.labels.push(id);return true;}
export const stars=s=>s.slots.reduce((n,id)=>n+(id?1+(s.labels.includes(id)?2:0):0),0);
export function setDecor(s,kind,index){if(!Number.isInteger(index)||!DECOR[kind]?.[index]||stars(s)<DECOR[kind][index].need)return false;s.decor[kind]=index;return true;}
export const canTravel=s=>s.chapter===0&&s.completed.includes(0)&&CHAPTERS[0].items.every(id=>s.labels.includes(id)&&s.slots.includes(id));
export function nextChapter(s){if(!canTravel(s))return false;s.chapter=1;s.index=0;if(!s.friends.includes('bird'))s.friends.push('bird');return true;}
export function useAid(s,who){const key=`${s.chapter}:${who}`;if(!['turtle','bird'].includes(who)||(who==='bird'&&s.chapter!==1)||!s.friends.includes(who)||s.aids.includes(key))return false;s.aids.push(key);return true;}
export function parseAdventure(raw){
 try{const v=JSON.parse(raw),ids=ITEMS.map(i=>i.id),unique=a=>Array.isArray(a)&&new Set(a).size===a.length,subset=(a,list)=>unique(a)&&a.every(x=>list.includes(x));
  if(v?.version!==1||![0,1].includes(v.chapter)||!Number.isInteger(v.index)||v.index<0||v.index>3||!subset(v.found,ids)||!subset(v.clues,v.found)||!subset(v.labels,v.clues)||!subset(v.completed,[0,1])||!subset(v.friends,['frog','snake','turtle','bird'])||!v.friends.includes('frog')||!v.friends.includes('snake'))return null;
  if(!Array.isArray(v.slots)||v.slots.length!==8||!subset(v.slots.filter(Boolean),v.clues)||v.slots.some(x=>x!==null&&!ids.includes(x)))return null;
  if(!Array.isArray(v.owners)||v.owners.length!==2||!Array.isArray(v.names)||v.names.length!==2||!v.misses||typeof v.misses!=='object'||Array.isArray(v.misses))return null;
  for(let n=0;n<2;n++){if(!subset(v.owners[n],CHAPTERS[n].items)||v.owners[n].some(id=>!v.clues.includes(id)))return null;if(v.names[n]!==null&&!CHAPTERS[n].names.includes(v.names[n]))return null;if(v.completed.includes(n)&&(v.owners[n].length!==3||!v.names[n]))return null;}
  if(v.chapter===0&&v.clues.some(id=>CHAPTERS[1].items.includes(id)))return null;
  if(v.chapter===1&&(!v.completed.includes(0)||!v.friends.includes('bird')))return null;
  if(!CHAPTERS[v.chapter].items.slice(0,v.index).every(id=>v.clues.includes(id)))return null;
  if(Object.entries(v.misses).some(([id,n])=>!ids.includes(id)||!Number.isSafeInteger(n)||n<0)||!subset(v.aids,['0:turtle','1:turtle','1:bird']))return null;
  if(!v.decor||Object.keys(DECOR).some(k=>!Number.isInteger(v.decor[k])||!DECOR[k][v.decor[k]]||stars(v)<DECOR[k][v.decor[k]].need))return null;
  if(v.dig!=null){const i=currentItem(v),d=v.dig;if(!i||i.kind!=='dig'||d.id!==i.id||v.found.includes(i.id)||['soil','rock','wood'].some(k=>!Array.isArray(d[k])||d[k].length!==84||d[k].some(n=>!Number.isFinite(n)||n<0||n>1)))return null;if(d.soil.some((n,k)=>(n>0&&(d.rock[k]!==1||d.wood[k]!==1))||(d.rock[k]>0&&d.wood[k]!==1)))return null;}
  const s=freshAdventure();for(const k of Object.keys(s))s[k]=v[k];s.dig=v.dig??null;return s;
 }catch{return null;}
}
export const saveAdventure=(storage,s)=>{try{storage.setItem(ADVENTURE_KEY,JSON.stringify(s));return true;}catch{return false;}};
export const loadAdventure=storage=>{try{return parseAdventure(storage.getItem(ADVENTURE_KEY));}catch{return null;}};
export function importLegacy(e){const s=freshAdventure();if(!e||!CHAPTERS[0].names.includes(e.nickname)||!Array.isArray(e.items)||e.items.join(',')!=='crown,saddle,glass')return s;s.found=[...e.items];s.clues=[...e.items];s.owners[0]=[...e.items];s.names[0]=e.nickname;s.labels=[...e.items];s.slots.splice(0,3,...e.items);s.completed=[0];s.index=3;s.friends.push('turtle');return s;}
