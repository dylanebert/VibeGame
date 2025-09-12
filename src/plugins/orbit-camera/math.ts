const TWO_PI = Math.PI * 2;

export function normalizeAngle(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

export function shortestAngleDiff(from: number, to: number): number {
  let diff = to - from;
  while (diff > Math.PI) diff -= TWO_PI;
  while (diff < -Math.PI) diff += TWO_PI;
  return diff;
}

export function smoothLerp(smoothness: number, deltaTime: number): number {
  return 1 - Math.pow(1 - smoothness, deltaTime * 60);
}
