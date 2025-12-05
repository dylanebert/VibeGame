import { describe, expect, it } from 'bun:test';
import { Align, horizontalPosition } from 'vibegame/arrange';

describe('Horizontal Position', () => {
  describe('center alignment (default)', () => {
    it('should center single member at origin', () => {
      const pos = horizontalPosition(1, 2, Align.Center, 0);
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
      expect(pos.z).toBe(0);
    });

    it('should distribute two members symmetrically', () => {
      const pos0 = horizontalPosition(2, 4, Align.Center, 0);
      const pos1 = horizontalPosition(2, 4, Align.Center, 1);

      expect(pos0.x).toBe(-2);
      expect(pos1.x).toBe(2);
    });

    it('should distribute three members with correct spacing', () => {
      const pos0 = horizontalPosition(3, 3, Align.Center, 0);
      const pos1 = horizontalPosition(3, 3, Align.Center, 1);
      const pos2 = horizontalPosition(3, 3, Align.Center, 2);

      expect(pos0.x).toBe(-3);
      expect(pos1.x).toBe(0);
      expect(pos2.x).toBe(3);
    });

    it('should respect gap parameter', () => {
      const pos0 = horizontalPosition(2, 10, Align.Center, 0);
      const pos1 = horizontalPosition(2, 10, Align.Center, 1);

      expect(pos1.x - pos0.x).toBe(10);
    });

    it('should handle zero gap', () => {
      const pos0 = horizontalPosition(3, 0, Align.Center, 0);
      const pos1 = horizontalPosition(3, 0, Align.Center, 1);
      const pos2 = horizontalPosition(3, 0, Align.Center, 2);

      expect(pos0.x).toBe(0);
      expect(pos1.x).toBe(0);
      expect(pos2.x).toBe(0);
    });

    it('should keep y and z at zero', () => {
      for (let i = 0; i < 5; i++) {
        const pos = horizontalPosition(5, 2, Align.Center, i);
        expect(pos.y).toBe(0);
        expect(pos.z).toBe(0);
      }
    });

    it('should return correct positions for 5 members with gap 2', () => {
      const positions = [0, 1, 2, 3, 4].map((i) =>
        horizontalPosition(5, 2, Align.Center, i)
      );

      expect(positions[0].x).toBe(-4);
      expect(positions[1].x).toBe(-2);
      expect(positions[2].x).toBe(0);
      expect(positions[3].x).toBe(2);
      expect(positions[4].x).toBe(4);
    });
  });

  describe('left alignment', () => {
    it('should start at x=0 and extend positive', () => {
      const pos0 = horizontalPosition(3, 2, Align.Left, 0);
      const pos1 = horizontalPosition(3, 2, Align.Left, 1);
      const pos2 = horizontalPosition(3, 2, Align.Left, 2);

      expect(pos0.x).toBe(0);
      expect(pos1.x).toBe(2);
      expect(pos2.x).toBe(4);
    });

    it('should handle single member at origin', () => {
      const pos = horizontalPosition(1, 5, Align.Left, 0);
      expect(pos.x).toBe(0);
    });
  });

  describe('right alignment', () => {
    it('should end at x=0 and extend negative', () => {
      const pos0 = horizontalPosition(3, 2, Align.Right, 0);
      const pos1 = horizontalPosition(3, 2, Align.Right, 1);
      const pos2 = horizontalPosition(3, 2, Align.Right, 2);

      expect(pos0.x).toBe(-4);
      expect(pos1.x).toBe(-2);
      expect(pos2.x).toBe(0);
    });

    it('should handle single member at origin', () => {
      const pos = horizontalPosition(1, 5, Align.Right, 0);
      expect(pos.x).toBe(0);
    });
  });
});
