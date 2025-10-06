import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import { Parent, TransformsPlugin } from 'vibegame';
import { Transform, WorldTransform } from 'vibegame';

describe('Transform Components', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
  });

  it('should create transform components with proper field access', () => {
    const entity = state.createEntity();
    state.addComponent(entity, WorldTransform);
    state.addComponent(entity, Transform);

    WorldTransform.posX[entity] = 5.5;
    WorldTransform.posY[entity] = -2.3;
    WorldTransform.posZ[entity] = 10.0;
    WorldTransform.rotX[entity] = 0.707;
    WorldTransform.rotY[entity] = 0;
    WorldTransform.rotZ[entity] = 0;
    WorldTransform.rotW[entity] = 0.707;
    WorldTransform.scaleX[entity] = 2.0;
    WorldTransform.scaleY[entity] = 0.5;
    WorldTransform.scaleZ[entity] = 1.5;

    Transform.posX[entity] = 10.5;
    Transform.posY[entity] = -5.2;
    Transform.posZ[entity] = 15.7;
    Transform.rotX[entity] = 0.5;
    Transform.rotY[entity] = 0;
    Transform.rotZ[entity] = 0;
    Transform.rotW[entity] = 0.866;
    Transform.scaleX[entity] = 3.0;
    Transform.scaleY[entity] = 1.0;
    Transform.scaleZ[entity] = 2.5;

    expect(WorldTransform.posX[entity]).toBe(5.5);
    expect(WorldTransform.posY[entity]).toBeCloseTo(-2.3);
    expect(WorldTransform.posZ[entity]).toBe(10.0);
    expect(WorldTransform.rotX[entity]).toBeCloseTo(0.707);
    expect(WorldTransform.rotW[entity]).toBeCloseTo(0.707);
    expect(WorldTransform.scaleX[entity]).toBe(2.0);

    expect(Transform.posX[entity]).toBe(10.5);
    expect(Transform.posY[entity]).toBeCloseTo(-5.2);
    expect(Transform.posZ[entity]).toBeCloseTo(15.7);
    expect(Transform.rotX[entity]).toBe(0.5);
    expect(Transform.rotW[entity]).toBeCloseTo(0.866);
    expect(Transform.scaleX[entity]).toBe(3.0);
  });

  it('should initialize Transform with default values', () => {
    state.registerPlugin(TransformsPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Transform);

    expect(Transform.posX[entity]).toBe(0);
    expect(Transform.posY[entity]).toBe(0);
    expect(Transform.posZ[entity]).toBe(0);
    expect(Transform.rotX[entity]).toBe(0);
    expect(Transform.rotY[entity]).toBe(0);
    expect(Transform.rotZ[entity]).toBe(0);
    expect(Transform.rotW[entity]).toBe(1);
    expect(Transform.eulerX[entity]).toBe(0);
    expect(Transform.eulerY[entity]).toBe(0);
    expect(Transform.eulerZ[entity]).toBe(0);
    expect(Transform.scaleX[entity]).toBe(1);
    expect(Transform.scaleY[entity]).toBe(1);
    expect(Transform.scaleZ[entity]).toBe(1);
  });

  it('should apply default values when adding component with partial data', () => {
    state.registerPlugin(TransformsPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      posX: 10,
      posY: 20,
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });

    expect(Transform.posX[entity]).toBe(10);
    expect(Transform.posY[entity]).toBe(20);
    expect(Transform.posZ[entity]).toBe(0);
    expect(Transform.rotW[entity]).toBe(1);
    expect(Transform.scaleX[entity]).toBe(1);
    expect(Transform.scaleY[entity]).toBe(1);
    expect(Transform.scaleZ[entity]).toBe(1);
  });

  it('should initialize WorldTransform with default values', () => {
    state.registerPlugin(TransformsPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, WorldTransform);

    expect(WorldTransform.posX[entity]).toBe(0);
    expect(WorldTransform.posY[entity]).toBe(0);
    expect(WorldTransform.posZ[entity]).toBe(0);
    expect(WorldTransform.rotX[entity]).toBe(0);
    expect(WorldTransform.rotY[entity]).toBe(0);
    expect(WorldTransform.rotZ[entity]).toBe(0);
    expect(WorldTransform.rotW[entity]).toBe(1);
    expect(WorldTransform.scaleX[entity]).toBe(1);
    expect(WorldTransform.scaleY[entity]).toBe(1);
    expect(WorldTransform.scaleZ[entity]).toBe(1);
  });

  it('should create Parent component for hierarchy', () => {
    const entity = state.createEntity();
    const parentEntity = state.createEntity();

    state.addComponent(entity, Parent);
    Parent.entity[entity] = parentEntity;

    expect(Parent.entity[entity]).toBe(parentEntity);
    expect(state.hasComponent(entity, Parent)).toBe(true);

    Parent.entity[entity] = 200;
    expect(Parent.entity[entity]).toBe(200);
  });

  it('should handle Transform component with all custom values', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform);

    Transform.posX[entity] = -10;
    Transform.posY[entity] = 0;
    Transform.posZ[entity] = 15;
    Transform.rotX[entity] = 0.1;
    Transform.rotY[entity] = 0.2;
    Transform.rotZ[entity] = 0.3;
    Transform.rotW[entity] = 0.9;
    Transform.eulerX[entity] = 10;
    Transform.eulerY[entity] = 20;
    Transform.eulerZ[entity] = 30;
    Transform.scaleX[entity] = 0.5;
    Transform.scaleY[entity] = 2;
    Transform.scaleZ[entity] = 1;

    expect(Transform.posX[entity]).toBe(-10);
    expect(Transform.posY[entity]).toBe(0);
    expect(Transform.posZ[entity]).toBe(15);
    expect(Transform.rotX[entity]).toBeCloseTo(0.1, 5);
    expect(Transform.rotY[entity]).toBeCloseTo(0.2, 5);
    expect(Transform.rotZ[entity]).toBeCloseTo(0.3, 5);
    expect(Transform.rotW[entity]).toBeCloseTo(0.9, 5);
    expect(Transform.eulerX[entity]).toBe(10);
    expect(Transform.eulerY[entity]).toBe(20);
    expect(Transform.eulerZ[entity]).toBe(30);
    expect(Transform.scaleX[entity]).toBe(0.5);
    expect(Transform.scaleY[entity]).toBe(2);
    expect(Transform.scaleZ[entity]).toBe(1);
  });

  it('should handle edge case values', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform);

    Transform.posX[entity] = Number.MAX_SAFE_INTEGER;
    Transform.posY[entity] = Number.MIN_SAFE_INTEGER;
    Transform.posZ[entity] = 0;
    Transform.scaleX[entity] = 0;
    Transform.scaleY[entity] = -1;
    Transform.scaleZ[entity] = 1000;

    expect(Transform.posX[entity]).toBeCloseTo(Number.MAX_SAFE_INTEGER, -6);
    expect(Transform.posY[entity]).toBeCloseTo(Number.MIN_SAFE_INTEGER, -6);
    expect(Transform.posZ[entity]).toBe(0);
    expect(Transform.scaleX[entity]).toBe(0);
    expect(Transform.scaleY[entity]).toBe(-1);
    expect(Transform.scaleZ[entity]).toBe(1000);
  });
});
