import { ARTIFACTS, NICKNAMES } from './story-data.js';
export const EXHIBIT_KEY='silla-first-exhibit-v1';
export function createStory(){return {index:0,found:false,observed:[],clues:[],attempts:0,unknown:false};}
export function discover(s){s.found=true;}
export function observe(s,id){
  if(!s.found||!ARTIFACTS[s.index].observations.some(o=>o.id===id))return false;
  if(!s.observed.includes(id))s.observed.push(id);
  return true;
}
export function chooseClue(s,choice){
  const a=ARTIFACTS[s.index];
  if(!s.found||s.observed.length!==a.observations.length||!Number.isInteger(choice)||!a.options[choice])return 'locked';
  if(s.clues.includes(a.id))return 'solved';
  if(choice!==a.answer){s.attempts++;return 'retry';}
  s.clues.push(a.id);return 'solved';
}
export function nextArtifact(s){
  if(!s.clues.includes(ARTIFACTS[s.index].id)||s.index>=ARTIFACTS.length-1)return false;
  s.index++;s.found=false;s.observed=[];s.attempts=0;return true;
}
export function classifyUnknown(s,choice){
  if(s.clues.length!==3||choice!=='unknown-name')return false;
  s.unknown=true;return true;
}
export function makeExhibit(s,nickname){
  if(!s.unknown||s.clues.length!==3||!NICKNAMES.includes(nickname))return null;
  return {version:1,nickname,items:ARTIFACTS.map(a=>a.id),realNameKnown:false,completedAt:new Date().toISOString()};
}
export function parseExhibit(raw){
  try{
    const e=JSON.parse(raw);
    if(e?.version!==1||!NICKNAMES.includes(e.nickname)||e.realNameKnown!==false||!Array.isArray(e.items)||
      e.items.length!==3||!ARTIFACTS.every((a,i)=>e.items[i]===a.id)||typeof e.completedAt!=='string'||!Number.isFinite(Date.parse(e.completedAt)))return null;
    return {version:1,nickname:e.nickname,items:[...e.items],realNameKnown:false,completedAt:e.completedAt};
  }catch{return null;}
}
export function saveExhibit(storage,e){try{storage.setItem(EXHIBIT_KEY,JSON.stringify(e));return true;}catch{return false;}}
export function loadExhibit(storage){try{return parseExhibit(storage.getItem(EXHIBIT_KEY));}catch{return null;}}
