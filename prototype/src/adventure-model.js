// 토우가 움직이는 상상 속 탐험길. 실제 유물·무덤은 부수지 않는다.
const ground=(x,w,y=460)=>({x,w,y});
const light=(id,x,y)=>({id:'light'+id,x,y});
const gate=(id,x,kind)=>({id:'gate'+id,x,kind});
export const ROUTES=[
 {actor:'frog',name:'두꺼비의 폴짝 숲길',goal:2180,width:2380,
  instruction:'빛 조각 3개를 따라 폴짝! 끝의 흙더미도 걷어 줘.',
  platforms:[ground(0,540),ground(670,370,420),ground(1160,400,440),ground(1680,700)],
  lights:[light(0,360,365),light(1,890,325),light(2,1450,350)],gates:[gate(0,1930,'dig')]},
 {actor:'bird',name:'새의 반짝 하늘길',goal:2250,width:2450,
  instruction:'날갯짓을 누르면 위로! 높은 빛 조각 3개를 찾아 줘.',
  platforms:[ground(0,560),ground(760,460,410),ground(1420,400,380),ground(2000,450)],
  lights:[light(0,480,195),light(1,1150,150),light(2,1820,215)],gates:[]},
 {actor:'turtle',name:'거북의 든든 돌길',goal:2260,width:2460,
  instruction:'돌이 오면 등껍질! 누른 채 걸으면 안전하게 밀어내.',
  platforms:[ground(0,2460)],lights:[light(0,530,425),light(1,1260,425),light(2,2030,425)],
  gates:[gate(0,1050,'shield')],stoneZones:[900,1550,2050]},
 {actor:'snake',name:'뱀의 구불 비밀길',goal:2240,width:2440,
  instruction:'낮은 틈에서는 몸을 낮추고, 빛 조각을 찾아가자!',
  platforms:[ground(0,2440)],lights:[light(0,450,425),light(1,1190,425),light(2,1950,425)],
  gates:[gate(0,780,'crawl'),gate(1,1540,'crawl')]},
 {actor:'frog',name:'네 친구의 마지막 탐험',goal:2750,width:2950,
  instruction:'두꺼비로 폴짝, 새로 높이! 거북과 뱀으로 길을 열자.',
  platforms:[ground(0,540),ground(670,400,420),ground(1190,1760)],
  lights:[light(0,350,365),light(1,1430,155),light(2,2530,425)],
  gates:[gate(0,1860,'shield'),gate(1,2250,'crawl')],stoneZones:[1770]},
];
export const ACTORS={
 frog:{name:'두꺼비',action:'폴짝!',hint:'누르면 점프 · 흙더미 앞에서 폴짝',speed:250},
 bird:{name:'새',action:'날갯짓',hint:'누르고 있으면 상승 · 놓으면 내려와',speed:270},
 turtle:{name:'거북',action:'등껍질',hint:'누르고 있으면 돌을 막아',speed:205},
 snake:{name:'뱀',action:'몸 낮추기',hint:'누른 채 이동하면 좁은 틈도 쏙',speed:245},
};
export function createAdventure(index=0){
 const route=ROUTES[Math.max(0,Math.min(4,index))];
 return {index,route,actor:route.actor,available:['frog','bird','turtle','snake'].slice(0,Math.min(4,index+1)),
  player:{x:110,y:460,vx:0,vy:0,grounded:true,facing:1},checkpoint:{x:110,y:460},
  collected:new Set(),opened:new Set(),stones:[],events:[],status:'play',failures:0,blocks:0,
  clock:0,stoneAt:1.5,lastAction:false,coyote:.12,jumpBuffer:0,invulnerable:0,acting:false};
}
export function switchFriend(s,who){
 if(!s.available.includes(who)||!ACTORS[who]||s.status!=='play')return false;
 s.actor=who;s.acting=false;s.lastAction=true;s.jumpBuffer=0;return true;
}
export function retryAdventure(s){
 Object.assign(s.player,{x:s.checkpoint.x,y:s.checkpoint.y,vx:0,vy:0,grounded:true});
 s.status='play';s.stones=[];s.invulnerable=1.2;s.lastAction=true;s.jumpBuffer=0;
}
function fail(s){s.failures++;retryAdventure(s);s.events.push({type:'retry',x:s.player.x,y:s.player.y});}
export function stepAdventure(s,input={},dt=1/60){
 s.events=[];if(s.status!=='play')return;
 dt=Math.min(.035,Math.max(0,Number.isFinite(dt)?dt:0));if(!dt)return;
 const p=s.player,oldX=p.x,oldY=p.y,actor=ACTORS[s.actor],held=!!input.action;
 s.clock+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);s.acting=held;
 s.coyote=p.grounded?.12:Math.max(0,s.coyote-dt);
 if(held&&!s.lastAction)s.jumpBuffer=.13;else s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);
 s.lastAction=held;
 const direction=(input.right?1:0)-(input.left?1:0);
 p.vx=direction*actor.speed*(held&&['turtle','snake'].includes(s.actor)?.58:1);
 if(direction)p.facing=direction;
 if(s.actor==='frog'&&s.jumpBuffer>0&&s.coyote>0){p.vy=-570;p.grounded=false;s.coyote=0;s.jumpBuffer=0;s.events.push({type:'jump',x:p.x,y:p.y});}
 if(s.actor==='bird')p.vy=Math.max(-275,Math.min(330,p.vy+(held?-1000:680)*dt));
 else p.vy=Math.min(700,p.vy+1400*dt);
 p.x=Math.max(28,Math.min(s.route.width-28,p.x+p.vx*dt));p.y+=p.vy*dt;
 if(p.y<115){p.y=115;p.vy=Math.max(0,p.vy);}
 p.grounded=false;
 for(const f of s.route.platforms){
  if(p.x+18>f.x&&p.x-18<f.x+f.w&&oldY<=f.y+1&&p.y>=f.y&&p.vy>=0){
   p.y=f.y;p.vy=0;p.grounded=true;
   if(p.x>f.x+60&&p.x<f.x+f.w-60&&p.x>s.checkpoint.x+260){s.checkpoint={x:p.x,y:f.y};s.events.push({type:'checkpoint',x:p.x,y:p.y});}
   break;
  }
 }
 for(const g of s.route.gates){
  if(s.opened.has(g.id))continue;
  const matching=(g.kind==='dig'&&s.actor==='frog')||(g.kind==='shield'&&s.actor==='turtle')||(g.kind==='crawl'&&s.actor==='snake');
  if(Math.abs(p.x-g.x)<82&&held&&matching&&p.y>340){s.opened.add(g.id);s.events.push({type:'open',kind:g.kind,x:g.x,y:440});}
  else if(Math.abs(p.x-g.x)<48&&p.y>315){p.x=oldX<=g.x?g.x-48:g.x+48;p.vx=0;}
 }
 for(const l of s.route.lights){
  if(!s.collected.has(l.id)&&Math.hypot(p.x-l.x,p.y-34-l.y)<56){s.collected.add(l.id);s.events.push({type:'collect',x:l.x,y:l.y});}
 }
 if(s.route.stoneZones&&s.clock>=s.stoneAt){
  const zone=s.route.stoneZones.find(x=>x>p.x-30&&x<p.x+600);
  if(zone)s.stones.push({x:zone+120,y:440,vx:-175,id:String(s.clock)});
  s.stoneAt=s.clock+2.7;
 }
 for(const rock of s.stones){
  rock.x+=rock.vx*dt;
  if(Math.abs(rock.x-p.x)<42&&Math.abs(rock.y-(p.y-22))<45){
   if(s.actor==='turtle'&&held){rock.x=-999;s.blocks++;s.events.push({type:'block',x:p.x+30,y:p.y-25});}
   else if(!s.invulnerable){fail(s);return;}
  }
 }
 s.stones=s.stones.filter(r=>r.x>0&&r.x>p.x-900);
 if(p.y>690){fail(s);return;}
 if(p.x>=s.route.goal&&s.collected.size===s.route.lights.length&&s.opened.size===s.route.gates.length){s.status='arrived';p.vx=0;s.events.push({type:'arrive',x:p.x,y:p.y});}
}
