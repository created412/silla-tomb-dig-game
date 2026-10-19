// HUD 안내 문구. 마지막으로 만진 셀의 맨 위 층 기준.
export function hintForLayer(layer) {
  switch (layer) {
    case 'soil': return '손가락으로 쓱쓱 문질러!';
    case 'rock': return '돌은 톡톡 두드려!';
    case 'wood': return '붓으로 살살…';
    default: return '다른 곳도 파 보자!';
  }
}
