import { beforeEach, describe, expect, it } from 'bun:test';
import { defineComponent, Types } from 'bitecs';
import type { System } from 'vibegame';
import { State } from 'vibegame';
import {
  createShaker,
  createTween,
  Shaker,
  ShakerApplySystem,
  ShakerRestoreSystem,
  shakerFieldRegistry,
  TweenPlugin,
} from 'vibegame/tweening';

describe('Shaker System', () => {
  let state: State;
  const TestComponent = defineComponent({ value: Types.f32 });

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TweenPlugin);
    state.registerComponent('test', TestComponent);
  });

  describe('Test 1: Base value changes via tween', () => {
    it('should interpolate base values visible in draw group', () => {
      const entity = state.createEntity();
      state.addComponent(entity, TestComponent);
      TestComponent.value[entity] = 0;

      createTween(state, entity, 'test.value', {
        from: 0,
        to: 10,
        duration: 1,
      });

      let drawValue = 0;
      const drawSpy: System = {
        group: 'draw',
        update: () => {
          drawValue = TestComponent.value[entity];
        },
      };
      state.registerSystem(drawSpy);

      state.step(0.5);
      expect(drawValue).toBeCloseTo(5, 1);

      state.step(0.5);
      expect(drawValue).toBeCloseTo(10, 1);
    });
  });

  describe('Test 2: Shaker modifies draw value, base unchanged', () => {
    it('should apply shaker at draw time without affecting simulation base', () => {
      const entity = state.createEntity();
      state.addComponent(entity, TestComponent);
      TestComponent.value[entity] = 10;

      createShaker(state, entity, 'test.value', {
        value: 5,
        intensity: 1,
        mode: 'additive',
      });

      let drawValue = 0;
      let simulationValue = 0;

      const simulationSpy: System = {
        group: 'simulation',
        update: () => {
          simulationValue = TestComponent.value[entity];
        },
      };

      const drawSpy: System = {
        group: 'draw',
        after: [ShakerApplySystem],
        before: [ShakerRestoreSystem],
        update: () => {
          drawValue = TestComponent.value[entity];
        },
      };

      state.registerSystem(simulationSpy);
      state.registerSystem(drawSpy);

      state.step(1 / 60);

      // Draw sees modified value (10 + 5 = 15)
      expect(drawValue).toBe(15);

      // Next simulation tick sees restored base (10)
      state.step(1 / 60);
      expect(simulationValue).toBe(10);
    });
  });

  describe('Test 3: Tween targeting shaker.intensity', () => {
    it('should animate shaker effect via intensity tween', () => {
      const entity = state.createEntity();
      state.addComponent(entity, TestComponent);
      TestComponent.value[entity] = 10;

      const shakerId = createShaker(state, entity, 'test.value', {
        value: 5,
        intensity: 0,
        mode: 'additive',
      });

      createTween(state, shakerId!, 'shaker.intensity', {
        from: 0,
        to: 1,
        duration: 1,
      });

      let drawValue = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [ShakerApplySystem],
        before: [ShakerRestoreSystem],
        update: () => {
          drawValue = TestComponent.value[entity];
        },
      };
      state.registerSystem(drawSpy);

      // Initial step - intensity near 0
      state.step(0.001);
      expect(drawValue).toBeCloseTo(10, 0);

      // At t=0.5, intensity=0.5: value = 10 + 5*0.5 = 12.5
      state.step(0.5);
      expect(drawValue).toBeCloseTo(12.5, 0);

      // At t=1, intensity=1: value = 10 + 5*1 = 15
      state.step(0.5);
      expect(drawValue).toBeCloseTo(15, 0);
    });
  });

  describe('Test 4: Multiple shakers compose correctly', () => {
    it('should compose additive before multiplicative', () => {
      const entity = state.createEntity();
      state.addComponent(entity, TestComponent);
      TestComponent.value[entity] = 10;

      // Additive shaker: +5
      createShaker(state, entity, 'test.value', {
        value: 5,
        intensity: 1,
        mode: 'additive',
      });

      // Another additive shaker: +3
      createShaker(state, entity, 'test.value', {
        value: 3,
        intensity: 1,
        mode: 'additive',
      });

      // Multiplicative shaker: *2
      createShaker(state, entity, 'test.value', {
        value: 2,
        intensity: 1,
        mode: 'multiplicative',
      });

      let drawValue = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [ShakerApplySystem],
        before: [ShakerRestoreSystem],
        update: () => {
          drawValue = TestComponent.value[entity];
        },
      };
      state.registerSystem(drawSpy);

      state.step(1 / 60);

      // Expected: (10 + 5 + 3) * 2 = 36
      expect(drawValue).toBe(36);
    });

    it('should handle multiplicative with intensity=0 as identity', () => {
      const entity = state.createEntity();
      state.addComponent(entity, TestComponent);
      TestComponent.value[entity] = 10;

      // Multiplicative shaker with intensity=0 should have no effect
      createShaker(state, entity, 'test.value', {
        value: 0,
        intensity: 0,
        mode: 'multiplicative',
      });

      let drawValue = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [ShakerApplySystem],
        before: [ShakerRestoreSystem],
        update: () => {
          drawValue = TestComponent.value[entity];
        },
      };
      state.registerSystem(drawSpy);

      state.step(1 / 60);

      // With intensity=0: result = base * (1 + (0-1)*0) = base * 1 = 10
      expect(drawValue).toBe(10);
    });
  });

  describe('Cleanup', () => {
    it('should clean up registries when shaker entity is destroyed', () => {
      const entity = state.createEntity();
      state.addComponent(entity, TestComponent);
      TestComponent.value[entity] = 10;

      const shakerId = createShaker(state, entity, 'test.value', { value: 5 });

      state.step(1 / 60);
      expect(shakerFieldRegistry.has(shakerId!)).toBe(true);

      state.destroyEntity(shakerId!);
      state.step(1 / 60);

      expect(shakerFieldRegistry.has(shakerId!)).toBe(false);
    });
  });

  describe('createShaker', () => {
    it('should return null for invalid target', () => {
      const entity = state.createEntity();
      state.addComponent(entity, TestComponent);

      const result = createShaker(state, entity, 'invalid.field', { value: 5 });
      expect(result).toBeNull();
    });

    it('should default to additive mode', () => {
      const entity = state.createEntity();
      state.addComponent(entity, TestComponent);
      TestComponent.value[entity] = 10;

      createShaker(state, entity, 'test.value', { value: 5 });

      let drawValue = 0;
      const drawSpy: System = {
        group: 'draw',
        after: [ShakerApplySystem],
        before: [ShakerRestoreSystem],
        update: () => {
          drawValue = TestComponent.value[entity];
        },
      };
      state.registerSystem(drawSpy);

      state.step(1 / 60);

      // Default additive: 10 + 5 = 15
      expect(drawValue).toBe(15);
    });

    it('should default intensity to 1', () => {
      const entity = state.createEntity();
      state.addComponent(entity, TestComponent);
      TestComponent.value[entity] = 10;

      const shakerId = createShaker(state, entity, 'test.value', { value: 5 });
      expect(Shaker.intensity[shakerId!]).toBe(1);
    });
  });
});
