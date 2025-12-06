import { Align } from './components';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export function horizontalPosition(
  memberCount: number,
  gap: number,
  align: Align,
  index: number
): Position {
  const totalWidth = (memberCount - 1) * gap;

  let startX: number;
  switch (align) {
    case Align.Left:
      startX = 0;
      break;
    case Align.Right:
      startX = -totalWidth;
      break;
    case Align.Center:
    default:
      startX = -totalWidth / 2;
      break;
  }

  return {
    x: startX + index * gap,
    y: 0,
    z: 0,
  };
}

export function verticalPosition(
  memberCount: number,
  gap: number,
  align: Align,
  index: number
): Position {
  const totalHeight = (memberCount - 1) * gap;

  let startY: number;
  switch (align) {
    case Align.Top:
      startY = 0;
      break;
    case Align.Bottom:
      startY = totalHeight;
      break;
    case Align.Center:
    default:
      startY = totalHeight / 2;
      break;
  }

  return {
    x: 0,
    y: startY - index * gap,
    z: 0,
  };
}

export function gridPosition(
  columns: number,
  gapX: number,
  gapY: number,
  alignX: Align,
  alignY: Align,
  index: number,
  totalCount: number
): Position {
  const col = index % columns;
  const row = Math.floor(index / columns);

  const totalColumns = Math.min(columns, totalCount);
  const totalRows = Math.ceil(totalCount / columns);

  const totalWidth = (totalColumns - 1) * gapX;
  const totalHeight = (totalRows - 1) * gapY;

  let startX: number;
  switch (alignX) {
    case Align.Left:
      startX = 0;
      break;
    case Align.Right:
      startX = -totalWidth;
      break;
    case Align.Center:
    default:
      startX = -totalWidth / 2;
      break;
  }

  let startY: number;
  switch (alignY) {
    case Align.Top:
      startY = 0;
      break;
    case Align.Bottom:
      startY = totalHeight;
      break;
    case Align.Center:
    default:
      startY = totalHeight / 2;
      break;
  }

  return {
    x: startX + col * gapX,
    y: startY - row * gapY,
    z: 0,
  };
}

export const AlignNames: Record<string, Align> = {
  left: Align.Left,
  center: Align.Center,
  right: Align.Right,
  top: Align.Top,
  bottom: Align.Bottom,
};
