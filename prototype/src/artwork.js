// 직접 그린 교육용 도판. 천마총 금관의 장식 구성을 참고한 창작 벡터이며 실측 복원도가 아니다.
export function ellipse(c, x, y, rx, ry, fill, stroke) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.8; c.stroke(); }
}

export function path(c, points, fill, stroke, width = 1) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  if (fill) { c.closePath(); c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

export function star(c, x, y, r, color = '#fff3b0') {
  path(c, [[x,y-r],[x+r*.24,y-r*.24],[x+r,y],[x+r*.24,y+r*.24],
    [x,y+r],[x-r*.24,y+r*.24],[x-r,y],[x-r*.24,y-r*.24]], color);
}

// 400×360의 비율을 유지한다. 세 出자 장식, 두 사슴뿔, 달개, 곡옥, 드리개.
export function drawCrown(c, x, y, width, height) {
  const s = Math.min(width / 400, height / 360);
  c.save(); c.translate(x + (width - 400 * s) / 2, y + (height - 360 * s) / 2); c.scale(s, s);
  const gold = c.createLinearGradient(35, 0, 365, 220);
  gold.addColorStop(0, '#a97223'); gold.addColorStop(.24, '#ffe9a0');
  gold.addColorStop(.49, '#d5a234'); gold.addColorStop(.73, '#ffdf77'); gold.addColorStop(1, '#a97420');
  c.lineJoin = 'round'; c.lineCap = 'round';
  function metal(points, w = 11) {
    path(c, points, null, '#85531c', w + 2.5);
    path(c, points, null, gold, w);
    path(c, points.map(([px,py])=>[px-1.5,py-1]), null, '#ffe9a0', 1.4);
  }
  // 뒤편 사슴뿔 장식
  for (const side of [-1,1]) {
    const cx = 200 + side * 112;
    metal([[cx,221],[cx-side*4,144],[cx+side*9,91],[cx+side*24,44]], 9);
    metal([[cx+side*4,112],[cx+side*35,92],[cx+side*42,62]], 7);
    metal([[cx-side*2,163],[cx+side*34,142],[cx+side*48,114]], 7);
    metal([[cx+side*17,66],[cx-side*1,48],[cx-side*5,25]], 7);
  }
  for (const [cx, top, span] of [[116,48,31],[200,16,37],[284,48,31]]) {
    metal([[cx,top],[cx,235]], 12);
    for (let k = 0; k < 3; k++) {
      const by = top + 45 + k * 53;
      metal([[cx-span,by-27],[cx-span,by],[cx+span,by],[cx+span,by-27]], 9);
      for (const side of [-1,1]) {
        const px = cx + side * span;
        path(c, [[px,by+1],[px,by+15]], null, '#9d6b21', 1.4);
        ellipse(c, px, by+19, 6, 8, gold, '#b48930');
        ellipse(c, px-1, by+17, 2, 3, '#fff0b1');
      }
    }
    ellipse(c,cx,top-1,7,8,gold,'#9f7324');
  }
  // 금 띠의 곡면, 점열 문양과 둥근 달개
  c.beginPath(); c.moveTo(58,224); c.quadraticCurveTo(200,243,342,224);
  c.lineTo(342,262); c.quadraticCurveTo(200,282,58,262); c.closePath();
  c.fillStyle = gold; c.fill(); c.strokeStyle = '#8f621f'; c.lineWidth = 2; c.stroke();
  for (let i = 0; i < 36; i++) {
    const px = 64 + i * 7.75, curve = Math.sin((i / 35)*Math.PI)*10;
    ellipse(c,px,230+curve,1.3,1.3,'#895c1e'); ellipse(c,px,256+curve,1.3,1.3,'#895c1e');
  }
  for (let i = 0; i < 9; i++) ellipse(c,78+i*30,247+Math.sin(i/8*Math.PI)*10,5,5,gold,'#9b6a1d');
  function jade(px,py,flip=1) {
    c.save(); c.translate(px,py); c.scale(flip,1);
    c.beginPath(); c.moveTo(0,-5); c.bezierCurveTo(-13,-9,-13,12,-3,16);
    c.quadraticCurveTo(6,20,8,11); c.quadraticCurveTo(-1,14,2,4);
    c.quadraticCurveTo(5,-2,0,-5); c.fillStyle='#76ae8b'; c.fill();
    c.strokeStyle='#3f795c'; c.lineWidth=1.4; c.stroke();
    ellipse(c,-3,0,1.8,1.8,'#355d43'); c.restore();
  }
  for (const [px,py] of [[99,116],[216,83],[267,169],[182,185],[132,209]]) {
    path(c,[[px,py-13],[px,py]],null,'#b99140',1); jade(px,py);
  }
  for (const side of [-1,1]) {
    for (let j=0;j<3;j++) {
      const px=200+side*(143+j*9), end=303+(2-j)*15;
      path(c,[[px,249],[px+side*4,end]],null,'#d5a646',2);
      for (let yy=265;yy<end;yy+=12) ellipse(c,px+side*2,yy,4,5,gold,'#aa7c2a');
      jade(px+side*4,end+5,side);
    }
  }
  c.restore();
}

export function drawLandscape(c, w, h) {
  const sky = c.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,'#173f3b'); sky.addColorStop(.65,'#34786b'); sky.addColorStop(1,'#80a17b');
  c.fillStyle=sky; c.fillRect(0,0,w,h);
  ellipse(c,w*.78,h*.23,h*.11,h*.11,'#e9cc7e');
  // 완만한 봉분과 산책길. 실제 무덤 내부 구조를 표현하는 도판은 아니다.
  c.fillStyle='#30675b'; c.beginPath(); c.moveTo(0,h*.72);
  c.bezierCurveTo(w*.12,h*.37,w*.32,h*.5,w*.43,h*.68);
  c.bezierCurveTo(w*.58,h*.32,w*.89,h*.3,w,h*.7); c.lineTo(w,h); c.lineTo(0,h); c.fill();
  c.fillStyle='#5d8864'; c.beginPath(); c.moveTo(w*.36,h*.88);
  c.bezierCurveTo(w*.49,h*.4,w*.82,h*.34,w*.97,h*.86); c.lineTo(w,h); c.lineTo(0,h); c.fill();
  c.strokeStyle='#a9b77a'; c.lineWidth=3; c.beginPath(); c.moveTo(w*.48,h*.68);
  c.bezierCurveTo(w*.61,h*.43,w*.79,h*.43,w*.9,h*.67); c.stroke();
  c.fillStyle='#183e32'; c.beginPath(); c.moveTo(0,h*.85);
  c.quadraticCurveTo(w*.3,h*.78,w*.55,h*.89); c.quadraticCurveTo(w*.8,h*.77,w,h*.88);
  c.lineTo(w,h); c.lineTo(0,h); c.fill();
  for(let i=0;i<34;i++) {
    const px=((i*71)%100)/100*w, py=h*(.9+((i*13)%7)/100);
    path(c,[[px-4,py+9],[px,py],[px+3,py+8]],null,'#568465',2);
  }
}

// 말다래와 유리잔 역시 사진을 사용하지 않은 교육용 도판이다.
export function drawArtifact(c, id, x, y, w, h) {
  if(id==='crown'){drawCrown(c,x,y,w,h);return;}
  const s=Math.min(w/360,h/300);
  c.save();c.translate(x+(w-360*s)/2,y+(h-300*s)/2);c.scale(s,s);
  if(id==='saddle') {
    path(c,[[44,46],[303,46],[327,252],[29,252]],'#8a5937','#4d3627',4);
    path(c,[[57,59],[291,59],[311,236],[46,236]],'#b3824e','#d1aa70',3);
    for(let i=0;i<10;i++){
      const px=64+i*25;c.strokeStyle='#5b422d';c.lineWidth=3;
      c.beginPath();c.arc(px,76,7,0,Math.PI);c.stroke();c.beginPath();c.arc(px,220,7,Math.PI,Math.PI*2);c.stroke();
    }
    for(const px of [108,250]){path(c,[[px-8,50],[px-8,24],[px+8,24],[px+8,50]],null,'#6a482d',6);}
    // 달리는 동물, 뒤로 날리는 갈기와 꼬리. 실제 도상 세부를 실측 복제하지 않는다.
    c.fillStyle='#eee2bd';c.beginPath();c.moveTo(104,132);c.bezierCurveTo(128,106,179,112,204,132);
    c.lineTo(232,93);c.lineTo(255,99);c.lineTo(268,117);c.lineTo(248,128);c.lineTo(231,126);
    c.lineTo(215,163);c.bezierCurveTo(193,179,146,180,116,162);c.closePath();c.fill();
    path(c,[[237,99],[230,78],[247,97]],'#eee2bd');
    for(const pts of [[[208,158],[237,175],[261,161]],[[196,168],[216,198],[242,203]],[[132,164],[103,190],[72,184]],[[117,153],[89,170],[64,160]]])
      path(c,pts,null,'#eee2bd',9);
    path(c,[[110,139],[84,115],[58,128],[78,133]],null,'#eee2bd',9);
    for(let k=0;k<4;k++)path(c,[[228-k*3,108+k*7],[207-k*7,91+k*8]],null,'#eee2bd',4);
    ellipse(c,250,109,2,2,'#715038');
    for(const [px,py] of [[61,98],[295,96],[67,202],[290,203]])for(let k=0;k<4;k++){
      const a=k*Math.PI/2;ellipse(c,px+Math.cos(a)*5,py+Math.sin(a)*5,3,3,'#d9c391');}
  } else if(id==='ewer') {
    const g=c.createLinearGradient(100,0,240,0);g.addColorStop(0,'#245d70');g.addColorStop(.4,'#4e9b9b');g.addColorStop(1,'#163d5b');
    c.beginPath();c.moveTo(163,90);c.lineTo(157,49);c.lineTo(123,32);c.lineTo(168,24);c.lineTo(198,47);c.lineTo(194,94);c.bezierCurveTo(263,140,271,243,214,267);c.quadraticCurveTo(178,283,135,261);c.bezierCurveTo(85,226,104,143,163,90);c.fillStyle=g;c.fill();c.strokeStyle='#90b9a5';c.lineWidth=3;c.stroke();
    c.beginPath();c.moveTo(191,48);c.bezierCurveTo(280,42,287,155,227,165);c.strokeStyle='#427e83';c.lineWidth=13;c.stroke();
    for(const [px,py]of[[238,62],[261,109],[246,147]])for(let k=0;k<4;k++)path(c,[[px-10,py+k*3],[px+10,py+7+k*3]],null,'#e7ca62',2);
    path(c,[[145,123],[128,172],[133,226]],null,'#8dcec0',6);ellipse(c,174,42,20,7,'#173f53','#8aaf9c');
  } else if(id==='belt') {
    const g=c.createLinearGradient(30,0,330,0);g.addColorStop(0,'#aa7724');g.addColorStop(.5,'#ffe499');g.addColorStop(1,'#b6812a');
    for(let k=0;k<12;k++){const px=35+k*25;path(c,[[px,64],[px+22,64],[px+22,96],[px,96]],g,'#8b6329',2);ellipse(c,px+11,80,6,9,null,'#8c6d35');}
    for(let k=0;k<8;k++){const px=63+k*34,len=70+(k%3)*24;path(c,[[px,96],[px,96+len]],null,'#d6b052',3);for(let j=0;j<len;j+=17)ellipse(c,px,103+j,5,7,g,'#987235');if(k===2){ellipse(c,px,118+len,9,18,g,'#987235');path(c,[[px,134+len],[px-9,147+len],[px+9,147+len]],g,'#987235');}else if(k===5){c.beginPath();c.arc(px,115+len,12,0,Math.PI*1.5);c.strokeStyle='#9bbc8b';c.lineWidth=8;c.stroke();}else path(c,[[px-7,108+len],[px+7,108+len],[px+5,134+len],[px-5,134+len]],g,'#987235',2);}
  } else if(id==='mounds') {
    ellipse(c,180,240,158,20,'#b4ba83');
    for(const [px,py]of[[130,176],[224,143]]){c.beginPath();c.ellipse(px,py,85,84,0,Math.PI,Math.PI*2);c.lineTo(px+85,py+41);c.quadraticCurveTo(px,py+70,px-85,py+41);c.closePath();c.fillStyle=px===130?'#83a36a':'#5d8b64';c.fill();c.strokeStyle='#416d4e';c.lineWidth=3;c.stroke();}
    path(c,[[61,247],[295,247]],null,'#d1b67e',5);
  } else if(id==='glass') {
    const blue=c.createLinearGradient(92,0,265,0);blue.addColorStop(0,'#163a64');blue.addColorStop(.3,'#326f91');blue.addColorStop(.6,'#24567d');blue.addColorStop(1,'#102e58');
    c.beginPath();c.moveTo(93,47);c.bezierCurveTo(103,140,112,235,141,264);
    c.quadraticCurveTo(180,282,219,264);c.bezierCurveTo(248,235,257,140,267,47);c.closePath();c.fillStyle=blue;c.fill();c.strokeStyle='#74a6b1';c.lineWidth=3;c.stroke();
    ellipse(c,180,47,87,18,'#163953','#8fbcc3');ellipse(c,180,48,73,11,'#102e48');
    c.save();c.beginPath();c.moveTo(98,66);c.lineTo(263,66);c.lineTo(236,239);c.quadraticCurveTo(180,285,124,239);c.closePath();c.clip();
    for(let i=0;i<17;i++)path(c,[[105+i*9,63],[115+i*8,119]],null,'#4f8ea9',2);
    for(let row=0;row<5;row++)for(let col=0;col<7;col++){
      const px=106+col*25+(row%2)*12,py=132+row*26,pts=[];
      for(let k=0;k<6;k++){const a=k*Math.PI/3;pts.push([px+Math.cos(a)*14,py+Math.sin(a)*14]);}pts.push(pts[0]);path(c,pts,null,'#467c99',2);
    }c.restore();
    c.beginPath();c.moveTo(112,79);c.quadraticCurveTo(116,165,139,231);c.strokeStyle='rgba(183,222,221,.35)';c.lineWidth=7;c.stroke();
  }
  c.restore();
}
