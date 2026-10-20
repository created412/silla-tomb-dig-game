import { cellRect } from './grid.js';
import { createTerrain } from './terrain.js';
import { drawArtifact, drawLandscape, ellipse, path, star } from './artwork.js';
import { drawCharacter } from './characters.js';

export function createRenderer(canvas) {
  const ctx=canvas.getContext('2d');
  const fx={dust:[],shakeUntil:0,flashUntil:0,flashStart:0,mood:'idle',moodUntil:0,speaker:null};
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let cache=null,cacheKey='',landscape=null,landscapeKey='';
  let artifactId='crown',companion=false,bird=false,hintCells=[],hintUntil=0;
  const dpr=()=>canvas.width/canvas.getBoundingClientRect().width;
  function landscapeScene() {
    const key=`${canvas.width}:${canvas.height}`;
    if(key!==landscapeKey){landscapeKey=key;landscape=document.createElement('canvas');landscape.width=canvas.width;landscape.height=canvas.height;drawLandscape(landscape.getContext('2d'),canvas.width,canvas.height);}
    ctx.drawImage(landscape,0,0);
  }
  function friends(t,phase,foundProgress=0) {
    const w=canvas.width,h=canvas.height,dp=dpr();
    let size=Math.min(135*dp,h*.23),fy=h-10*dp,left=Math.max(size*.62,w*.12),right=w-left;
    if(phase==='title'){size=Math.min(220*dp,h*.37);fy=h*.87;left=w*.68-size*.45;right=w*.77+size*.3;}
    else if(phase==='found'||phase==='again'){
      left=Math.max(size*.62,w*.12);right=w-left;
      if(!reduced.matches){left-=Math.pow(1-foundProgress,2)*w*.25;right+=Math.pow(1-foundProgress,2)*w*.25;}
    }
    const mood=t<fx.moodUntil?fx.mood:(phase==='found'||phase==='again'?'artifactRevealed':'idle');
    if(companion&&phase!=='title') {
      drawCharacter(ctx,'frog',w*.07,fy,size*.72,t,mood,fx.speaker==='frog',reduced.matches);
      drawCharacter(ctx,'turtle',w*.17,fy,size*.72,t+90,mood,fx.speaker==='turtle',reduced.matches);
    } else drawCharacter(ctx,'frog',left,fy,size,t,mood,fx.speaker==='frog',reduced.matches);
    drawCharacter(ctx,'snake',right,fy,size,t+180,mood,fx.speaker==='snake',reduced.matches);
    if(bird&&phase!=='title')drawCharacter(ctx,'bird',w*.79,fy,size*.65,t,mood,fx.speaker==='bird',reduced.matches);
  }
  function particles(t) {
    fx.dust=fx.dust.filter(p=>t-p.born<p.life);if(reduced.matches)return;
    for(const p of fx.dust){const age=(t-p.born)/p.life;ctx.save();ctx.globalAlpha=1-age;ctx.translate(p.x+p.vx*age,p.y+p.vy*age+age*age*p.gravity);ctx.rotate(age*p.spin);
      if(p.kind==='gold')star(ctx,0,0,p.size,'#ffe394');else ellipse(ctx,0,0,p.size,p.size*.65,p.color);ctx.restore();}
  }
  function emit(cell,layout,t,kind='soil') {
    const r=cellRect(layout,cell),dp=dpr(),count=kind==='collapse'?20:kind==='rock'?10:3;
    for(let k=0;k<count;k++)fx.dust.push({kind,x:r.x+r.w*(.2+Math.random()*.6),y:kind==='collapse'?r.y-80*dp:r.y+r.h*.5,
      vx:(Math.random()-.5)*70*dp,vy:kind==='collapse'?60*dp:-(15+Math.random()*45)*dp,gravity:(kind==='collapse'?110:70)*dp,spin:(Math.random()-.5)*5,
      size:(kind==='collapse'?5+Math.random()*9:kind==='rock'?3+Math.random()*5:2+Math.random()*3)*dp,
      color:kind==='rock'||kind==='collapse'?'#a4a58b':kind==='wood'?'#c58c52':'#d8a96d',life:kind==='collapse'?700:550,born:t});
    if(fx.dust.length>100)fx.dust.splice(0,fx.dust.length-100);
  }
  function excavation(state,layout,t) {
    const {x0,y0,cell,cols,rows}=layout,w=cell*cols,h=cell*rows,dp=dpr(),key=`${canvas.width}:${canvas.height}:${cell}:${x0}:${y0}`;
    if(key!==cacheKey){cacheKey=key;cache=createTerrain(layout,dp);}
    ctx.save();ctx.shadowColor='rgba(6,25,20,.45)';ctx.shadowBlur=20*dp;ctx.shadowOffsetY=10*dp;ctx.fillStyle='#513b28';ctx.beginPath();ctx.roundRect(x0-9*dp,y0-9*dp,w+18*dp,h+24*dp,16*dp);ctx.fill();ctx.restore();
    ctx.fillStyle='#49382a';ctx.fillRect(x0,y0,w,h);
    // 매장된 금띠를 먼저 보여 주고, 완전히 발견하면 전체 도판을 비율대로 보여 준다.
    const first=Math.min(...state.artifactCells),r=cellRect(layout,first),gw=cell*state.artifactCells.size;
    if(artifactId==='crown') {
    const gold=ctx.createLinearGradient(r.x,r.y,r.x+gw,r.y+cell);gold.addColorStop(0,'#ad7c25');gold.addColorStop(.4,'#ffe795');gold.addColorStop(.7,'#c59432');gold.addColorStop(1,'#f3d277');
    ctx.fillStyle=gold;ctx.beginPath();ctx.roundRect(r.x+cell*.07,r.y+cell*.18,gw-cell*.14,cell*.65,cell*.12);ctx.fill();
    for(let k=0;k<24;k++){ellipse(ctx,r.x+gw*(k+.5)/24,r.y+cell*.32,dp,dp,'#7d5b28');if(k%2===0)ellipse(ctx,r.x+gw*(k+.5)/24,r.y+cell*.55,cell*.06,cell*.08,'#ffe49b','#a7792c');}
    } else {
      const cells=[...state.artifactCells],xs=cells.map(i=>i%cols),ys=cells.map(i=>Math.floor(i/cols));
      const ax=x0+Math.min(...xs)*cell,ay=y0+Math.min(...ys)*cell;
      drawArtifact(ctx,artifactId,ax,ay,(Math.max(...xs)-Math.min(...xs)+1)*cell,(Math.max(...ys)-Math.min(...ys)+1)*cell);
    }
    cache.draw(ctx,'wood',state);
    for(const i of state.glimmered)if(state.wood[i]>0){
      const r=cellRect(layout,i),cx=r.x+r.w*.5,cy=r.y+r.h*.5,pulse=reduced.matches?.6:.55+.2*Math.sin(t/260+i),g=ctx.createRadialGradient(cx,cy,1,cx,cy,r.w*.8);
      g.addColorStop(0,`rgba(255,214,92,${pulse})`);g.addColorStop(1,'rgba(255,214,92,0)');ctx.fillStyle=g;ctx.fillRect(cx-r.w,cy-r.h,r.w*2,r.h*2);
      path(ctx,[[cx-r.w*.31,cy+3*dp],[cx-r.w*.08,cy],[cx+r.w*.08,cy+4*dp],[cx+r.w*.29,cy-2*dp]],null,'#ffe19a',2*dp);
    }
    cache.draw(ctx,'rock',state);cache.draw(ctx,'soil',state);
    if(t<hintUntil)for(const i of hintCells){const r=cellRect(layout,i);star(ctx,r.x+r.w/2,r.y+r.h/2,r.w*.25,'#fff1a1');}
    for(const [x,y,sx,sy]of[[x0,y0,1,1],[x0+w,y0,-1,1],[x0,y0+h,1,-1],[x0+w,y0+h,-1,-1]])path(ctx,[[x+sx*15*dp,y],[x,y],[x,y+sy*15*dp]],null,'#d7b878',3*dp);
  }
  function reveal(t,elapsed,phase) {
    const w=canvas.width,h=canvas.height,dp=dpr(),p=Math.max(0,Math.min(1,elapsed/2200)),eased=reduced.matches?1:1-Math.pow(1-p,3);
    ctx.fillStyle=`rgba(17,49,43,${.98*Math.min(1,elapsed/500)})`;ctx.fillRect(0,0,w,h);
    const top=(h/dp<620?125:160)*dp;
    const size=phase==='again'?Math.min(w*.38,h*.51):Math.min(w*.43,Math.max(100*dp,h-150*dp-top));
    const cy=phase==='again'?h*.3:top+size*.5;
    const glow=ctx.createRadialGradient(w/2,cy,0,w/2,cy,size*.82);
    glow.addColorStop(0,'rgba(241,203,104,.27)');glow.addColorStop(.65,'rgba(209,181,93,.1)');glow.addColorStop(1,'rgba(209,181,93,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.translate(w/2,cy);ctx.rotate(reduced.matches?0:Math.sin(t/9000)*.025);
    for(let i=0;i<14;i++){const a=i/14*Math.PI*2;path(ctx,[[Math.cos(a)*size*.34,Math.sin(a)*size*.34],[Math.cos(a-.035)*size*.78,Math.sin(a-.035)*size*.78],[Math.cos(a+.035)*size*.78,Math.sin(a+.035)*size*.78]],'rgba(244,211,132,.07)');}ctx.restore();
    const s=(.3+.7*eased)*size,dy=(1-eased)*h*.18;
    ctx.save();ctx.shadowColor='rgba(6,26,21,.6)';ctx.shadowBlur=15*dp;ctx.shadowOffsetY=12*dp;drawArtifact(ctx,artifactId,w/2-s*.56,cy-s*.5+dy,s*1.12,s);ctx.restore();
    if(p>.4)for(let i=0;i<12;i++){const a=i*2.4,r=size*(.47+(i%3)*.08),wave=reduced.matches?1:.65+.35*Math.sin(t/330+i);star(ctx,w/2+Math.cos(a)*r,cy+Math.sin(a)*r*.75,(3+(i%3)*2)*dp*wave);}
    friends(t,phase,eased);
  }
  return {
    fx,
    draw(state,layout,t,phase='dig',elapsed=0){
      const w=canvas.width,h=canvas.height,dp=dpr();ctx.clearRect(0,0,w,h);
      if(phase==='title'){landscapeScene();friends(t,'title');return;}
      ctx.fillStyle='#173f3b';ctx.fillRect(0,0,w,h);if(phase==='again'){reveal(t,3000,'again');return;}
      if(phase==='story'){friends(t,phase);return;}
      ctx.save();if(t<fx.shakeUntil&&!reduced.matches)ctx.translate(Math.sin(t*.11)*5*dp,Math.cos(t*.09)*3*dp);
      if(state)excavation(state,layout,t);particles(t);ctx.restore();
      if(phase==='found')reveal(t,elapsed,'found');else friends(t,phase);
      if(t<fx.flashUntil&&!reduced.matches){const a=1-(t-fx.flashStart)/(fx.flashUntil-fx.flashStart);ctx.fillStyle=`rgba(255,226,149,${a*.48})`;ctx.fillRect(0,0,w,h);}
    },
    addDust:emit,
    setArtifact(id){artifactId=id;hintUntil=0;},setCompanion(joined){companion=joined;},setBird(joined){bird=joined;},hint(cells,until){hintCells=cells;hintUntil=until;},
    react(mood,t){fx.mood=mood;fx.moodUntil=t+(mood==='artifactRevealed'?3200:1900);},
    speak(who){fx.speaker=who;},shake(ms,t){fx.shakeUntil=t+ms;},flash(ms,t){fx.flashStart=t;fx.flashUntil=t+ms;},
    reset(){fx.dust=[];fx.mood='idle';fx.moodUntil=0;fx.speaker=null;fx.shakeUntil=0;fx.flashUntil=0;artifactId='crown';companion=false;},
  };
}
