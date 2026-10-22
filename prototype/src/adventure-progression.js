import {LEVELS,FRIENDS} from './levels.js';
// 기존 발굴 시제품 데이터·검사와 저장 ID는 유지하고 새 모험의 합류 순서를 적용한다.
const order=['frog','bird','turtle','snake'];
export const ADVENTURE_LEVELS=LEVELS.map((level,i)=>({...level,friends:order.slice(0,Math.min(4,i+1))}));
export const ADVENTURE_FRIENDS=Object.fromEntries(order.map((who,i)=>[who,{...FRIENDS[who],joinsAt:i}]));
