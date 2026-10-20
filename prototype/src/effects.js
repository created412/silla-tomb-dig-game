// 도전 오버레이: 하늘·해·어둠·금·지렁이·탐색 별·결과 별. 렌더러 위에 덧그린다.
import { cellRect } from './grid.js';
import { star } from './artwork.js';

function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
function mix(a, b, t) { return a + (b - a) * t; }
function rgb(c1, c2, t) { return `rgb(${Math.round(mix(c1[0], c2[0], t))},${Math.round(mix(c1[1], c2[1], t))},${Math.round(mix(c1[2], c2[2], t))})`; }

const DAY = [159, 211, 232], DUSK = [242, 166, 90], NIGHT = [27, 36, 64];

export function createEffects(canvas) {
  const ctx = canvas.getContext('2d');
  const dp = () => canvas.width / canvas.getBoundingClientRect().width;

  function skyColor(p) {
    return p < 0.6 ? rgb(DAY, DUSK, p / 0.6) : rgb(DUSK, NIGHT, (p - 0.6) / 0.4);
  }

  return {
    // progress 0(아침)→1(해 짐). bandCss: 하늘 띠 높이(CSS px)
    drawSky(progress, bandCss, tMs) {
      const d = dp(), w = canvas.width, bandH = bandCss * d;
      const g = ctx.createLinearGradient(0, 0, 0, bandH);
      g.addColorStop(0, skyColor(progress));
      g.addColorStop(1, skyColor(Math.min(1, progress + 0.15)));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, bandH);
      // 지평선 띠
      ctx.fillStyle = 'rgba(20,60,48,.55)'; ctx.fillRect(0, bandH - 4 * d, w, 4 * d);
      // 구름 (낮에만)
      if (progress < 0.5) {
        ctx.globalAlpha = (0.5 - progress) * 1.4;
        ctx.fillStyle = '#ffffff';
        for (const [cx, cy, r] of [[0.22, 0.45, 9], [0.27, 0.4, 12], [0.32, 0.47, 8], [0.68, 0.35, 8], [0.72, 0.3, 11], [0.77, 0.38, 7]]) {
          ctx.beginPath(); ctx.arc(w * cx + Math.sin(tMs / 4000) * 6 * d, bandH * cy, r * d, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // 해
      const x = w * (0.08 + 0.84 * progress);
      const y = bandH * (0.95 - 0.68 * Math.sin(Math.PI * progress));
      const r = bandH * 0.24;
      const glow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.6);
      glow.addColorStop(0, 'rgba(255,230,140,.55)'); glow.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
      ctx.fillStyle = progress < 0.7 ? '#ffd84a' : rgb([255, 216, 74], [255, 120, 60], (progress - 0.7) / 0.3);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2 * d; ctx.stroke();
      // 마지막 20%: 별이 뜬다
      if (progress > 0.8) {
        ctx.fillStyle = `rgba(255,255,255,${(progress - 0.8) * 4})`;
        const rand = seeded(9);
        for (let k = 0; k < 14; k++) { const sx = rand() * w, sy = rand() * bandH * 0.7; ctx.fillRect(sx, sy, 2 * d, 2 * d); }
      }
    },

    drawDarkness(dk) {
      if (dk <= 0) return;
      ctx.fillStyle = `rgba(10,16,40,${0.82 * Math.min(1, dk)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },

    // 금 간 유물 칸: 흰빛 금 선 (셀 인덱스로 시드, 매 프레임 동일)
    drawCracks(cells, layout, tMs) {
      const d = dp();
      for (const [k, i] of cells.entries()) {
        const r = cellRect(layout, i), rand = seeded(i * 31 + k * 7 + 1);
        const cx = r.x + r.w * (0.3 + rand() * 0.4), cy = r.y + r.h * (0.3 + rand() * 0.4);
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let b = 0; b < 3; b++) {
          const pts = [[cx, cy]];
          let a = rand() * Math.PI * 2, x = cx, y = cy;
          for (let s = 0; s < 3; s++) { a += (rand() - 0.5) * 1.2; const len = r.w * (0.12 + rand() * 0.2); x += Math.cos(a) * len; y += Math.sin(a) * len; pts.push([x, y]); }
          ctx.beginPath(); pts.forEach(([px, py], n) => n ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
          ctx.strokeStyle = 'rgba(42,26,10,.8)'; ctx.lineWidth = 4 * d; ctx.stroke();
          ctx.strokeStyle = '#f8f4e6'; ctx.lineWidth = 1.6 * d; ctx.stroke();
        }
        ctx.restore();
      }
    },

    // 튀어나온 지렁이: 분홍 S자 + 눈, untilMs까지 꿈틀
    drawWorm(cell, layout, tMs, untilMs) {
      if (tMs >= untilMs || cell < 0) return;
      const d = dp(), r = cellRect(layout, cell);
      const life = Math.min(1, (untilMs - tMs) / 300); // 사라질 때 살짝 작아짐
      const cx = r.x + r.w / 2, base = r.y + r.h * 0.55 - r.h * 0.3 * Math.min(1, (2000 - (untilMs - tMs)) / 200);
      const wig = Math.sin(tMs / 80) * r.w * 0.08;
      ctx.save(); ctx.globalAlpha = life; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r.w * 0.3, base + r.h * 0.2);
      ctx.bezierCurveTo(cx - r.w * 0.2 + wig, base - r.h * 0.25, cx + r.w * 0.1 - wig, base + r.h * 0.3, cx + r.w * 0.3, base - r.h * 0.15);
      ctx.strokeStyle = '#8a4a4a'; ctx.lineWidth = r.w * 0.16; ctx.stroke();
      ctx.strokeStyle = '#f2a0b0'; ctx.lineWidth = r.w * 0.12; ctx.stroke();
      // 눈
      const ex = cx + r.w * 0.3, ey = base - r.h * 0.15;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 4 * d, ey - 3 * d, 3.2 * d, 0, 7); ctx.arc(ex + 3 * d, ey - 4 * d, 3.2 * d, 0, 7); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(ex - 3.5 * d, ey - 3 * d, 1.4 * d, 0, 7); ctx.arc(ex + 3.5 * d, ey - 4 * d, 1.4 * d, 0, 7); ctx.fill();
      ctx.restore();
    },

    // 새의 탐색: 유물 칸 위에 깜빡이는 별
    drawHint(cells, layout, tMs) {
      const pulse = 0.6 + 0.4 * Math.sin(tMs / 120);
      ctx.save(); ctx.globalAlpha = pulse;
      for (const i of cells) { const r = cellRect(layout, i); star(ctx, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.28, '#fff1a1'); }
      ctx.restore();
    },

    // 결과 화면 별 3개 틀. sinceMs: 결과가 뜬 뒤 흐른 시간. n개가 0.5초 간격으로 켜진다.
    drawStars(n, tMs, sinceMs, cyCss) {
      const d = dp(), w = canvas.width, size = 34 * d, gap = 46 * d, cy = cyCss * d;
      for (let k = 0; k < 3; k++) {
        const x = w / 2 + (k - 1) * gap;
        const onAt = 400 + k * 500, lit = k < n && sinceMs >= onAt;
        let s = size;
        if (lit) { const age = Math.min(1, (sinceMs - onAt) / 250); s = size * (1.6 - 0.6 * age); }
        ctx.save(); ctx.globalAlpha = lit ? 1 : 0.35;
        star(ctx, x, cy, s, lit ? '#ffd84a' : '#6f7a6a');
        if (lit) { ctx.globalAlpha = 0.5; star(ctx, x, cy, s * 0.5, '#fff7c0'); }
        ctx.restore();
      }
    },
  };
}
