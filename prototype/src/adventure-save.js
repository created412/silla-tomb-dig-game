import {loadStars,isUnlocked} from './stars-store.js';
import {LEVELS} from './levels.js';
export const ADVENTURE_SAVE_KEY='silla-adventure-v1';
export function loadAdventureSave(storage){
 let data=null;try{data=JSON.parse(storage?.getItem(ADVENTURE_SAVE_KEY)||'null');}catch{}
 const valid=data?.version===1&&data.stars&&typeof data.stars==='object';
 const stars=valid?loadStars({getItem:()=>JSON.stringify({version:1,stars:data.stars})}):loadStars(storage);
 const highest=LEVELS.reduce((last,_,i)=>isUnlocked(stars,i)?i:last,0);
 const index=valid&&Number.isInteger(data.index)?Math.max(0,Math.min(highest,data.index)):highest;
 return {stars,index,exists:valid||Object.values(stars).some(n=>n>0)};
}
// 모험·발굴·실패에서는 호출하지 않는다. '저장하기' 버튼만 이 함수를 호출한다.
export function saveAdventure(storage,stars,index){
 try{if(!storage)return false;storage.setItem(ADVENTURE_SAVE_KEY,JSON.stringify({version:1,stars,index}));return true;}catch{return false;}
}
