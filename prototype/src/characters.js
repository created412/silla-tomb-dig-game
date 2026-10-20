// 특정 출토품의 재현이 아닌, 토우에서 착안한 창작 점토 친구들.
import { ellipse, path, star } from './artwork.js';

export function drawCharacter(c, who, x, y, size, t, mood='idle', speaking=false, reduced=false) {
  const excited=mood==='glimmer'||mood==='artifactRevealed';
  const startled=mood==='tooHard'||mood==='collapse';
  const bounce=reduced?0:Math.sin(t/(speaking?90:650))*(speaking?3:1.2);
  const blink=!reduced && t%4300>4140;
  c.save(); c.translate(x,y); c.scale(size/160,size/160);
  ellipse(c,0,-4,66,9,'rgba(10,27,21,.28)'); c.translate(0,bounce);
  c.lineCap='round'; c.lineJoin='round'; c.lineWidth=3;
  const clay=c.createLinearGradient(-40,-120,45,0);
  clay.addColorStop(0,who==='frog'?'#d0aa7c':'#c69265');
  clay.addColorStop(.55,who==='frog'?'#b98a59':'#a77149'); clay.addColorStop(1,'#805536');
  if(who==='bird') {
    ellipse(c,0,-60,38,48,clay,'#68472e');ellipse(c,10,-105,29,26,clay,'#68472e');
    const flap=reduced?0:Math.sin(t/110)*18;
    path(c,[[-25,-75],[-64,-72-flap],[-40,-43],[-15,-44]],'#b58658','#68472e',3);
    path(c,[[24,-73],[62,-76-flap],[42,-41],[22,-45]],'#b58658','#68472e',3);
    path(c,[[32,-109],[54,-100],[32,-94]],'#dbb369','#68472e',2);
    ellipse(c,18,-111,4,blink?1:5,'#302c22');
    for(const px of [-14,14])path(c,[[px,-20],[px,-5],[px-8,-3],[px+7,-3]],null,'#68472e',4);
  } else if(who==='turtle') {
    ellipse(c,-35,-15,19,10,clay,'#68472e');ellipse(c,35,-15,19,10,clay,'#68472e');
    ellipse(c,0,-48,51,40,'#918058','#574e35');
    for(const [px,py] of [[0,-54],[-24,-40],[24,-40],[0,-25]]){
      const pts=Array.from({length:7},(_,i)=>[px+Math.cos(i*Math.PI/3)*17,py+Math.sin(i*Math.PI/3)*15]);path(c,pts,null,'#b8a777',2);
    }
    ellipse(c,0,-99,29,26,clay,'#68472e');
    for(const px of [-12,12]){ellipse(c,px,-103,3,blink?1:4,'#302c22');path(c,[[px-5,-111],[px+4,-111]],null,'#76563a',2);}
    path(c,[[-7,-87],[0,-85],[7,-87]],null,'#68472e',2);
  } else if(who==='frog') {
    // 낮고 넓은 몸과 짧은 팔다리, 튀어나온 눈.
    ellipse(c,-43,-20,24,16,clay,'#68472e'); ellipse(c,43,-20,24,16,clay,'#68472e');
    ellipse(c,0,-44,46,45,clay,'#68472e'); ellipse(c,0,-37,28,28,'#c99d69');
    ellipse(c,0,-88,52,34,clay,'#68472e');
    for(const side of [-1,1]) {
      ellipse(c,side*29,-112,19,20,clay,'#68472e');
      const eyeH=blink?1:(startled?12:7);
      ellipse(c,side*29,-111,excited?9:7,eyeH,'#302c22');
      if(!blink) ellipse(c,side*29-2,-114,2.3,2.3,'#fff0c5');
      const raised=startled ? -85 + (reduced?0:Math.sin(t/65+side)*9) : -36;
      path(c,[[side*38,-61],[side*62,raised],[side*68,raised-9]],null,'#69472f',14);
      path(c,[[side*38,-62],[side*62,raised],[side*68,raised-9]],null,'#ba8a5c',10);
      for(let k=0;k<3;k++) path(c,[[side*66,raised-6],[side*(65+k*5),raised-15+k*3]],null,'#ba8a5c',5);
    }
    if(startled) ellipse(c,0,-75,6,9,'#4b3427');
    else { c.beginPath(); c.moveTo(-17,-81); c.quadraticCurveTo(0,excited?-62:-75,17,-81); c.strokeStyle='#67442e'; c.stroke(); }
    ellipse(c,-38,-84,7,4,'#c7845d'); ellipse(c,38,-84,7,4,'#c7845d');
    if(mood==='collapse') {
      const drop=reduced?0:Math.max(0,1-(t%900)/350)*35;
      path(c,[[-7,-137-drop],[7,-143-drop],[20,-135-drop],[15,-123-drop],[-3,-124-drop]],'#8a9384','#515f54',2);
    }
  } else {
    // 도넛처럼 말린 몸, 길쭉한 목, 반쯤 감은 눈.
    ellipse(c,0,-25,59,25,clay,'#68472e');
    c.beginPath(); c.ellipse(-7,-26,32,10,0,0,Math.PI*1.7); c.strokeStyle='#795334'; c.lineWidth=5; c.stroke();
    c.beginPath(); c.moveTo(28,-28); c.bezierCurveTo(63,-54,10,-63,20,-91);
    c.strokeStyle='#68472e'; c.lineWidth=35; c.stroke(); c.strokeStyle=clay; c.lineWidth=29; c.stroke();
    ellipse(c,10,-102,40,26,clay,'#68472e');
    for(const ex of [-9,22]) {
      ellipse(c,ex,-104,6,blink?1:excited?9:5,'#302c22');
      if(!excited&&!blink) path(c,[[ex-8,-108],[ex+7,-105]],null,'#b38357',6);
      if(excited) ellipse(c,ex-2,-107,2,2,'#fff0c5');
    }
    c.beginPath(); c.moveTo(-6,-90); c.quadraticCurveTo(9,-85,24,-93); c.strokeStyle='#67442e'; c.lineWidth=3; c.stroke();
    if(!reduced && (t%3800<420||speaking)) path(c,[[0,-86],[-6,-74],[-13,-76],[-6,-74],[-5,-68]],null,'#bb7055',3);
    for(let i=0;i<6;i++) ellipse(c,-41+i*13,-22+(i%2)*3,2,3,'#dfb37c');
    if(mood==='collapse') path(c,[[46,-92],[55,-89],[60,-92]],null,'#e8d5ae',3);
  }
  // 고정된 점토 입자. 매 프레임 난수 생성 없이 재질을 유지한다.
  for(let i=0;i<16;i++) ellipse(c,((i*37)%65)-32,-26-((i*19)%38),.8,.8,'#88633f');
  if(excited) { star(c,-65,-116,8); star(c,61,-91,6); }
  if(mood==='tooHard'&&who==='frog') {
    path(c,[[58,-130],[63,-140]],null,'#ffe3a0',4); path(c,[[-57,-131],[-63,-139]],null,'#ffe3a0',4);
  }
  c.restore();
}
