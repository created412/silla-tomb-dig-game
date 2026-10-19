// 재질은 리사이즈할 때, 마스크는 모델 잔량이 바뀔 때만 갱신한다.
import { ellipse, path } from './artwork.js';
function seeded(seed) {return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}

export function createTerrain(layout,dpr) {
  const {cell,cols,rows}=layout,w=cell*cols,h=cell*rows,random=seeded(57),vertices=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)vertices.push([
    x*cell+(x>0&&x<cols?(random()-.5)*cell*.28:0),y*cell+(y>0&&y<rows?(random()-.5)*cell*.28:0)]);
  const polygons=Array.from({length:cols*rows},(_,i)=>{
    const x=i%cols,y=Math.floor(i/cols),at=(a,b)=>vertices[b*(cols+1)+a];
    const corners=[at(x,y),at(x+1,y),at(x+1,y+1),at(x,y+1)];
    // 같은 변의 꼭짓점과 중점을 공유해 완전히 판 셀 사이에 막이 남지 않는다.
    return corners.flatMap((p,k)=>{const q=corners[(k+1)%4];return [p,
      [(p[0]+q[0])/2+(p[1]===q[1]?0:Math.sin((p[1]+q[1])*1.31)*cell*.035),
        (p[1]+q[1])/2+(p[0]===q[0]?0:Math.sin((p[0]+q[0])*1.73)*cell*.035)]];});
  });
  const layers={};
  for(const name of ['wood','rock','soil']) {
    const texture=surface(w,h),c=texture.getContext('2d'),rand=seeded(name.length*123+name.charCodeAt(0));
    c.fillStyle={soil:'#aa784e',rock:'#555e51',wood:'#61402b'}[name];c.fillRect(0,0,w,h);
    if(name==='soil') {
      for(let k=0;k<130;k++) {
        const x=rand()*w,y=rand()*h,r=(18+rand()*65)*dpr,g=c.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,k%2?'rgba(77,44,25,.13)':'rgba(247,199,129,.15)');g.addColorStop(1,'rgba(155,100,60,0)');
        c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
      }
      for(let k=0;k<w*h/(95*dpr*dpr);k++) {
        const x=rand()*w,y=rand()*h,r=(.5+rand()*1.8)*dpr;ellipse(c,x,y,r,r*.6,k%3?'#98683f':'#cc9c64');
      }
      for(let k=0;k<28;k++) {
        const x=rand()*w,y=rand()*h,r=(3+rand()*5)*dpr;
        ellipse(c,x+dpr,y+2*dpr,r,r*.6,'#805b39');ellipse(c,x,y,r,r*.6,'#c29b6e');
      }
      c.lineWidth=2*dpr;c.strokeStyle='#745435';
      for(let k=0;k<7;k++) {const x=rand()*w,y=rand()*h;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+18*dpr,y+7*dpr,x-10*dpr,y+23*dpr,x+10*dpr,y+38*dpr);c.stroke();}
    } else if(name==='rock') {
      const step=cell*.65;
      for(let ry=-1;ry<h/step+1;ry++)for(let rx=-1;rx<w/step+1;rx++) {
        const x=(rx+(ry%2)*.5)*step+(rand()-.5)*step*.2,y=ry*step*.78;
        const rw=step*(.43+rand()*.16),rh=step*(.3+rand()*.14),points=[];
        for(let j=0;j<7;j++){const a=j/7*Math.PI*2;points.push([x+Math.cos(a)*rw,y+Math.sin(a)*rh]);}
        c.shadowColor='#354338';c.shadowBlur=4*dpr;c.shadowOffsetY=3*dpr;
        path(c,points,['#9b9e87','#818b78','#b0ad90','#929782'][Math.floor(rand()*4)],'#596351',2*dpr);
        c.shadowBlur=0;c.shadowOffsetY=0;path(c,[points[4],points[5],points[6]],null,'#b9b99d',2*dpr);
        ellipse(c,x-rw*.2,y-rh*.1,rw*.15,rh*.1,'#737f6c');
      }
    } else {
      const plank=cell*.73;
      for(let yy=0;yy<h;yy+=plank) {
        c.fillStyle=Math.round(yy/plank)%2?'#7f5433':'#95633c';c.fillRect(0,yy,w,plank-3*dpr);
        for(let k=0;k<7;k++) {
          const y=yy+(k+1)/8*plank;c.beginPath();c.moveTo(0,y);
          for(let x=0;x<=w;x+=20*dpr)c.lineTo(x,y+Math.sin(x/(42*dpr)+k)*2*dpr);
          c.strokeStyle=k%2?'#ac7848':'#6e462c';c.lineWidth=dpr;c.stroke();
        }
        const kx=rand()*w;for(let k=1;k<4;k++)ellipse(c,kx,yy+plank*.5,k*5*dpr,k*1.7*dpr,null,'#68442c');
      }
    }
    layers[name]={texture,canvas:surface(w,h),previous:null};
  }
  function hole(c,points,cx,cy,scale) {
    c.beginPath();
    if(scale<1) {
      // 부분 제거는 각진 셀의 축소판이 아닌 울퉁불퉁한 둥근 구멍이다.
      const outline=Array.from({length:12},(_,k)=>{
        const a=k/12*Math.PI*2;
        const radius=cell*.58*scale*(1+.09*Math.sin(k*2.7+cx*.13+cy*.17));
        return [cx+Math.cos(a)*radius,cy+Math.sin(a)*radius];
      });
      // 완전히 판 셀의 경계를 넘지 않는다. 경계 밖은 아직 다른 셀의 흙이다.
      c.beginPath();points.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
      c.beginPath();const first=outline[0],last=outline.at(-1);c.moveTo((first[0]+last[0])/2,(first[1]+last[1])/2);
      outline.forEach((p,k)=>{const next=outline[(k+1)%outline.length];c.quadraticCurveTo(p[0],p[1],(p[0]+next[0])/2,(p[1]+next[1])/2);});c.closePath();
      // clip은 호출한 fill/stroke에도 적용되어야 하므로 호출부가 복원한다.
    } else {points.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
  }
  function update(name,values) {
    const layer=layers[name];if(layer.previous&&values.every((v,i)=>v===layer.previous[i]))return;
    layer.previous=Float64Array.from(values);const c=layer.canvas.getContext('2d');c.clearRect(0,0,w,h);c.drawImage(layer.texture,0,0);
    for(let i=0;i<values.length;i++) {
      const v=values[i],cx=(i%cols+.5)*cell,cy=(Math.floor(i/cols)+.5)*cell;if(v>=1)continue;
      if(name==='rock'&&v>0) {
        const p=[[cx-cell*.37,cy-cell*.4],[cx-cell*.12,cy-cell*.15],[cx+cell*.08,cy-cell*.2],[cx,cy+cell*.08],[cx+cell*.3,cy+cell*.38]];
        path(c,p,null,'#d0c4a0',4*dpr);path(c,p,null,'#354339',2*dpr);
        if(v<.4){path(c,[[cx,cy+cell*.08],[cx-cell*.24,cy+cell*.12],[cx-cell*.38,cy+cell*.35]],null,'#354339',3*dpr);path(c,[[cx+cell*.08,cy-cell*.2],[cx+cell*.3,cy-cell*.33]],null,'#354339',2*dpr);}
        continue;
      }
      const scale=v===0?1:Math.sqrt(1-v)*.96;
      c.save();c.globalCompositeOperation='destination-out';hole(c,polygons[i],cx,cy,scale);c.fill();
      if(v===0){c.lineWidth=1.5;c.stroke();}c.restore();
      if(v>0){c.save();c.globalCompositeOperation='source-atop';hole(c,polygons[i],cx,cy,scale);c.strokeStyle='rgba(53,33,19,.6)';c.lineWidth=5*dpr;c.stroke();c.strokeStyle='rgba(231,183,113,.7)';c.lineWidth=1.4*dpr;c.stroke();c.restore();}
    }
  }
  return {draw(c,name,state){update(name,state[name]);c.drawImage(layers[name].canvas,layout.x0,layout.y0);}};
}
