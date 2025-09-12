import { beforeEach, describe, expect, it } from 'bun:test';
import { defineComponent, Types } from 'bitecs';
import { createTween, State, defineQuery } from 'vibegame';
import { Tween, TweenPlugin, TweenValue } from 'vibegame';

describe('Tween Components', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TweenPlugin);
  });

  it('should register tween components', () => {
    const entity = state.createEntity();

    state.addComponent(entity, Tween);
    expect(state.hasComponent(entity, Tween)).toBe(true);

    state.addComponent(entity, TweenValue);
    expect(state.hasComponent(entity, TweenValue)).toBe(true);
  });

  it('should establish source-target relationships', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const targetEntity = state.createEntity();
    state.addComponent(targetEntity, TestComponent);

    const tweenEntity = createTween(state, targetEntity, 'test.value', {
      from: 0,
      to: 100,
      duration: 1,
    });

    expect(tweenEntity).not.toBeNull();

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(1);

    const valueEntity = tweenValues[0];
    expect(TweenValue.source[valueEntity]).toBe(tweenEntity!);
    expect(TweenValue.target[valueEntity]).toBe(targetEntity);
  });

  it('should track multiple TweenValues for same Tween source', () => {
    const TestComponent = defineComponent({
      x: Types.f32,
      y: Types.f32,
      z: Types.f32,
    });
    state.registerComponent('test', TestComponent);

    const targetEntity = state.createEntity();
    state.addComponent(targetEntity, TestComponent);

    const tweenEntity1 = createTween(state, targetEntity, 'test.x', {
      from: 0,
      to: 10,
      duration: 1,
    });

    const tweenEntity2 = createTween(state, targetEntity, 'test.y', {
      from: 0,
      to: 20,
      duration: 1,
    });

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(2);

    const valuesForTween1 = tweenValues.filter(
      (v) => TweenValue.source[v] === tweenEntity1
    );
    const valuesForTween2 = tweenValues.filter(
      (v) => TweenValue.source[v] === tweenEntity2
    );

    expect(valuesForTween1.length).toBe(1);
    expect(valuesForTween2.length).toBe(1);
  });

  it('should properly initialize from and to values', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);

    const targetEntity = state.createEntity();
    state.addComponent(targetEntity, TestComponent);
    TestComponent.value[targetEntity] = 50;

    createTween(state, targetEntity, 'test.value', {
      to: 200,
      duration: 1,
    });

    const tweenValues = defineQuery([TweenValue])(state.world);
    const valueEntity = tweenValues[0];

    expect(TweenValue.from[valueEntity]).toBe(50);
    expect(TweenValue.to[valueEntity]).toBe(200);
    expect(TweenValue.value[valueEntity]).toBe(50);
  });
});
