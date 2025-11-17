import { beforeEach, describe, expect, it } from 'bun:test';
import { defineComponent, Types } from 'bitecs';
import { State, defineQuery } from 'vibegame';
import { Transform, TransformsPlugin } from 'vibegame/transforms';
import { createTween, Tween, TweenPlugin, TweenValue } from 'vibegame/tweening';

describe('Tween API', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(TweenPlugin);
  });

  it('should create tween with single property target', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);

    const tweenEntity = createTween(state, entity, 'test.value', {
      from: 0,
      to: 100,
      duration: 2,
    });

    expect(tweenEntity).not.toBeNull();
    expect(state.hasComponent(tweenEntity!, Tween)).toBe(true);
    expect(Tween.duration[tweenEntity!]).toBe(2);
  });

  it('should handle rotation shorthand target', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform);

    createTween(state, entity, 'rotation', {
      from: [0, 0, 0],
      to: [90, 180, 270],
      duration: 1,
    });

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(3);

    const expectedTos = [90, 180, 270];

    for (let i = 0; i < tweenValues.length; i++) {
      const valueEntity = tweenValues[i];
      expect(TweenValue.to[valueEntity]).toBe(expectedTos[i]);
    }
  });

  it('should handle at shorthand target', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform);

    createTween(state, entity, 'at', {
      from: [0, 5, 10],
      to: [10, 15, 20],
      duration: 1,
    });

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(3);

    const expectedTos = [10, 15, 20];
    for (let i = 0; i < tweenValues.length; i++) {
      expect(TweenValue.to[tweenValues[i]]).toBe(expectedTos[i]);
    }
  });

  it('should handle scale shorthand target', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform);

    createTween(state, entity, 'scale', {
      from: [1, 1, 1],
      to: [2, 2, 2],
      duration: 1,
    });

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(3);

    const expectedValues = [1, 1, 1];
    const expectedTos = [2, 2, 2];
    for (let i = 0; i < tweenValues.length; i++) {
      expect(TweenValue.from[tweenValues[i]]).toBe(expectedValues[i]);
      expect(TweenValue.to[tweenValues[i]]).toBe(expectedTos[i]);
    }
  });

  it('should return null for invalid target', () => {
    const entity = state.createEntity();

    const result = createTween(state, entity, 'invalid.field', {
      to: 100,
      duration: 1,
    });

    expect(result).toBeNull();
  });

  it('should use current value when from is omitted', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);
    TestComponent.value[entity] = 25;

    createTween(state, entity, 'test.value', {
      to: 75,
      duration: 1,
    });

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(1);
    expect(TweenValue.from[tweenValues[0]]).toBe(25);
  });

  it('should map easing function names correctly', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);

    const easingOptions = [
      'linear',
      'sine-in-out',
      'quad-out',
      'elastic-out',
      'bounce-in',
      'back-out',
    ];

    for (const easing of easingOptions) {
      const tweenEntity = createTween(state, entity, 'test.value', {
        from: 0,
        to: 100,
        duration: 1,
        easing,
      });

      expect(tweenEntity).not.toBeNull();
      expect(Tween.easingIndex[tweenEntity!]).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle numeric loop mode', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);

    const tweenEntity = createTween(state, entity, 'test.value', {
      from: 0,
      to: 100,
      duration: 1,
      loop: 2,
    });

    expect(tweenEntity).not.toBeNull();
    expect(Tween.loopMode[tweenEntity!]).toBe(2);
  });

  it('should handle string loop mode', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);

    const loopModes = [
      { name: 'once', value: 0 },
      { name: 'loop', value: 1 },
      { name: 'ping-pong', value: 2 },
    ];

    for (const mode of loopModes) {
      const tweenEntity = createTween(state, entity, 'test.value', {
        from: 0,
        to: 100,
        duration: 1,
        loop: mode.name,
      });

      expect(tweenEntity).not.toBeNull();
      expect(Tween.loopMode[tweenEntity!]).toBe(mode.value);
    }
  });

  it('should use default values when options are omitted', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);

    const tweenEntity = createTween(state, entity, 'test.value', {
      to: 100,
    });

    expect(tweenEntity).not.toBeNull();
    expect(Tween.duration[tweenEntity!]).toBe(1);
    expect(Tween.easingIndex[tweenEntity!]).toBe(0);
    expect(Tween.loopMode[tweenEntity!]).toBe(0);
  });

  it('should handle array values for single property', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);

    createTween(state, entity, 'test.value', {
      from: [10],
      to: [20],
      duration: 1,
    });

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(1);
    expect(TweenValue.from[tweenValues[0]]).toBe(10);
    expect(TweenValue.to[tweenValues[0]]).toBe(20);
  });

  it('should handle transform component fields with kebab-case', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform);

    const tweenEntity = createTween(state, entity, 'transform.pos-x', {
      from: 0,
      to: 10,
      duration: 1,
    });

    expect(tweenEntity).not.toBeNull();

    state.step(0.5);
    expect(Transform.posX[entity]).toBeCloseTo(5, 1);
  });
});
