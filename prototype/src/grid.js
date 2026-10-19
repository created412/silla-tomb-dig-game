// 캔버스 좌표 ↔ 셀 인덱스. 순수 함수.

export function layoutGrid({ width, height, cols, rows, padding }) {
  const cell = Math.floor(Math.min((width - 2 * padding) / cols, (height - 2 * padding) / rows));
  return {
    cell,
    x0: (width - cell * cols) / 2,
    y0: (height - cell * rows) / 2,
    cols,
    rows,
  };
}

export function cellAt(layout, px, py) {
  const cx = Math.floor((px - layout.x0) / layout.cell);
  const cy = Math.floor((py - layout.y0) / layout.cell);
  if (cx < 0 || cy < 0 || cx >= layout.cols || cy >= layout.rows) return -1;
  return cy * layout.cols + cx;
}

export function cellRect(layout, i) {
  const x = i % layout.cols, y = (i - x) / layout.cols;
  return { x: layout.x0 + x * layout.cell, y: layout.y0 + y * layout.cell, w: layout.cell, h: layout.cell };
}

export function neighbors4(cols, rows, i) {
  const x = i % cols, y = (i - x) / cols, out = [];
  if (x > 0) out.push(i - 1);
  if (x < cols - 1) out.push(i + 1);
  if (y > 0) out.push(i - cols);
  if (y < rows - 1) out.push(i + cols);
  return out;
}
