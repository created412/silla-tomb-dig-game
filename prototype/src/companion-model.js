export const FRIEND_NAMES={frog:'두꺼비',bird:'새',turtle:'거북',snake:'뱀'};
export const ROUTES={
 entry:{who:'frog',kind:'jump',title:'폴짝! 묻힌 입구를 열어라',reward:'두꺼비의 점프 발굴',story:'뱀: 흙더미 뒤에 입구가 있어. 폴짝 친구를 깨워 보자!',hint:'흙더미를 골라 착지점을 정하고, 폴짝!',points:[{x:.3,y:.42},{x:.57,y:.6},{x:.79,y:.32}]},
 sky:{who:'bird',kind:'fly',title:'날아서 숨은 길을 찾아라',reward:'새의 공중 탐색',story:'두꺼비: 금관 곁에서 새 토우를 찾았어. 위에서는 뭐가 보일까?',hint:'화살표로 날고, 흔적 위에서 내려다봐!',points:[{x:.23,y:.28},{x:.69,y:.3},{x:.75,y:.76}]},
 brace:{who:'turtle',kind:'brace',title:'거북이 받치면, 틈이 열린다',reward:'거북의 든든한 받침',story:'새: 말다래 옆에 거북이 잠들었어. 저 돌 틈을 함께 보자!',hint:'거북을 받침 자리에 세운 뒤, 열린 틈을 눌러 봐.',points:[{x:.25,y:.48},{x:.5,y:.48},{x:.75,y:.48}]},
 ridge:{who:'bird',kind:'fly',title:'두 번째 언덕으로 날아가자',reward:'새와 찾은 두 번째 길',story:'새: 첫 전시 완성! 이번에는 내가 두 언덕의 길을 찾을게.',hint:'위에서 보이는 세 흔적을 따라 날아가 봐!',points:[{x:.2,y:.68},{x:.48,y:.25},{x:.82,y:.55}]},
};
export function canRoute(s,id){if(!ROUTES[id])return false;if(s.routes?.includes(id))return true;if(id==='entry')return true;if(id==='sky')return s.routes?.includes('entry')&&(s.clues.includes('crown')||s.completed.includes(0));if(id==='brace')return s.routes?.includes('sky')&&(s.clues.includes('saddle')||s.completed.includes(0));return s.routes?.includes('brace')&&s.chapter===1;}
export function nextRoute(s){if(!s.routes?.includes('entry'))return 'entry';if(!s.routes.includes('sky')&&(s.index>=1||s.chapter===1))return 'sky';if(!s.routes.includes('brace')&&(s.index>=2||s.chapter===1))return 'brace';if(s.chapter===1&&!s.routes.includes('ridge'))return 'ridge';return null;}
export function wakeFriend(s,id,patches){if(!canRoute(s,id)||patches!==3)return false;const who=ROUTES[id].who;if(!s.friends.includes(who))s.friends.push(who);return true;}
export function completeRoute(s,id,marks){if(!canRoute(s,id)||!s.friends.includes(ROUTES[id].who)||!Array.isArray(marks)||new Set(marks).size!==3||![0,1,2].every(n=>marks.includes(n)))return false;s.routes??=[];if(!s.routes.includes(id))s.routes.push(id);return true;}
export function jumpHit(x,y,cleared){return ROUTES.entry.points.findIndex((p,n)=>!cleared.includes(n)&&Math.hypot(p.x-x,p.y-y)<.13);}
export function flyStep(p,dx,dy){return {x:Math.max(.05,Math.min(.95,p.x+dx*.08)),y:Math.max(.05,Math.min(.95,p.y+dy*.08))};}
export function scanAt(id,p,seen){return ROUTES[id].points.findIndex((q,n)=>!seen.includes(n)&&Math.hypot(q.x-p.x,q.y-p.y)<.15);}
