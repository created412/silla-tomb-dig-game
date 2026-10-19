// 캔버스 렌더러. 층은 아래(바닥·유물)에서 위(흙)로 겹쳐 그린다.
import { topLayer } from './dig-model.js';
import { cellRect } from './grid.js';

const COLORS = {
  bg: '#1f3b3a',
  floor: '#3a2a18',
  wood: '#5a3b1e',
  woodLine: '#3e2812',
  rock: '#6e6e6e',
  rockShade: '#4f4f4f',
  soil: '#8b6a3e',
  soilDark: '#6f5230',
  gold: '#e0b84a',
  goldDark: '#a67c1e',
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const fx = { dust: [], shakeUntil: 0, shakeStart: 0, flashUntil: 0, flashStart: 0 };

  function artifactSpan(state) {
    // 유물 셀들이 가로로 이어진 한 줄이라고 가정하고 전체 금관 영역을 구한다.
    const cells = [...state.artifactCells].sort((a, b) => a - b);
    return { first: cells[0], last: cells[cells.length - 1], count: cells.length };
  }

  function drawCrown(c, rect) {
    // 단순 도형 금관: 띠 + 세움 장식 3개 + 달개. 사진은 권리 확인 뒤 교체.
    const { x, y, w, h } = rect;
    const bandH = h * 0.22;
    const bandY = y + h * 0.62;
    c.fillStyle = COLORS.gold;
    c.strokeStyle = COLORS.goldDark;
    c.lineWidth = Math.max(1, h * 0.02);
    // 띠
    roundRect(c, x + w * 0.04, bandY, w * 0.92, bandH, h * 0.05);
    c.fill(); c.stroke();
    // 세움 장식 (出자 형태를 단순화)
    const uprights = [0.2, 0.5, 0.8];
    for (const u of uprights) {
      const cx = x + w * u;
      const topY = y + h * 0.08;
      c.fillRect(cx - w * 0.012, topY, w * 0.024, bandY - topY);
      c.strokeRect(cx - w * 0.012, topY, w * 0.024, bandY - topY);
      for (const k of [0.3, 0.6]) {
        const by = topY + (bandY - topY) * k;
        c.fillRect(cx - w * 0.06, by, w * 0.12, h * 0.03);
        c.fillRect(cx - w * 0.06, by - h * 0.1, w * 0.012, h * 0.1);
        c.fillRect(cx + w * 0.048, by - h * 0.1, w * 0.012, h * 0.1);
      }
    }
    // 달개(작은 원)
    c.fillStyle = '#f3d87a';
    for (let k = 0; k < 7; k++) {
      const px = x + w * (0.1 + 0.8 * (k / 6));
      c.beginPath(); c.arc(px, bandY + bandH * 0.5, h * 0.03, 0, Math.PI * 2); c.fill();
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function drawFloorOrArtifact(state, layout, i, span) {
    const r = cellRect(layout, i);
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (!state.artifactCells.has(i)) return;
    // 전체 금관을 유물 영역 크기로 그리되 이 셀만 클리핑
    const firstRect = cellRect(layout, span.first);
    const whole = { x: firstRect.x, y: firstRect.y, w: layout.cell * span.count, h: layout.cell };
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    drawCrown(ctx, whole);
    ctx.restore();
  }

  function drawWood(r, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COLORS.woodLine;
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      const yy = r.y + (r.h * k) / 4;
      ctx.beginPath(); ctx.moveTo(r.x, yy); ctx.lineTo(r.x + r.w, yy); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawRock(r, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.rockShade;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = COLORS.rock;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r.w * 0.42, r.h * 0.36, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawSoil(r, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.soil;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = COLORS.soilDark;
    // 고정된 패턴 점 (셀 좌표 기반, 매 프레임 동일)
    const seed = Math.floor(r.x * 7 + r.y * 13);
    for (let k = 0; k < 5; k++) {
      const px = r.x + ((seed * (k + 3)) % 97) / 97 * r.w;
      const py = r.y + ((seed * (k + 5)) % 89) / 89 * r.h;
      ctx.fillRect(px, py, r.w * 0.06, r.h * 0.06);
    }
    ctx.globalAlpha = 1;
  }

  function drawGlimmer(r, tMs) {
    const pulse = 0.55 + 0.45 * Math.sin(tMs / 250);
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r.w * 0.8);
    g.addColorStop(0, `rgba(224,184,74,${0.75 * pulse})`);
    g.addColorStop(1, 'rgba(224,184,74,0)');
    ctx.fillStyle = g;
    ctx.fillRect(r.x - r.w * 0.3, r.y - r.h * 0.3, r.w * 1.6, r.h * 1.6);
  }

  function drawDust(tMs) {
    fx.dust = fx.dust.filter(p => tMs - p.born < 500);
    for (const p of fx.dust) {
      const age = (tMs - p.born) / 500;
      ctx.globalAlpha = 1 - age;
      ctx.fillStyle = COLORS.soil;
      ctx.fillRect(p.x + p.vx * age * 30, p.y + age * age * 40, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  return {
    fx,
    draw(state, layout, tMs) {
      const w = canvas.width, h = canvas.height;
      ctx.save();
      if (tMs < fx.shakeUntil) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      }
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(-10, -10, w + 20, h + 20);
      if (!state) { ctx.restore(); return; }

      const span = artifactSpan(state);
      const n = state.cols * state.rows;
      for (let i = 0; i < n; i++) {
        const r = cellRect(layout, i);
        drawFloorOrArtifact(state, layout, i, span);
        if (state.wood[i] > 0) drawWood(r, state.wood[i]);
        if (state.glimmered.has(i) && state.wood[i] > 0) drawGlimmer(r, tMs);
        if (state.rock[i] > 0) drawRock(r, state.rock[i]);
        if (state.soil[i] > 0) drawSoil(r, state.soil[i]);
      }
      drawDust(tMs);
      ctx.restore();

      if (tMs < fx.flashUntil) {
        const a = 1 - (tMs - fx.flashStart) / (fx.flashUntil - fx.flashStart);
        ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
    drawCrownBig(scale, tMs) {
      // found 단계: 화면 중앙에 금관 확대
      const w = canvas.width, h = canvas.height;
      const cw = Math.min(w * 0.6, h * 0.9) * scale / 1.6;
      const ch = cw * 0.55;
      ctx.fillStyle = 'rgba(31,59,58,0.85)';
      ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, cw * 0.9);
      glow.addColorStop(0, `rgba(224,184,74,${0.35 + 0.1 * Math.sin(tMs / 300)})`);
      glow.addColorStop(1, 'rgba(224,184,74,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      drawCrown(ctx, { x: w / 2 - cw / 2, y: h / 2 - ch / 2, w: cw, h: ch });
    },
    addDust(cell, layout, tMs) {
      const r = cellRect(layout, cell);
      for (let k = 0; k < 6; k++) {
        fx.dust.push({ x: r.x + Math.random() * r.w, y: r.y + Math.random() * r.h, vx: Math.random() - 0.5, born: tMs });
      }
    },
    shake(ms, tMs) { fx.shakeStart = tMs; fx.shakeUntil = tMs + ms; },
    flash(ms, tMs) { fx.flashStart = tMs; fx.flashUntil = tMs + ms; },
  };
}
