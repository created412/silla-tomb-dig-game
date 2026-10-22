import {ACTORS,createAdventure,stepAdventure,switchFriend,retryAdventure} from './adventure-model.js?v=adventure-1';
import {drawCharacter} from './characters.js';
import {worldImage,secondWorldImage} from './clay-art.js';
import {drawAdventureProp,drawAdventureTerrain} from './adventure-art.js?v=props-1';

// 화면·입력은 여기, 물리와 통과 조건은 adventure-model에 둔다.
export function createAdventureView({host,sfx,onDig,onHome,onSave,onMusic}){
 const root=document.createElement('section');root.id='adventure';root.className='hidden';root.setAttribute('aria-label','토우 탐험길');
 root.innerHTML=`<canvas id="adventure-world" aria-label="토우를 움직여 빛 조각을 모으는 탐험길"></canvas>
 <header class="adventure-header"><div><span id="adventure-chapter"></span><h2 id="adventure-title"></h2></div><div class="adventure-tools"><span id="adventure-lights" aria-label="모은 빛 조각"></span><button id="adventure-pause" aria-label="탐험 잠깐 쉬기">Ⅱ</button></div></header>
 <p id="adventure-tip"></p><p id="adventure-feedback" role="status" aria-live="polite"></p>
 <div id="adventure-waypoint" aria-hidden="true"></div>
 <footer class="adventure-controls"><div class="adventure-arrows"><button data-move="left" aria-label="왼쪽으로 이동">◀</button><button data-move="right" aria-label="오른쪽으로 이동">▶</button></div><div id="adventure-friends" aria-label="조작할 토우 선택"></div><button id="adventure-action" data-move="action"></button></footer>
 <span class="adventure-key-hint">← → 이동 · Space 능력 · Esc 쉬기</span>
 <div id="adventure-modal" class="hidden" role="dialog" aria-modal="true" aria-labelledby="adventure-modal-title"><div class="adventure-sheet"><span id="adventure-modal-kicker"></span><h2 id="adventure-modal-title"></h2><p id="adventure-modal-text"></p><button id="adventure-continue" class="big"></button><div class="adventure-modal-options"><button id="adventure-retry">발판으로 돌아가기</button><button id="adventure-save">저장하기</button><button id="adventure-music" data-music-toggle>♪ 음악 켜짐</button><button id="adventure-home">무덤 고르기</button></div><p id="adventure-save-status" role="status"></p></div></div>`;
 host.append(root);
 const $=id=>root.querySelector('#'+id),canvas=$('adventure-world'),ctx=canvas.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let state=null,active=false,paused=false,lastTime=0,cam=0,camY=0,viewWidth=1000,viewHeight=600,scale=1,ratio=1;
 let particles=[],messageUntil=0,lastCount=-1,lastActor='',lastTip='',artifactName='';
 const pointers=new Map(),keys=new Set();
 function clearInput(){pointers.clear();keys.clear();root.querySelectorAll('[data-move]').forEach(b=>b.classList.remove('held'));if(state){state.lastAction=true;state.acting=false;}}
 function held(action){return keys.has(action)||[...pointers.values()].includes(action);}
 function cameraHeight(){const w=canvas.width/ratio,h=viewHeight;const floor=w<=740&&h>w?Math.min(h-190,h*.72):Math.min(h-85,h*.77);return floor-460*scale+Math.max(0,320-(state?.player.y||460))*scale;}
 function resize(){const r=root.getBoundingClientRect();if(!r.width||!r.height)return;ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);viewHeight=r.height;scale=r.height/600;viewWidth=r.width/scale;camY=cameraHeight();clearInput();}
 new ResizeObserver(resize).observe(root);
 for(const b of root.querySelectorAll('[data-move]')){
  b.addEventListener('pointerdown',e=>{if(!active||paused||state.status!=='play')return;e.preventDefault();sfx.unlock();try{b.setPointerCapture(e.pointerId);}catch{}pointers.set(e.pointerId,b.dataset.move);b.classList.add('held');});
  const release=e=>{pointers.delete(e.pointerId);if(!held(b.dataset.move))b.classList.remove('held');};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,release);
  b.addEventListener('contextmenu',e=>e.preventDefault());
 }
 const releaseOutside=e=>{pointers.delete(e.pointerId);root.querySelectorAll('[data-move]').forEach(b=>{if(!held(b.dataset.move))b.classList.remove('held');});};
 document.addEventListener('pointerup',releaseOutside);document.addEventListener('pointercancel',releaseOutside);
 const keyMap={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',' ':'action',ArrowUp:'action',w:'action',W:'action'};
 document.addEventListener('keydown',e=>{
  if(!active)return;
  if(e.key==='Escape'){e.preventDefault();if(!e.repeat&&state.status==='play')togglePause();return;}
  if(paused||state.status!=='play')return;
  const movement=keyMap[e.key];
  // 메뉴·토우 선택 버튼에는 Enter/Space의 기본 클릭을 남긴다.
  if(e.key===' '&&e.target instanceof HTMLElement&&e.target.matches('button:not([data-move])'))return;
  if(movement){e.preventDefault();keys.add(movement);root.querySelector(`[data-move="${movement}"]`)?.classList.add('held');sfx.unlock();}
  if(['1','2','3','4'].includes(e.key))choose(state.available[Number(e.key)-1]);
 });
 document.addEventListener('keyup',e=>{const movement=keyMap[e.key];if(movement){keys.delete(movement);if(!held(movement))root.querySelector(`[data-move="${movement}"]`)?.classList.remove('held');}});
 window.addEventListener('blur',()=>{clearInput();if(active&&!paused&&state.status==='play')togglePause();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(active&&!paused&&state.status==='play')togglePause();}});
 function message(text,seconds=2.8){$('adventure-feedback').textContent=text;messageUntil=(state?.clock||0)+seconds;}
 function choose(who){if(switchFriend(state,who)){clearInput();sfx.power();message(`${ACTORS[who].name} 차례! ${ACTORS[who].hint}`);updateHud();$('adventure-action').focus({preventScroll:true});}}
 function updateHud(){
  const count=state.collected.size;
  if(count!==lastCount){$('adventure-lights').textContent='✦'.repeat(count)+'✧'.repeat(3-count);$('adventure-lights').setAttribute('aria-label',`빛 조각 ${count} / 3`);lastCount=count;}
  if(lastActor!==state.actor){lastActor=state.actor;$('adventure-action').textContent=ACTORS[state.actor].action;$('adventure-action').setAttribute('aria-label',ACTORS[state.actor].hint);root.querySelectorAll('[data-adventure-friend]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.adventureFriend===state.actor)));}
  let tip=state.route.instruction;
  const closeGate=state.route.gates.find(g=>!state.opened.has(g.id)&&Math.abs(g.x-state.player.x)<200);
  if(closeGate)tip=closeGate.kind==='dig'?'두꺼비로 폴짝! 흙더미 앞에서 눌러 봐.':closeGate.kind==='shield'?'거북을 골라 등껍질을 누른 채 앞으로!':'뱀을 골라 몸을 낮춘 채 틈으로!';
  if(state.player.x>state.route.goal-160&&count<3)tip='빛 조각이 남았어! 화살표가 가리키는 곳으로 가 보자.';
  if(tip!==lastTip){$('adventure-tip').textContent=tip;lastTip=tip;}
  const next=state.route.lights.find(l=>!state.collected.has(l.id));
  $('adventure-waypoint').textContent=next?(next.x<state.player.x-80?'◀ 놓친 빛 조각':next.y<state.player.y-125?'↑ 높은 곳에 빛 조각':'빛 조각을 따라 ▶'):'발굴 장소로 ▶';
 }
 function modal(arrived){
  clearInput();$('adventure-modal').classList.remove('hidden');root.classList.add('has-modal');
  $('adventure-modal-kicker').textContent=arrived?'✦ ✦ ✦ 길을 찾았다!':'잠깐 쉬어 가자';
  $('adventure-modal-title').textContent=arrived?`${artifactName} 발굴 장소 발견!`:'토우 친구들이 기다릴게';
  $('adventure-modal-text').textContent=arrived?'이제 흙을 살살 걷어 내고, 옛사람의 이야기를 만나 보자.':'계속하기를 누르면 바로 이어져. 저장하면 이 구간의 시작부터 다시 탐험할 수 있어.';
  $('adventure-continue').textContent=arrived?'살살 발굴하러 가자!':'계속 탐험하기';
  $('adventure-retry').classList.toggle('hidden',arrived);$('adventure-save-status').textContent='';
  $('adventure-continue').focus({preventScroll:true});
 }
 function togglePause(){paused=!paused;clearInput();lastTime=0;if(paused)modal(false);else closeModal();}
 function closeModal(){$('adventure-modal').classList.add('hidden');root.classList.remove('has-modal');$('adventure-action').focus({preventScroll:true});}
 $('adventure-pause').onclick=()=>{if(state.status==='play')togglePause();};
 $('adventure-continue').onclick=()=>{if(state.status==='arrived'){close();onDig();}else{paused=false;lastTime=0;closeModal();}};
 $('adventure-retry').onclick=()=>{retryAdventure(state);paused=false;lastTime=0;cam=Math.max(0,state.player.x-viewWidth*.34);closeModal();message('괜찮아! 여기서 다시 해 보자.');};
 $('adventure-home').onclick=()=>{close();onHome();};
 $('adventure-save').onclick=()=>{$('adventure-save-status').textContent=onSave()?'저장했어! 다음에도 이 구간부터.':'이 브라우저에서는 저장할 수 없어.';};
 $('adventure-music').onclick=onMusic;
 root.addEventListener('keydown',e=>{if(e.key!=='Tab'||$('adventure-modal').classList.contains('hidden'))return;const bs=[...$('adventure-modal').querySelectorAll('button')].filter(b=>!b.classList.contains('hidden'));if(e.shiftKey&&document.activeElement===bs[0]){e.preventDefault();bs.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===bs.at(-1)){e.preventDefault();bs[0].focus();}});
 function open(index,name){
  state=createAdventure(index);artifactName=name;active=true;paused=false;lastTime=0;cam=0;particles=[];messageUntil=0;lastCount=-1;lastActor='';lastTip='';
  root.classList.remove('hidden','has-modal');$('adventure-modal').classList.add('hidden');$('adventure-feedback').textContent='';
  $('adventure-chapter').textContent=`탐험 ${index+1} · ${name} 찾기`;$('adventure-title').textContent=state.route.name;
  $('adventure-friends').innerHTML=state.available.map(who=>`<button data-adventure-friend="${who}" aria-label="${ACTORS[who].name} 선택" aria-pressed="false"><canvas data-actor="${who}" aria-hidden="true"></canvas><span>${ACTORS[who].name}</span></button>`).join('');
  root.querySelectorAll('[data-adventure-friend]').forEach(b=>b.onclick=()=>choose(b.dataset.adventureFriend));
  resize();updateHud();$('adventure-action').focus({preventScroll:true});
 }
 function close(){active=false;clearInput();root.classList.add('hidden');lastTime=0;}
 function puff(x,y,color,n=12){if(reduced.matches)return;for(let i=0;i<n;i++)particles.push({x,y,vx:Math.cos(i*2.4)*75,vy:-65-Math.sin(i)*80,life:1,color});}
 function frame(t){
  if(!active||!state)return;
  const dt=lastTime?Math.min((t-lastTime)/1000,.035):0;lastTime=t;
  if(!paused&&!document.hidden){
   stepAdventure(state,{left:held('left'),right:held('right'),action:held('action')},dt);
   for(const e of state.events){
    if(e.type==='jump'){sfx.power();puff(e.x,e.y,'#e4c48e',7);}
    if(e.type==='collect'){sfx.glimmer();puff(e.x,e.y,'#ffe287',20);message(state.collected.size===3?'빛 조각을 다 찾았어! 발굴 장소로 가자.':`반짝! 빛 조각 ${state.collected.size} / 3`);}
    if(e.type==='open'){sfx.power();puff(e.x,e.y,'#d2c696',18);message(e.kind==='crawl'?'좁은 틈도 쏙! 길이 열렸어.':'길이 열렸어! 앞으로 가자.');}
    if(e.type==='block'){sfx.tap();puff(e.x,e.y,'#e1dfc5',10);message('튼튼한 등껍질! 막았다!');}
    if(e.type==='retry'){sfx.worm();cam=Math.max(0,state.player.x-viewWidth*.34);message('앗! 괜찮아. 모은 빛은 그대로야. 다시 해 보자.',4);}
    if(e.type==='checkpoint'){message('여기까지 왔어! 넘어져도 여기서 다시.',2);}
    if(e.type==='arrive'){sfx.found();puff(e.x,e.y-80,'#ffe287',30);modal(true);}
   }
   if(state.clock>messageUntil)$('adventure-feedback').textContent='';
   updateHud();
  }
  const target=Math.max(0,Math.min(state.route.width-viewWidth,state.player.x-viewWidth*.34));
  cam+= (target-cam)*(reduced.matches?1:Math.min(1,dt*8));
  camY+=(cameraHeight()-camY)*(reduced.matches?1:Math.min(1,dt*8));
  draw(t,paused?0:dt);
 }
 function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}}
 function draw(t,dt){
  const w=canvas.width/ratio,h=canvas.height/ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  const bg=state.index>2?secondWorldImage:worldImage;
  if(bg.complete&&bg.naturalWidth){const s=Math.max(w/bg.width,h/bg.height);ctx.drawImage(bg,(w-bg.width*s)/2-cam*.025,(h-bg.height*s)/2,bg.width*s+cam*.05,bg.height*s);}
  else{const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#a7d6cf');gradient.addColorStop(1,'#526d49');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);}
  ctx.fillStyle='#092c2430';ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(0,camY);ctx.scale(scale,scale);ctx.translate(-cam,0);
  // 햇빛 아래 풀과 뿌리가 보이는 발판. 배경 이미지는 기존 제작 자산만 쓴다.
  for(const f of state.route.platforms){
   if(f.x+f.w<cam-80||f.x>cam+viewWidth+80)continue;
   if(drawAdventureTerrain(ctx,f))continue;
   const g=ctx.createLinearGradient(0,f.y,0,610);g.addColorStop(0,'#926b45');g.addColorStop(.25,'#694e38');g.addColorStop(1,'#263d31');
   rounded(f.x,f.y,f.w,260,18,g,'#4a4832');rounded(f.x-3,f.y-9,f.w+6,18,9,'#74964c');
   for(let x=f.x+15;x<f.x+f.w;x+=27){ctx.strokeStyle='#a1bb64';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,f.y);ctx.lineTo(x-4,f.y-15-(Math.sin(x)*6));ctx.lineTo(x+5,f.y-8);ctx.stroke();}
   for(let x=f.x+24;x<f.x+f.w;x+=65){ctx.fillStyle='#b29663';ctx.beginPath();ctx.ellipse(x,f.y+35+Math.sin(x)*12,8,4,x,0,Math.PI*2);ctx.fill();}
  }
  // 구간 시작 표식과 쉬는 발판의 작은 깃발.
  flag(170,460,'출발');
  if(state.checkpoint.x>300){
   const cp=state.checkpoint;
   // Keep the rest marker away from the actual obstacle silhouette.
   if(!state.route.gates.some(g=>Math.abs(g.x-cp.x)<150))flag(cp.x,cp.y,'쉼터');
  }
  for(const g of state.route.gates){
   if(g.x<cam-120||g.x>cam+viewWidth+120)continue;
   const open=state.opened.has(g.id);
   if(g.kind==='crawl'){
    if(!drawAdventureProp(ctx,'tunnel',g.x,464,188,126)){
     ctx.strokeStyle='#715b42';ctx.lineWidth=28;ctx.beginPath();ctx.arc(g.x,452,54,Math.PI,0);ctx.stroke();
    }
    if(!open&&Math.abs(g.x-state.player.x)<290)label(g.x,319,'뱀 · 몸 낮추기','#fff2ce');
   }else if(!open){
    if(g.kind==='dig'){if(!drawAdventureProp(ctx,'mound',g.x,464,142,78)){ctx.fillStyle='#b59053';ctx.beginPath();ctx.ellipse(g.x,448,50,48,0,Math.PI,0);ctx.fill();}label(g.x,372,'두꺼비 · 폴짝!','#fff2ce');}
    else{rock(g.x,423,40,0);label(g.x,352,'거북 · 등껍질','#fff2ce');}
   }
  }
  for(const l of state.route.lights){
   if(state.collected.has(l.id))continue;
   const y=l.y+(reduced.matches?0:Math.sin(t/380+l.x)*6);
   const glow=ctx.createRadialGradient(l.x,y,0,l.x,y,43);glow.addColorStop(0,'#fff1a2c0');glow.addColorStop(1,'#fff1a200');ctx.fillStyle=glow;ctx.fillRect(l.x-43,y-43,86,86);
   ctx.strokeStyle='#f9e9a0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(l.x,y,25,0,Math.PI*2);ctx.stroke();spark(l.x,y,15,'#fff5ac');
  }
  for(const r of state.stones)rock(r.x,r.y,22,r.x/30);
  const goal=state.route.goal;
  if(!drawAdventureProp(ctx,'station',goal,464,200,133))flag(goal,460,'발굴 현장');
  label(goal,310,'발굴 현장','#fff2ce');
  if(state.collected.size===3&&state.opened.size===state.route.gates.length)spark(goal,268,18,'#fff0a0');
  const p=state.player;
  ctx.fillStyle='#102d2540';ctx.beginPath();ctx.ellipse(p.x,p.grounded?p.y+3:460,29,7,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(p.x,p.y);
  if(state.actor==='snake'&&state.acting){ctx.scale(1.16,.55);}
  if(state.actor==='bird'&&state.acting&&!reduced.matches)ctx.translate(0,Math.sin(t/70)*3);
  if(state.invulnerable>0)ctx.globalAlpha=.65+.35*Math.abs(Math.sin(t/90));
  // 원본 아틀라스의 얼굴이 이동 방향을 향한다.
  ctx.scale(p.facing,1);drawCharacter(ctx,state.actor,0,0,87,t,state.status==='arrived'?'artifactRevealed':'idle',false,reduced.matches);ctx.restore();
  // Roots stay in front while the snake slips through the opening, rather than
  // looking like a sticker walking across a solid rectangle.
  for(const g of state.route.gates)if(g.kind==='crawl'&&Math.abs(p.x-g.x)<72)drawAdventureProp(ctx,'tunnel',g.x,464,188,126);
  if(state.actor==='turtle'&&state.acting){ctx.strokeStyle='#d4f2bc';ctx.lineWidth=5;ctx.beginPath();ctx.arc(p.x,p.y-36,55,Math.PI*1.05,Math.PI*1.95);ctx.stroke();}
  particles=particles.filter(q=>q.life>0);for(const q of particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=140*dt;ctx.globalAlpha=Math.max(0,q.life);spark(q.x,q.y,3,q.color);}ctx.globalAlpha=1;
  ctx.restore();
 }
 function label(x,y,text,color){ctx.font='bold 16px "Malgun Gothic",sans-serif';const width=ctx.measureText(text).width+22;rounded(x-width/2,y-21,width,30,12,'#173f35e8');ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(text,x,y);}
 function flag(x,y,text){
  if(drawAdventureProp(ctx,'sign',x,y+3,90,124)){
   ctx.save();ctx.fillStyle='#fff0be';ctx.shadowColor='#352715';ctx.shadowBlur=3;ctx.font='bold 12px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillText(text,x+13,y-85);ctx.restore();return;
  }
  ctx.strokeStyle='#91714b';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-100);ctx.stroke();label(x,y-95,text,'#fff4cb');
 }
 function spark(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.3,y-r*.3);ctx.lineTo(x+r,y);ctx.lineTo(x+r*.3,y+r*.3);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.3,y+r*.3);ctx.lineTo(x-r,y);ctx.lineTo(x-r*.3,y-r*.3);ctx.closePath();ctx.fill();}
 function leaf(x,y,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,11,5,-.5,0,Math.PI*2);ctx.fill();}
 function rock(x,y,r,angle){ctx.save();ctx.translate(x,y);ctx.rotate(angle);if(!drawAdventureProp(ctx,'boulder',0,r,r*2.35,r*2)){ctx.fillStyle='#8b9280';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();}ctx.restore();}
 return {open,close,frame,get state(){return state;},get paused(){return paused;}};
}
