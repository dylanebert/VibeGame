import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { State, TIME_CONSTANTS, defineQuery } from 'vibegame';
import {
  Body,
  BodyType,
  Collider,
  ColliderShape,
  initializePhysics,
  InterpolatedTransform,
  PhysicsPlugin,
  PhysicsWorld,
} from 'vibegame';
import { Transform, WorldTransform } from 'vibegame';

describe('Physics Interpolation', () => {
  let state: State;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    state = new State();
    state.registerPlugin(PhysicsPlugin);
  });

  it('should interpolate positions between fixed steps', () => {
    const box = state.createEntity();
    state.addComponent(box, Body);
    state.addComponent(box, Collider);
    state.addComponent(box, Transform);
    state.addComponent(box, WorldTransform);
    state.addComponent(box, InterpolatedTransform);

    Transform.scaleX[box] = 1;
    Transform.scaleY[box] = 1;
    Transform.scaleZ[box] = 1;

    Body.type[box] = BodyType.Dynamic;
    Body.posX[box] = 0;
    Body.posY[box] = 10;
    Body.posZ[box] = 0;
    Body.rotW[box] = 1;
    Body.mass[box] = 1;
    Body.gravityScale[box] = 1;
    Body.velX[box] = 5;

    Collider.shape[box] = ColliderShape.Box;
    Collider.sizeX[box] = 1;
    Collider.sizeY[box] = 1;
    Collider.sizeZ[box] = 1;
    Collider.density[box] = 1;

    const worldEntities = defineQuery([PhysicsWorld])(state.world);
    if (worldEntities.length > 0) {
      PhysicsWorld.gravityY[worldEntities[0]] = -9.81;
    }

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const prevPosX = InterpolatedTransform.prevPosX[box];
    const currPosX = InterpolatedTransform.posX[box];

    expect(prevPosX).toBeDefined();
    expect(currPosX).toBeDefined();
    expect(currPosX).toBeGreaterThan(prevPosX);

    // Step by a small amount to test interpolation
    // This won't trigger a physics step but will interpolate
    state.step(TIME_CONSTANTS.FIXED_TIMESTEP * 0.25);

    const worldPosX = WorldTransform.posX[box];

    // Position should be between prev and curr (interpolated)
    expect(worldPosX).toBeGreaterThanOrEqual(prevPosX);
    expect(worldPosX).toBeLessThanOrEqual(currPosX);
  });

  it('should interpolate rotations using slerp', () => {
    const box = state.createEntity();
    state.addComponent(box, Body);
    state.addComponent(box, Collider);
    state.addComponent(box, Transform);
    state.addComponent(box, WorldTransform);
    state.addComponent(box, InterpolatedTransform);

    Transform.scaleX[box] = 1;
    Transform.scaleY[box] = 1;
    Transform.scaleZ[box] = 1;

    Body.type[box] = BodyType.Dynamic;
    Body.posX[box] = 0;
    Body.posY[box] = 5;
    Body.posZ[box] = 0;
    Body.rotX[box] = 0;
    Body.rotY[box] = 0;
    Body.rotZ[box] = 0;
    Body.rotW[box] = 1;
    Body.mass[box] = 1;
    Body.gravityScale[box] = 0;
    Body.rotVelY[box] = 2;

    Collider.shape[box] = ColliderShape.Box;
    Collider.sizeX[box] = 1;
    Collider.sizeY[box] = 1;
    Collider.sizeZ[box] = 1;
    Collider.density[box] = 1;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const prevRotY = InterpolatedTransform.prevRotY[box];
    const currRotY = InterpolatedTransform.rotY[box];

    expect(prevRotY).toBeDefined();
    expect(currRotY).toBeDefined();
    expect(Math.abs(currRotY - prevRotY)).toBeGreaterThan(0.01);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP / 2);

    const worldRotY = WorldTransform.rotY[box];

    expect(worldRotY).toBeDefined();
    expect(Math.abs(worldRotY)).toBeGreaterThan(0);
    expect(Math.abs(worldRotY)).toBeLessThan(Math.abs(currRotY) + 0.1);
  });

  it('should handle multiple entities with different interpolation states', () => {
    const entities: number[] = [];

    for (let i = 0; i < 5; i++) {
      const entity = state.createEntity();
      state.addComponent(entity, Body);
      state.addComponent(entity, Collider);
      state.addComponent(entity, Transform);
      state.addComponent(entity, WorldTransform);
      state.addComponent(entity, InterpolatedTransform);

      Body.type[entity] = BodyType.Dynamic;
      Body.posX[entity] = i * 2;
      Body.posY[entity] = 5;
      Body.posZ[entity] = 0;
      Body.rotW[entity] = 1;
      Body.mass[entity] = 1;
      Body.gravityScale[entity] = 0;
      Body.velX[entity] = (i + 1) * 2;

      Collider.shape[entity] = ColliderShape.Box;
      Collider.sizeX[entity] = 1;
      Collider.sizeY[entity] = 1;
      Collider.sizeZ[entity] = 1;
      Collider.density[entity] = 1;

      entities.push(entity);
    }

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const prevPosX = InterpolatedTransform.prevPosX[entity];
      const currPosX = InterpolatedTransform.posX[entity];

      expect(currPosX - prevPosX).toBeCloseTo(
        (i + 1) * 2 * TIME_CONSTANTS.FIXED_TIMESTEP,
        1
      );
    }

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP / 4);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const prevPosX = InterpolatedTransform.prevPosX[entity];
      const currPosX = InterpolatedTransform.posX[entity];
      const worldPosX = WorldTransform.posX[entity];

      const expectedX = prevPosX + (currPosX - prevPosX) * 0.25;
      expect(worldPosX).toBeCloseTo(expectedX, 0);
    }
  });

  it('should reset interpolation when teleporting', () => {
    const box = state.createEntity();
    state.addComponent(box, Body);
    state.addComponent(box, Collider);
    state.addComponent(box, Transform);
    state.addComponent(box, WorldTransform);
    state.addComponent(box, InterpolatedTransform);

    Transform.scaleX[box] = 1;
    Transform.scaleY[box] = 1;
    Transform.scaleZ[box] = 1;

    Body.type[box] = BodyType.Dynamic;
    Body.posX[box] = 0;
    Body.posY[box] = 5;
    Body.posZ[box] = 0;
    Body.rotW[box] = 1;
    Body.mass[box] = 1;
    Body.gravityScale[box] = 0;
    Body.velX[box] = 10;

    Collider.shape[box] = ColliderShape.Box;
    Collider.sizeX[box] = 1;
    Collider.sizeY[box] = 1;
    Collider.sizeZ[box] = 1;
    Collider.density[box] = 1;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const posAfterStep = Body.posX[box];
    expect(posAfterStep).toBeGreaterThan(0);

    Body.posX[box] = 100;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(InterpolatedTransform.prevPosX[box]).toBeCloseTo(100, 1);
    expect(InterpolatedTransform.posX[box]).toBeGreaterThan(100);
    expect(WorldTransform.posX[box]).toBeGreaterThan(100);
  });

  it('should handle static bodies without interpolation artifacts', () => {
    const floor = state.createEntity();
    state.addComponent(floor, Body);
    state.addComponent(floor, Collider);
    state.addComponent(floor, Transform);
    state.addComponent(floor, WorldTransform);
    state.addComponent(floor, InterpolatedTransform);

    Body.type[floor] = BodyType.Fixed;
    Body.posX[floor] = 0;
    Body.posY[floor] = 0;
    Body.posZ[floor] = 0;
    Body.rotW[floor] = 1;

    Collider.shape[floor] = ColliderShape.Box;
    Collider.sizeX[floor] = 100;
    Collider.sizeY[floor] = 1;
    Collider.sizeZ[floor] = 100;

    const initialX = Body.posX[floor];

    for (let i = 0; i < 10; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(InterpolatedTransform.posX[floor]).toBe(initialX);
    expect(InterpolatedTransform.prevPosX[floor]).toBe(initialX);
    expect(WorldTransform.posX[floor]).toBe(initialX);
  });
});
