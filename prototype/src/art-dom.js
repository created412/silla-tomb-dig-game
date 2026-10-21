// HTML 안의 작은 캔버스에 그림을 채운다: 토우(data-actor), 유물(data-art), 4컷 만화 한 컷(data-comic + data-panel).
// 모두 Codex가 만든 힉스필드 자산을 재사용한다. 보이는 캔버스만 매 프레임 그린다.
import { drawCharacter } from './characters.js';
import { drawGeneratedArtifact } from './generated-art.js';
import { drawArtifact } from './artwork.js';

const sheets = new Map();
const sceneAtlas = new Image();
sceneAtlas.src = new URL('../assets/higgsfield/dialogue-scenes.png', import.meta.url).href;
export function comicSheet(id) {
  if (!sheets.has(id)) {
    const img = new Image();
    img.src = new URL(`../assets/higgsfield/comic-${id}.png`, import.meta.url).href;
    sheets.set(id, img);
  }
  return sheets.get(id);
}

function fit(c) {
  const r = c.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const dp = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(r.width * dp), h = Math.round(r.height * dp);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return { w, h, dp };
}

export function paintDom(root, tMs, reduced = false) {
  for (const c of root.querySelectorAll('canvas[data-actor], canvas[data-art], canvas[data-comic], canvas[data-scene]')) {
    if (c.offsetParent === null) continue; // display:none 안의 캔버스는 건너뜀
    const s = fit(c); if (!s) continue;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, s.w, s.h);
    if (c.dataset.actor) {
      const locked = c.dataset.locked === '1';
      drawCharacter(ctx, c.dataset.actor, s.w / 2, s.h * 0.96, Math.min(s.w, s.h) * 0.96, tMs + (c.dataset.seed | 0), c.dataset.mood || 'idle', false, reduced || locked);
      if (locked) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(20,30,28,.85)'; ctx.fillRect(0, 0, s.w, s.h); ctx.globalCompositeOperation = 'source-over'; }
    } else if (c.dataset.art) {
      if (!drawGeneratedArtifact(ctx, c.dataset.art, 0, 0, s.w, s.h)) drawArtifact(ctx, c.dataset.art, s.w * 0.05, s.h * 0.05, s.w * 0.9, s.h * 0.9);
    } else if (c.dataset.comic || c.dataset.scene !== undefined) {
      const img = c.dataset.scene !== undefined ? sceneAtlas : comicSheet(c.dataset.comic);
      const n = (c.dataset.scene ?? c.dataset.panel) | 0;
      if (img.complete && img.naturalWidth) {
        const pw = img.naturalWidth / 2, ph = img.naturalHeight / 2, inset = 0.025;
        // 비율을 유지한다. 정사각형 기억 그림은 여백을 두어 중요한 유물을 자르지 않는다.
        const sw = pw * (1 - 2 * inset), sh = ph * (1 - 2 * inset);
        const scale = Math.min(s.w / sw, s.h / sh), w = sw * scale, h = sh * scale;
        ctx.fillStyle = '#173e32'; ctx.fillRect(0, 0, s.w, s.h);
        ctx.drawImage(img, (n % 2) * pw + pw * inset, Math.floor(n / 2) * ph + ph * inset, sw, sh, (s.w - w) / 2, (s.h - h) / 2, w, h);
      } else {
        ctx.fillStyle = '#2a3b36'; ctx.fillRect(0, 0, s.w, s.h);
        ctx.fillStyle = '#ffe9a8'; ctx.font = `${20 * s.dp}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('기억을 떠올리는 중…', s.w / 2, s.h / 2);
      }
    }
  }
}
