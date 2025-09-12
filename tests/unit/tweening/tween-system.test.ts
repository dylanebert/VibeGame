import { beforeEach, describe, expect, it } from 'bun:test';
import { defineComponent, Types } from 'bitecs';
import { State, defineQuery } from 'vibegame';
import { createTween, Tween, TweenPlugin, TweenValue } from 'vibegame';

describe('Tween System', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TweenPlugin);
  });

  it('should update elapsed time', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Tween);

    Tween.duration[entity] = 2.0;
    Tween.elapsed[entity] = 0;
    Tween.loopMode[entity] = 0;

    state.step(0.5);
    expect(Tween.elapsed[entity]).toBe(0.5);

    state.step(0.5);
    expect(Tween.elapsed[entity]).toBe(1.0);
  });

  it('should destroy tweens after completion', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Tween);

    Tween.duration[entity] = 1.0;
    Tween.elapsed[entity] = 0;
    Tween.loopMode[entity] = 0;

    expect(state.hasComponent(entity, Tween)).toBe(true);

    state.step(1.1);

    expect(state.hasComponent(entity, Tween)).toBe(false);
  });

  it('should keep looping tweens alive', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Tween);

    Tween.duration[entity] = 1.0;
    Tween.elapsed[entity] = 0;
    Tween.loopMode[entity] = 1;

    state.step(2.5);

    expect(state.hasComponent(entity, Tween)).toBe(true);
    expect(Tween.elapsed[entity]).toBe(2.5);
  });

  it('should keep ping-pong tweens alive', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Tween);

    Tween.duration[entity] = 1.0;
    Tween.elapsed[entity] = 0;
    Tween.loopMode[entity] = 2;

    state.step(3.0);

    expect(state.hasComponent(entity, Tween)).toBe(true);
    expect(Tween.elapsed[entity]).toBe(3.0);
  });

  it('should interpolate values with linear easing', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);
    TestComponent.value[entity] = 0;

    const tweenEntity = createTween(state, entity, 'test.value', {
      from: 0,
      to: 100,
      duration: 1,
      easing: 'linear',
    });

    expect(tweenEntity).not.toBeNull();

    state.step(0.25);
    expect(TestComponent.value[entity]).toBeCloseTo(25, 1);

    state.step(0.25);
    expect(TestComponent.value[entity]).toBeCloseTo(50, 1);

    state.step(0.25);
    expect(TestComponent.value[entity]).toBeCloseTo(75, 1);

    state.step(0.25);
    expect(TestComponent.value[entity]).toBeCloseTo(100, 1);
  });

  it('should apply quad-out easing correctly', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);
    TestComponent.value[entity] = 0;

    createTween(state, entity, 'test.value', {
      from: 0,
      to: 100,
      duration: 1,
      easing: 'quad-out',
    });

    state.step(0.25);
    expect(TestComponent.value[entity]).toBeGreaterThan(35);
  });

  it('should handle ping-pong forward and reverse cycles', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);

    createTween(state, entity, 'test.value', {
      from: 0,
      to: 10,
      duration: 1,
      loop: 'ping-pong',
    });

    state.step(0.5);
    expect(TestComponent.value[entity]).toBeCloseTo(5, 1);

    state.step(0.5);
    expect(TestComponent.value[entity]).toBeCloseTo(10, 1);

    state.step(0.5);
    expect(TestComponent.value[entity]).toBeCloseTo(5, 1);

    state.step(0.5);
    expect(TestComponent.value[entity]).toBeCloseTo(0, 1);

    state.step(0.5);
    expect(TestComponent.value[entity]).toBeCloseTo(5, 1);
  });

  it('should clean up TweenValue entities when parent Tween is destroyed', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);

    createTween(state, entity, 'test.value', {
      from: 0,
      to: 100,
      duration: 1,
      loop: 'once',
    });

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(1);

    state.step(1.1);

    const remainingTweenValues = defineQuery([TweenValue])(state.world);
    expect(remainingTweenValues.length).toBe(0);
  });

  it('should handle loop mode cycling correctly', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);

    createTween(state, entity, 'test.value', {
      from: 0,
      to: 10,
      duration: 1,
      loop: 'loop',
    });

    state.step(0.5);
    expect(TestComponent.value[entity]).toBeCloseTo(5, 1);

    state.step(0.5);
    expect(TestComponent.value[entity]).toBeCloseTo(0, 1);

    state.step(0.25);
    expect(TestComponent.value[entity]).toBeCloseTo(2.5, 1);

    state.step(0.25);
    expect(TestComponent.value[entity]).toBeCloseTo(5, 1);

    state.step(0.5);
    expect(TestComponent.value[entity]).toBeCloseTo(0, 1);
  });
});
