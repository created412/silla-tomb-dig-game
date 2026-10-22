// 검사 전용: 위치·수집 상태를 바꾸지 않고 실제 이동/능력 입력만 선택한다.
export function pilot(s){
 const targets=[...s.route.lights.filter(l=>!s.collected.has(l.id)),...s.route.gates.filter(g=>!s.opened.has(g.id)).map(g=>({...g,y:425}))].sort((a,b)=>a.x-b.x);
 const target=targets[0]||{x:s.route.goal+20,y:426},p=s.player;
 let actor=s.route.actor;
 if(s.index===4)actor=target.kind==='shield'?'turtle':target.kind==='crawl'?'snake':target.y<250?'bird':s.collected.size===0?'frog':s.actor;
 const dx=target.x-p.x,dir=dx>12?1:dx<-12?-1:0;
 let action=false;
 if(actor==='bird')action=p.y-34>target.y+8||p.y>465;
 if(actor==='turtle'||actor==='snake')action=true;
 if(actor==='frog'){
  const platform=s.route.platforms.find(f=>p.x>=f.x&&p.x<=f.x+f.w&&Math.abs(p.y-f.y)<3);
  const edge=platform&&(dir>0?platform.x+platform.w-p.x:p.x-platform.x);
  action=p.grounded&&((Math.abs(dx)<100&&target.y<p.y-65)||(edge!==false&&edge<42)||target.kind==='dig'&&Math.abs(dx)<80);
 }
 return {actor,input:{left:dir<0,right:dir>0,action}};
}
