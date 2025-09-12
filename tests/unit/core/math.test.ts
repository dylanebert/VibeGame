import { describe, expect, it } from 'bun:test';
import { lerp, slerp } from 'vibegame';

describe('Math Utilities', () => {
  describe('lerp', () => {
    it('should interpolate between two values', () => {
      const startPos = 0;
      const endPos = 10;
      const progress = 0.5;

      const currentPos = lerp(startPos, endPos, progress);
      expect(currentPos).toBe(5);
    });

    it('should handle t=0 returning start value', () => {
      expect(lerp(10, 20, 0)).toBe(10);
      expect(lerp(-5, 5, 0)).toBe(-5);
    });

    it('should handle t=1 returning end value', () => {
      expect(lerp(10, 20, 1)).toBe(20);
      expect(lerp(-5, 5, 1)).toBe(5);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, -5, 0.5)).toBe(-7.5);
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });

    it('should handle fractional progress values', () => {
      expect(lerp(0, 100, 0.25)).toBe(25);
      expect(lerp(0, 100, 0.75)).toBe(75);
      expect(lerp(0, 100, 0.1)).toBe(10);
    });

    it('should handle t values outside 0-1 range', () => {
      expect(lerp(0, 10, -0.5)).toBe(-5);
      expect(lerp(0, 10, 1.5)).toBe(15);
      expect(lerp(0, 10, 2)).toBe(20);
    });

    it('should work for animation smoothing', () => {
      let position = 0;
      const target = 100;
      const speed = 0.1;

      position = lerp(position, target, speed);
      expect(position).toBe(10);

      position = lerp(position, target, speed);
      expect(position).toBe(19);

      position = lerp(position, target, speed);
      expect(position).toBe(27.1);
    });
  });

  describe('slerp', () => {
    it('should interpolate identity to 90 degree Y rotation', () => {
      const fromX = 0,
        fromY = 0,
        fromZ = 0,
        fromW = 1;
      const toX = 0,
        toY = 0.707,
        toZ = 0,
        toW = 0.707;

      const result = slerp(fromX, fromY, fromZ, fromW, toX, toY, toZ, toW, 0.5);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0.383, 2);
      expect(result.z).toBeCloseTo(0, 5);
      expect(result.w).toBeCloseTo(0.924, 2);
    });

    it('should return start quaternion when t=0', () => {
      const result = slerp(0, 0, 0, 1, 0, 0.707, 0, 0.707, 0);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
      expect(result.w).toBe(1);
    });

    it('should return end quaternion when t=1', () => {
      const result = slerp(0, 0, 0, 1, 0, 0.707, 0, 0.707, 1);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0.707, 3);
      expect(result.z).toBeCloseTo(0, 5);
      expect(result.w).toBeCloseTo(0.707, 3);
    });

    it('should handle interpolation between arbitrary quaternions', () => {
      const from = { x: 0.1, y: 0.2, z: 0.3, w: 0.9273 };
      const to = { x: 0.3, y: 0.1, z: 0.2, w: 0.9273 };

      const result = slerp(
        from.x,
        from.y,
        from.z,
        from.w,
        to.x,
        to.y,
        to.z,
        to.w,
        0.3
      );

      expect(result.x).toBeCloseTo(0.16, 1);
      expect(result.y).toBeCloseTo(0.17, 1);
      expect(result.z).toBeCloseTo(0.27, 1);
      expect(result.w).toBeCloseTo(0.933, 2);
    });

    it('should handle near-parallel quaternions', () => {
      const result = slerp(0, 0, 0, 1, 0.001, 0.001, 0.001, 0.999, 0.5);

      expect(result.x).toBeCloseTo(0.0005, 3);
      expect(result.y).toBeCloseTo(0.0005, 3);
      expect(result.z).toBeCloseTo(0.0005, 3);
      expect(result.w).toBeCloseTo(0.99975, 4);
    });

    it('should handle opposite quaternions', () => {
      const result = slerp(0, 0, 0, 1, 0, 1, 0, 0, 0.25);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0.383, 2);
      expect(result.z).toBeCloseTo(0, 5);
      expect(result.w).toBeCloseTo(0.924, 2);
    });

    it('should handle t values outside 0-1 for extrapolation', () => {
      const result = slerp(0, 0, 0, 1, 0, 0.383, 0, 0.924, 2);

      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
      expect(typeof result.z).toBe('number');
      expect(typeof result.w).toBe('number');
    });

    it('should maintain unit quaternion property', () => {
      const result = slerp(0.1, 0.2, 0.3, 0.9273, 0.3, 0.1, 0.2, 0.9273, 0.7);

      const magnitude = Math.sqrt(
        result.x * result.x +
          result.y * result.y +
          result.z * result.z +
          result.w * result.w
      );

      expect(magnitude).toBeCloseTo(1, 4);
    });
  });
});
