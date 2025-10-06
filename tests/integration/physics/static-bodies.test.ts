import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { State, TIME_CONSTANTS, defineQuery } from 'vibegame';
import {
  Body,
  BodyType,
  Collider,
  ColliderShape,
  initializePhysics,
  PhysicsPlugin,
  PhysicsWorld,
} from 'vibegame';
import { Transform } from 'vibegame';

describe('Static Bodies Integration', () => {
  let state: State;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    state = new State();
    state.registerPlugin(PhysicsPlugin);
  });

  it('should create a static floor that does not move', () => {
    const floor = state.createEntity();
    state.addComponent(floor, Body);
    state.addComponent(floor, Collider);
    state.addComponent(floor, Transform);

    Transform.scaleX[floor] = 1;
    Transform.scaleY[floor] = 1;
    Transform.scaleZ[floor] = 1;

    Body.type[floor] = BodyType.Fixed;
    Body.posX[floor] = 0;
    Body.posY[floor] = -10;
    Body.posZ[floor] = 0;
    Body.rotW[floor] = 1;

    Collider.shape[floor] = ColliderShape.Box;
    Collider.sizeX[floor] = 100;
    Collider.sizeY[floor] = 1;
    Collider.sizeZ[floor] = 100;

    const initialY = Body.posY[floor];

    for (let i = 0; i < 10; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posY[floor]).toBe(initialY);
    expect(Body.posX[floor]).toBe(0);
    expect(Body.posZ[floor]).toBe(0);
  });

  it('should support dynamic bodies falling onto static bodies', () => {
    const floor = state.createEntity();
    state.addComponent(floor, Body);
    state.addComponent(floor, Collider);
    state.addComponent(floor, Transform);

    Transform.scaleX[floor] = 1;
    Transform.scaleY[floor] = 1;
    Transform.scaleZ[floor] = 1;

    Body.type[floor] = BodyType.Fixed;
    Body.posY[floor] = 0;
    Body.rotW[floor] = 1;

    Collider.shape[floor] = ColliderShape.Box;
    Collider.sizeX[floor] = 100;
    Collider.sizeY[floor] = 1;
    Collider.sizeZ[floor] = 100;

    const box = state.createEntity();
    state.addComponent(box, Body);
    state.addComponent(box, Collider);
    state.addComponent(box, Transform);

    Transform.scaleX[box] = 1;
    Transform.scaleY[box] = 1;
    Transform.scaleZ[box] = 1;

    Body.type[box] = BodyType.Dynamic;
    Body.posY[box] = 10;
    Body.rotW[box] = 1;
    Body.mass[box] = 1;
    Body.gravityScale[box] = 1;

    Collider.shape[box] = ColliderShape.Box;
    Collider.sizeX[box] = 1;
    Collider.sizeY[box] = 1;
    Collider.sizeZ[box] = 1;
    Collider.density[box] = 1;

    const worldEntities = defineQuery([PhysicsWorld])(state.world);
    if (worldEntities.length > 0) {
      PhysicsWorld.gravityY[worldEntities[0]] = -9.81;
    }

    const initialBoxY = Body.posY[box];

    for (let i = 0; i < 60; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posY[box]).toBeLessThan(initialBoxY);
    expect(Body.posY[box]).toBeGreaterThan(0);
    expect(Body.posY[floor]).toBe(0);
  });

  it('should handle multiple static bodies', () => {
    const staticBodies: number[] = [];

    for (let i = 0; i < 5; i++) {
      const wall = state.createEntity();
      state.addComponent(wall, Body);
      state.addComponent(wall, Collider);
      state.addComponent(wall, Transform);

      Transform.scaleX[wall] = 1;
      Transform.scaleY[wall] = 1;
      Transform.scaleZ[wall] = 1;

      Body.type[wall] = BodyType.Fixed;
      Body.posX[wall] = i * 10;
      Body.posY[wall] = 0;
      Body.posZ[wall] = 0;
      Body.rotW[wall] = 1;

      Collider.shape[wall] = ColliderShape.Box;
      Collider.sizeX[wall] = 2;
      Collider.sizeY[wall] = 10;
      Collider.sizeZ[wall] = 2;

      staticBodies.push(wall);
    }

    for (let i = 0; i < 10; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    for (let i = 0; i < staticBodies.length; i++) {
      const wall = staticBodies[i];
      expect(Body.posX[wall]).toBe(i * 10);
      expect(Body.posY[wall]).toBe(0);
      expect(Body.posZ[wall]).toBe(0);
    }
  });

  it('should not be affected by gravity', () => {
    const staticBox = state.createEntity();
    state.addComponent(staticBox, Body);
    state.addComponent(staticBox, Collider);
    state.addComponent(staticBox, Transform);

    Transform.scaleX[staticBox] = 1;
    Transform.scaleY[staticBox] = 1;
    Transform.scaleZ[staticBox] = 1;

    Body.type[staticBox] = BodyType.Fixed;
    Body.posY[staticBox] = 10;
    Body.rotW[staticBox] = 1;
    Body.gravityScale[staticBox] = 1;

    Collider.shape[staticBox] = ColliderShape.Box;
    Collider.sizeX[staticBox] = 2;
    Collider.sizeY[staticBox] = 2;
    Collider.sizeZ[staticBox] = 2;

    const worldEntities = defineQuery([PhysicsWorld])(state.world);
    if (worldEntities.length > 0) {
      PhysicsWorld.gravityY[worldEntities[0]] = -9.81;
    }

    for (let i = 0; i < 60; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posY[staticBox]).toBe(10);
  });
});
