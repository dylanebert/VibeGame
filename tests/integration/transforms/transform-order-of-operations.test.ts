import { defineComponent, Types } from 'bitecs';
import { beforeEach, describe, expect, it } from 'bun:test';
import { State, TIME_CONSTANTS, defineQuery } from 'vibegame';
import { Parent, Transform, TransformsPlugin, WorldTransform } from 'vibegame';

describe('Transform Order of Operations', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
  });

  it('should process physics -> hierarchy -> rendering in correct order', () => {
    const executionOrder: string[] = [];

    state.registerSystem({
      group: 'fixed',
      update(_state) {
        executionOrder.push('physics');
        for (const entity of defineQuery([Transform])(state.world)) {
          Transform.posX[entity] = 5.0;
        }
      },
    });

    state.registerSystem({
      group: 'simulation',
      last: true,
      update(_state) {
        executionOrder.push('hierarchy');
        for (const entity of defineQuery([WorldTransform])(state.world)) {
          if (!state.hasComponent(entity, Parent)) {
            WorldTransform.posX[entity] = Transform.posX[entity];
            WorldTransform.posY[entity] = Transform.posY[entity];
            WorldTransform.posZ[entity] = Transform.posZ[entity];
          }
        }

        for (const entity of defineQuery([Parent])(state.world)) {
          const parentId = Parent.entity[entity];
          if (state.hasComponent(parentId, Transform)) {
            WorldTransform.posX[entity] =
              WorldTransform.posX[parentId] + Transform.posX[entity];
            WorldTransform.posY[entity] =
              WorldTransform.posY[parentId] + Transform.posY[entity];
            WorldTransform.posZ[entity] =
              WorldTransform.posZ[parentId] + Transform.posZ[entity];
          }
        }
      },
    });

    state.registerSystem({
      group: 'draw',
      update(_state) {
        executionOrder.push('rendering');
        for (const entity of defineQuery([WorldTransform])(state.world)) {
          void WorldTransform.posX[entity];
        }
      },
    });

    const entity = state.createEntity();
    state.addComponent(entity, Transform);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(executionOrder).toEqual(['physics', 'hierarchy', 'rendering']);
    expect(Transform.posX[entity]).toBe(5.0);
    expect(state.hasComponent(entity, WorldTransform)).toBe(true);
    expect(WorldTransform.posX[entity]).toBe(5.0);
  });

  it('should support oscillation pattern from example', () => {
    const Oscillate = defineComponent({
      amplitude: Types.f32,
      frequency: Types.f32,
      axis: Types.i32,
      phase: Types.f32,
      time: Types.f32,
      startX: Types.f32,
      startY: Types.f32,
      startZ: Types.f32,
    });

    state.registerSystem({
      group: 'setup',
      update(_state) {
        for (const entity of defineQuery([Oscillate])(state.world)) {
          if (
            Oscillate.startX[entity] === 0 &&
            Oscillate.startY[entity] === 0 &&
            Oscillate.startZ[entity] === 0
          ) {
            Oscillate.startX[entity] = Transform.posX[entity];
            Oscillate.startY[entity] = Transform.posY[entity];
            Oscillate.startZ[entity] = Transform.posZ[entity];
          }
        }
      },
    });

    state.registerSystem({
      group: 'simulation',
      update(_state) {
        const deltaTime = _state.time.deltaTime;
        for (const entity of defineQuery([Oscillate])(state.world)) {
          const newTime = Oscillate.time[entity] + deltaTime;
          const offset =
            Oscillate.amplitude[entity] *
            Math.sin(
              2 * Math.PI * Oscillate.frequency[entity] * newTime +
                Oscillate.phase[entity]
            );

          Oscillate.time[entity] = newTime;

          const axis = Oscillate.axis[entity];
          if (axis === 0) {
            Transform.posX[entity] = Oscillate.startX[entity] + offset;
          } else if (axis === 1) {
            Transform.posY[entity] = Oscillate.startY[entity] + offset;
          } else if (axis === 2) {
            Transform.posZ[entity] = Oscillate.startZ[entity] + offset;
          }
        }
      },
    });

    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      posX: 0,
      posY: 10,
      posZ: 0,
    });
    state.addComponent(entity, Oscillate);
    Oscillate.amplitude[entity] = 5;
    Oscillate.frequency[entity] = 1;
    Oscillate.axis[entity] = 1;
    Oscillate.phase[entity] = 0;
    Oscillate.time[entity] = 0;

    state.step(0);
    expect(Oscillate.startY[entity]).toBe(10);

    state.step(0.25);
    expect(Oscillate.time[entity]).toBeCloseTo(0.25, 5);
    expect(Transform.posY[entity]).toBeCloseTo(15, 2);

    state.step(0.25);
    expect(Oscillate.time[entity]).toBeCloseTo(0.5, 5);
    expect(Transform.posY[entity]).toBeCloseTo(10, 2);

    state.step(0.25);
    expect(Oscillate.time[entity]).toBeCloseTo(0.75, 5);
    expect(Transform.posY[entity]).toBeCloseTo(5, 2);

    state.step(0.25);
    expect(Oscillate.time[entity]).toBeCloseTo(1, 5);
    expect(Transform.posY[entity]).toBeCloseTo(10, 1);
  });

  it('should support declarative position initialization', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      posX: 0,
      posY: 3,
      posZ: 0,
    });

    expect(Transform.posX[entity]).toBe(0);
    expect(Transform.posY[entity]).toBe(3);
    expect(Transform.posZ[entity]).toBe(0);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(state.hasComponent(entity, WorldTransform)).toBe(true);
    expect(WorldTransform.posX[entity]).toBe(0);
    expect(WorldTransform.posY[entity]).toBe(3);
    expect(WorldTransform.posZ[entity]).toBe(0);
  });

  it('should handle player-weapon hierarchy', () => {
    const playerEntity = state.createEntity();
    state.addComponent(playerEntity, Transform, {
      posX: 0,
      posY: 3,
      posZ: 0,
      eulerX: 0,
      eulerY: 45,
      eulerZ: 0,
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });

    const weaponEntity = state.createEntity();
    state.addComponent(weaponEntity, Transform, {
      posX: 1,
      posY: 0,
      posZ: 0,
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });
    state.addComponent(weaponEntity, Parent);
    Parent.entity[weaponEntity] = playerEntity;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(state.hasComponent(playerEntity, WorldTransform)).toBe(true);
    expect(state.hasComponent(weaponEntity, WorldTransform)).toBe(true);

    expect(WorldTransform.posX[playerEntity]).toBe(0);
    expect(WorldTransform.posY[playerEntity]).toBe(3);
    expect(WorldTransform.posZ[playerEntity]).toBe(0);
    expect(WorldTransform.eulerY[playerEntity]).toBeCloseTo(45, 2);

    expect(WorldTransform.posX[weaponEntity]).toBeCloseTo(0.707, 2);
    expect(WorldTransform.posY[weaponEntity]).toBe(3);
    expect(WorldTransform.posZ[weaponEntity]).toBeCloseTo(-0.707, 2);
  });

  it('should handle transform updates through the frame', () => {
    const entity = state.createEntity();
    const childEntity = state.createEntity();

    state.addComponent(entity, Transform, {
      posX: 10,
      posY: 0,
      posZ: 0,
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });

    state.addComponent(childEntity, Transform, {
      posX: 5,
      posY: 0,
      posZ: 0,
      rotW: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });
    state.addComponent(childEntity, Parent);
    Parent.entity[childEntity] = entity;

    state.registerSystem({
      group: 'fixed',
      update(_state) {
        Transform.posX[entity] += 1;
      },
    });

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    expect(WorldTransform.posX[entity]).toBe(11);
    expect(WorldTransform.posX[childEntity]).toBe(16);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    expect(WorldTransform.posX[entity]).toBe(12);
    expect(WorldTransform.posX[childEntity]).toBe(17);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    expect(WorldTransform.posX[entity]).toBe(13);
    expect(WorldTransform.posX[childEntity]).toBe(18);
  });

  it('should process systems in the correct batch order', () => {
    const executionOrder: string[] = [];

    state.registerSystem({
      group: 'setup',
      update(_state) {
        executionOrder.push('setup');
      },
    });

    state.registerSystem({
      group: 'fixed',
      update(_state) {
        executionOrder.push('fixed');
      },
    });

    state.registerSystem({
      group: 'simulation',
      first: true,
      update(_state) {
        executionOrder.push('simulation-early');
      },
    });

    state.registerSystem({
      group: 'simulation',
      update(_state) {
        executionOrder.push('simulation');
      },
    });

    state.registerSystem({
      group: 'draw',
      update(_state) {
        executionOrder.push('draw');
      },
    });

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(executionOrder).toEqual([
      'setup',
      'fixed',
      'simulation-early',
      'simulation',
      'draw',
    ]);
  });

  it('should maintain transform consistency across update cycles', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Transform, {
      posX: 5,
      posY: 10,
      posZ: 15,
      eulerX: 30,
      eulerY: 60,
      eulerZ: 90,
      scaleX: 2,
      scaleY: 3,
      scaleZ: 4,
    });

    for (let i = 0; i < 10; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(WorldTransform.posX[entity]).toBe(5);
      expect(WorldTransform.posY[entity]).toBe(10);
      expect(WorldTransform.posZ[entity]).toBe(15);
      expect(WorldTransform.eulerX[entity]).toBeCloseTo(30, 1);
      expect(WorldTransform.eulerY[entity]).toBeCloseTo(60, 1);
      expect(WorldTransform.eulerZ[entity]).toBeCloseTo(90, 1);
      expect(WorldTransform.scaleX[entity]).toBe(2);
      expect(WorldTransform.scaleY[entity]).toBe(3);
      expect(WorldTransform.scaleZ[entity]).toBe(4);
    }
  });
});
