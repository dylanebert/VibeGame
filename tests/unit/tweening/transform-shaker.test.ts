import { beforeEach, describe, expect, it } from 'bun:test';
import type { System } from 'vibegame';
import { State } from 'vibegame';
import {
  Transform,
  WorldTransform,
  TransformsPlugin,
} from 'vibegame/transforms';
import {
  createShaker,
  createTween,
  TransformShaker,
  TransformShakerApplySystem,
  TransformShakerRestoreSystem,
  TweenPlugin,
  transformShakerBaseRegistry,
  transformShakerQuatRegistry,
} from 'vibegame/tweening';

describe('TransformShaker', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(TweenPlugin);
    transformShakerBaseRegistry.clear();
    transformShakerQuatRegistry.clear();
  });

  describe('Position Shaker', () => {
    it('should modify WorldTransform.posY during draw', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      Transform.posY[entity] = 5;

      // Run one step to generate WorldTransform
      state.step(1 / 60);
      expect(WorldTransform.posY[entity]).toBe(5);

      // Create position shaker
      createShaker(state, entity, 'transform.pos-y', {
        value: 2,
        intensity: 1,
        mode: 'additive',
      });

      let drawValue = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [TransformShakerApplySystem],
        before: [TransformShakerRestoreSystem],
        update: () => {
          drawValue = WorldTransform.posY[entity];
        },
      };
      state.registerSystem(drawSpy);

      state.step(1 / 60);

      // During draw: WorldTransform.posY should be 5 + 2 = 7
      expect(drawValue).toBe(7);
    });

    it('should restore WorldTransform after rendering', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      Transform.posY[entity] = 5;

      state.step(1 / 60);

      createShaker(state, entity, 'transform.pos-y', {
        value: 2,
        intensity: 1,
        mode: 'additive',
      });

      let afterRestoreValue = 0;
      const afterRestoreSpy: System = {
        group: 'simulation',
        update: () => {
          afterRestoreValue = WorldTransform.posY[entity];
        },
      };
      state.registerSystem(afterRestoreSpy);

      state.step(1 / 60);
      state.step(1 / 60);

      // After restore, WorldTransform should be back to base value
      expect(afterRestoreValue).toBe(5);
    });
  });

  describe('Scale Shaker', () => {
    it('should apply multiplicative scale to all axes', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      Transform.scaleX[entity] = 1;
      Transform.scaleY[entity] = 1;
      Transform.scaleZ[entity] = 1;

      state.step(1 / 60);

      // Use 'scale' shorthand for all axes
      createShaker(state, entity, 'scale', {
        value: 2,
        intensity: 1,
        mode: 'multiplicative',
      });

      let drawX = 0,
        drawY = 0,
        drawZ = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [TransformShakerApplySystem],
        before: [TransformShakerRestoreSystem],
        update: () => {
          drawX = WorldTransform.scaleX[entity];
          drawY = WorldTransform.scaleY[entity];
          drawZ = WorldTransform.scaleZ[entity];
        },
      };
      state.registerSystem(drawSpy);

      state.step(1 / 60);

      // Multiplicative: 1 * (1 + (2-1) * 1) = 2
      expect(drawX).toBe(2);
      expect(drawY).toBe(2);
      expect(drawZ).toBe(2);
    });

    it('should apply single-axis scale shaker', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      Transform.scaleX[entity] = 2;
      Transform.scaleY[entity] = 2;
      Transform.scaleZ[entity] = 2;

      state.step(1 / 60);

      createShaker(state, entity, 'transform.scale-y', {
        value: 0.5,
        intensity: 1,
        mode: 'multiplicative',
      });

      let drawX = 0,
        drawY = 0,
        drawZ = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [TransformShakerApplySystem],
        before: [TransformShakerRestoreSystem],
        update: () => {
          drawX = WorldTransform.scaleX[entity];
          drawY = WorldTransform.scaleY[entity];
          drawZ = WorldTransform.scaleZ[entity];
        },
      };
      state.registerSystem(drawSpy);

      state.step(1 / 60);

      // Only Y should be affected: 2 * (1 + (0.5-1) * 1) = 2 * 0.5 = 1
      expect(drawX).toBe(2);
      expect(drawY).toBe(1);
      expect(drawZ).toBe(2);
    });
  });

  describe('Rotation Shaker', () => {
    it('should modify quaternion during draw', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      Transform.rotW[entity] = 1; // Identity quaternion

      state.step(1 / 60);

      // Create rotation shaker (45 degrees around Z)
      createShaker(state, entity, 'transform.euler-z', {
        value: 45,
        intensity: 1,
        mode: 'additive',
      });

      let drawRotW = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [TransformShakerApplySystem],
        before: [TransformShakerRestoreSystem],
        update: () => {
          drawRotW = WorldTransform.rotW[entity];
        },
      };
      state.registerSystem(drawSpy);

      state.step(1 / 60);

      // Quaternion W for 45deg Z rotation: cos(22.5 * PI/180) ≈ 0.924
      expect(drawRotW).toBeCloseTo(0.924, 2);
    });

    it('should restore quaternion after rendering', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      Transform.rotW[entity] = 1;

      state.step(1 / 60);

      createShaker(state, entity, 'transform.euler-z', {
        value: 45,
        intensity: 1,
        mode: 'additive',
      });

      let afterRestoreRotW = 0;
      const afterRestoreSpy: System = {
        group: 'simulation',
        update: () => {
          afterRestoreRotW = WorldTransform.rotW[entity];
        },
      };
      state.registerSystem(afterRestoreSpy);

      state.step(1 / 60);
      state.step(1 / 60);

      // Should be restored to identity quaternion
      expect(afterRestoreRotW).toBe(1);
    });
  });

  describe('Intensity Tweening', () => {
    it('should allow intensity to be tweened', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      Transform.posY[entity] = 10;

      state.step(1 / 60);

      const shakerId = createShaker(state, entity, 'transform.pos-y', {
        value: 5,
        intensity: 0,
        mode: 'additive',
      });

      createTween(state, shakerId!, 'transform-shaker.intensity', {
        from: 0,
        to: 1,
        duration: 1,
      });

      let drawValue = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [TransformShakerApplySystem],
        before: [TransformShakerRestoreSystem],
        update: () => {
          drawValue = WorldTransform.posY[entity];
        },
      };
      state.registerSystem(drawSpy);

      // At t=0, intensity=0: posY = 10 + 5*0 = 10
      state.step(0.001);
      expect(drawValue).toBeCloseTo(10, 0);

      // At t=0.5, intensity=0.5: posY = 10 + 5*0.5 = 12.5
      state.step(0.5);
      expect(drawValue).toBeCloseTo(12.5, 0);

      // At t=1, intensity=1: posY = 10 + 5*1 = 15
      state.step(0.5);
      expect(drawValue).toBeCloseTo(15, 0);
    });
  });

  describe('Validation', () => {
    it('should return null when entity lacks Transform', () => {
      const entity = state.createEntity();
      // Don't add Transform component

      const result = createShaker(state, entity, 'transform.pos-y', {
        value: 5,
      });
      expect(result).toBeNull();
    });

    it('should handle missing WorldTransform gracefully', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      // Don't step yet - WorldTransform not added

      const shakerId = createShaker(state, entity, 'transform.pos-y', {
        value: 5,
        intensity: 1,
      });

      expect(shakerId).not.toBeNull();
      expect(state.hasComponent(shakerId!, TransformShaker)).toBe(true);

      // Should not crash when WorldTransform is missing
      state.step(1 / 60);
    });
  });

  describe('Cleanup', () => {
    it('should clean up registries when shaker is destroyed', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);

      state.step(1 / 60);

      const shakerId = createShaker(state, entity, 'transform.pos-y', {
        value: 5,
      });

      state.step(1 / 60);
      // Registry should have an entry
      expect(transformShakerBaseRegistry.size).toBeGreaterThan(0);

      state.destroyEntity(shakerId!);
      state.step(1 / 60);

      // Registry should be cleaned up
      expect(transformShakerBaseRegistry.size).toBe(0);
    });
  });

  describe('Multiple Shakers', () => {
    it('should compose additive shakers correctly', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      Transform.posX[entity] = 10;

      state.step(1 / 60);

      createShaker(state, entity, 'transform.pos-x', {
        value: 3,
        intensity: 1,
        mode: 'additive',
      });

      createShaker(state, entity, 'transform.pos-x', {
        value: 2,
        intensity: 1,
        mode: 'additive',
      });

      let drawValue = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [TransformShakerApplySystem],
        before: [TransformShakerRestoreSystem],
        update: () => {
          drawValue = WorldTransform.posX[entity];
        },
      };
      state.registerSystem(drawSpy);

      state.step(1 / 60);

      // 10 + 3 + 2 = 15
      expect(drawValue).toBe(15);
    });
  });
});
