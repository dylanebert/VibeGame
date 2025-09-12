import { beforeEach, describe, expect, it } from 'bun:test';
import { State, TIME_CONSTANTS } from 'vibegame';
import { Parent, Transform, TransformsPlugin, WorldTransform } from 'vibegame';

describe('Transform Hierarchy System', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
  });

  it('should copy local to world transforms for root entities', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      posX: 5.0,
      posY: 10.0,
      posZ: -3.0,
      eulerY: 90,
      scaleX: 2.0,
      scaleY: 1.5,
      scaleZ: 0.8,
    });

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(state.hasComponent(entity, WorldTransform)).toBe(true);
    expect(WorldTransform.posX[entity]).toBe(5.0);
    expect(WorldTransform.posY[entity]).toBe(10.0);
    expect(WorldTransform.posZ[entity]).toBe(-3.0);
    expect(WorldTransform.eulerY[entity]).toBeCloseTo(90, 1);
    expect(WorldTransform.scaleX[entity]).toBe(2.0);
    expect(WorldTransform.scaleY[entity]).toBe(1.5);
    expect(WorldTransform.scaleZ[entity]).toBeCloseTo(0.8, 5);
  });

  it('should process parent-child relationships', () => {
    const parentEntity = state.createEntity();
    const childEntity = state.createEntity();

    state.addComponent(parentEntity, Transform, {
      posX: 10,
      posY: 0,
      posZ: 0,
      scaleX: 2,
      scaleY: 2,
      scaleZ: 2,
    });

    state.addComponent(childEntity, Transform, {
      posX: 5,
      posY: 3,
      posZ: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      scaleZ: 0.5,
    });
    state.addComponent(childEntity, Parent);
    Parent.entity[childEntity] = parentEntity;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(state.hasComponent(parentEntity, WorldTransform)).toBe(true);
    expect(state.hasComponent(childEntity, WorldTransform)).toBe(true);

    expect(WorldTransform.posX[parentEntity]).toBe(10);
    expect(WorldTransform.posY[parentEntity]).toBe(0);
    expect(WorldTransform.posZ[parentEntity]).toBe(0);
    expect(WorldTransform.scaleX[parentEntity]).toBe(2);
    expect(WorldTransform.scaleY[parentEntity]).toBe(2);
    expect(WorldTransform.scaleZ[parentEntity]).toBe(2);

    expect(WorldTransform.posX[childEntity]).toBe(20);
    expect(WorldTransform.posY[childEntity]).toBe(6);
    expect(WorldTransform.posZ[childEntity]).toBe(0);
    expect(WorldTransform.scaleX[childEntity]).toBe(1);
    expect(WorldTransform.scaleY[childEntity]).toBe(1);
    expect(WorldTransform.scaleZ[childEntity]).toBe(1);
  });

  it('should handle multi-level hierarchies', () => {
    const grandparent = state.createEntity();
    const parent = state.createEntity();
    const child = state.createEntity();

    state.addComponent(grandparent, Transform, {
      posX: 10,
      posY: 0,
      posZ: 0,
      scaleX: 2,
      scaleY: 2,
      scaleZ: 2,
    });

    state.addComponent(parent, Transform, {
      posX: 5,
      posY: 0,
      posZ: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      scaleZ: 0.5,
    });
    state.addComponent(parent, Parent);
    Parent.entity[parent] = grandparent;

    state.addComponent(child, Transform, {
      posX: 2,
      posY: 1,
      posZ: 0,
      scaleX: 2,
      scaleY: 2,
      scaleZ: 2,
    });
    state.addComponent(child, Parent);
    Parent.entity[child] = parent;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(WorldTransform.posX[grandparent]).toBe(10);
    expect(WorldTransform.scaleX[grandparent]).toBe(2);

    expect(WorldTransform.posX[parent]).toBe(20);
    expect(WorldTransform.scaleX[parent]).toBe(1);

    expect(WorldTransform.posX[child]).toBe(22);
    expect(WorldTransform.posY[child]).toBe(1);
    expect(WorldTransform.scaleX[child]).toBe(2);
    expect(WorldTransform.scaleY[child]).toBe(2);
    expect(WorldTransform.scaleZ[child]).toBe(2);
  });

  it('should handle missing parent references gracefully', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      posX: 5,
      posY: 10,
      posZ: 15,
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });
    state.addComponent(entity, Parent);
    Parent.entity[entity] = 999;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(state.hasComponent(entity, WorldTransform)).toBe(true);
    // WorldTransform is created but not updated since parent doesn't exist
    expect(WorldTransform.posX[entity]).toBe(0);
    expect(WorldTransform.posY[entity]).toBe(0);
    expect(WorldTransform.posZ[entity]).toBe(0);
    expect(WorldTransform.scaleX[entity]).toBe(1);
    expect(WorldTransform.scaleY[entity]).toBe(1);
    expect(WorldTransform.scaleZ[entity]).toBe(1);
  });

  it('should maintain identity transforms', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      posX: 0,
      posY: 0,
      posZ: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(state.hasComponent(entity, WorldTransform)).toBe(true);
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

  it('should sync euler angles from quaternions', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      eulerX: 0,
      eulerY: 90,
      eulerZ: 0,
    });

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(Transform.rotX[entity]).toBeCloseTo(0, 5);
    expect(Transform.rotY[entity]).toBeCloseTo(0.7071, 3);
    expect(Transform.rotZ[entity]).toBeCloseTo(0, 5);
    expect(Transform.rotW[entity]).toBeCloseTo(0.7071, 3);

    expect(WorldTransform.eulerX[entity]).toBeCloseTo(0, 2);
    expect(WorldTransform.eulerY[entity]).toBeCloseTo(90, 2);
    expect(WorldTransform.eulerZ[entity]).toBeCloseTo(0, 2);
  });

  it('should handle rotation in parent-child hierarchy', () => {
    const parentEntity = state.createEntity();
    const childEntity = state.createEntity();

    state.addComponent(parentEntity, Transform, {
      posX: 0,
      posY: 3,
      posZ: 0,
      eulerX: 0,
      eulerY: 90,
      eulerZ: 0,
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });

    state.addComponent(childEntity, Transform, {
      posX: 10,
      posY: 0,
      posZ: 0,
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });
    state.addComponent(childEntity, Parent);
    Parent.entity[childEntity] = parentEntity;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(WorldTransform.posX[childEntity]).toBeCloseTo(0, 2);
    expect(WorldTransform.posY[childEntity]).toBe(3);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(-10, 2);
  });

  it('should automatically create WorldTransform for entities with Transform', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });

    expect(state.hasComponent(entity, WorldTransform)).toBe(false);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(state.hasComponent(entity, WorldTransform)).toBe(true);
    expect(WorldTransform.rotW[entity]).toBe(1);
    expect(WorldTransform.scaleX[entity]).toBe(1);
    expect(WorldTransform.scaleY[entity]).toBe(1);
    expect(WorldTransform.scaleZ[entity]).toBe(1);
  });

  it('should update world transforms when local transforms change', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      posX: 5,
      posY: 10,
      posZ: 15,
    });

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(WorldTransform.posX[entity]).toBe(5);
    expect(WorldTransform.posY[entity]).toBe(10);
    expect(WorldTransform.posZ[entity]).toBe(15);

    Transform.posX[entity] = 20;
    Transform.posY[entity] = 25;
    Transform.posZ[entity] = 30;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(WorldTransform.posX[entity]).toBe(20);
    expect(WorldTransform.posY[entity]).toBe(25);
    expect(WorldTransform.posZ[entity]).toBe(30);
  });
});
