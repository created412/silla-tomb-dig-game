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
