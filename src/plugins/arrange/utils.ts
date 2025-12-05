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

export const AlignNames: Record<string, Align> = {
  left: Align.Left,
  center: Align.Center,
  right: Align.Right,
};
