import {SCENES,CASES} from './learning-data.js';
const artifactIds=['crown','saddle','glass'];
const validChoice=(value,count)=>Number.isInteger(value)&&value>=0&&value<count;
const rightLink=(scene,record)=>record?.artifact===scene.artifact&&record?.reason===scene.answer;
export const createLearning=()=>({links:{},cases:{}});
export function submitLink(l,id,artifact,reason){
 const scene=SCENES.find(s=>s.id===id);
 if(!scene||!artifactIds.includes(artifact)||!validChoice(reason,scene.reasons.length))return 'incomplete';
 const previous=l.links[id];if(rightLink(scene,previous))return 'solved';
 l.links[id]={artifact,reason,first:previous?.first||{artifact,reason},attempts:(previous?.attempts||0)+1};
 return rightLink(scene,l.links[id])?'solved':'retry';
}
export const connectionsComplete=l=>SCENES.every(s=>rightLink(s,l?.links?.[s.id]));
export function submitCase(l,id,answer){
 const index=CASES.findIndex(c=>c.id===id),c=CASES[index];
 if(!c||!connectionsComplete(l)||CASES.slice(0,index).some(p=>l.cases[p.id]?.answer!==p.answer))return 'locked';
 if(!validChoice(answer,c.options.length))return 'incomplete';
 const previous=l.cases[id];if(previous?.answer===c.answer)return 'solved';
 l.cases[id]={answer,first:previous?.first??answer,attempts:(previous?.attempts||0)+1};
 return answer===c.answer?'solved':'retry';
}
export function learningReport(l){
 if(!connectionsComplete(l)||!CASES.every(c=>l.cases[c.id]?.answer===c.answer))return null;
 return parseLearningReport({links:SCENES.map(s=>({id:s.id,...l.links[s.id]})),cases:CASES.map(c=>({id:c.id,...l.cases[c.id]}))});
}
export function parseLearningReport(r){
 if(!r||!Array.isArray(r.links)||r.links.length!==3||!Array.isArray(r.cases)||r.cases.length!==2)return null;
 const count=n=>Number.isSafeInteger(n)&&n>=1;
 for(let i=0;i<SCENES.length;i++){
  const s=SCENES[i],v=r.links[i];
  if(v?.id!==s.id||!rightLink(s,v)||!count(v.attempts)||!artifactIds.includes(v.first?.artifact)||!validChoice(v.first?.reason,3))return null;
  if(rightLink(s,v.first)!==(v.attempts===1))return null;
 }
 for(let i=0;i<CASES.length;i++){
  const c=CASES[i],v=r.cases[i];
  if(v?.id!==c.id||v.answer!==c.answer||!validChoice(v.first,3)||!count(v.attempts)||(v.first===c.answer)!==(v.attempts===1))return null;
 }
 return {links:r.links.map(v=>({id:v.id,artifact:v.artifact,reason:v.reason,first:{artifact:v.first.artifact,reason:v.first.reason},attempts:v.attempts})),cases:r.cases.map(v=>({id:v.id,answer:v.answer,first:v.first,attempts:v.attempts}))};
}
