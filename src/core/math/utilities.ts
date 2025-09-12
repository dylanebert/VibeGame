export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function slerp(
  fromX: number,
  fromY: number,
  fromZ: number,
  fromW: number,
  toX: number,
  toY: number,
  toZ: number,
  toW: number,
  t: number
): { x: number; y: number; z: number; w: number } {
  let dot = fromX * toX + fromY * toY + fromZ * toZ + fromW * toW;

  let toXAdjusted = toX;
  let toYAdjusted = toY;
  let toZAdjusted = toZ;
  let toWAdjusted = toW;

  if (dot < 0) {
    dot = -dot;
    toXAdjusted = -toX;
    toYAdjusted = -toY;
    toZAdjusted = -toZ;
    toWAdjusted = -toW;
  }

  if (dot > 0.9995) {
    const x = fromX + t * (toXAdjusted - fromX);
    const y = fromY + t * (toYAdjusted - fromY);
    const z = fromZ + t * (toZAdjusted - fromZ);
    const w = fromW + t * (toWAdjusted - fromW);

    const invLength = 1 / Math.sqrt(x * x + y * y + z * z + w * w);

    return {
      x: x * invLength,
      y: y * invLength,
      z: z * invLength,
      w: w * invLength,
    };
  }

  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);
  const scale0 = Math.sin((1 - t) * theta) / sinTheta;
  const scale1 = Math.sin(t * theta) / sinTheta;

  return {
    x: scale0 * fromX + scale1 * toXAdjusted,
    y: scale0 * fromY + scale1 * toYAdjusted,
    z: scale0 * fromZ + scale1 * toZAdjusted,
    w: scale0 * fromW + scale1 * toWAdjusted,
  };
}
