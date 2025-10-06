import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { State, TIME_CONSTANTS, defineQuery } from 'vibegame';
import {
  ApplyForce,
  ApplyImpulse,
  Body,
  BodyType,
  Collider,
  ColliderShape,
  PhysicsPlugin,
  PhysicsWorld,
  SetLinearVelocity,
  initializePhysics,
} from 'vibegame';
import { Transform } from 'vibegame';

describe('Dynamic Bodies Integration', () => {
  let state: State;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    state = new State();
    state.registerPlugin(PhysicsPlugin);
  });

  it('should fall under gravity', () => {
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

    const initialY = Body.posY[box];

    for (let i = 0; i < 30; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posY[box]).toBeLessThan(initialY);
    expect(Body.velY[box]).toBeLessThan(0);
  });

  it('should respond to applied forces', () => {
    const box = state.createEntity();
    state.addComponent(box, Body);
    state.addComponent(box, Collider);
    state.addComponent(box, Transform);

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

    Collider.shape[box] = ColliderShape.Box;
    Collider.sizeX[box] = 1;
    Collider.sizeY[box] = 1;
    Collider.sizeZ[box] = 1;
    Collider.density[box] = 1;

    state.addComponent(box, ApplyForce);
    ApplyForce.x[box] = 10;
    ApplyForce.y[box] = 0;
    ApplyForce.z[box] = 0;

    for (let i = 0; i < 30; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posX[box]).toBeGreaterThan(0);
    expect(Body.velX[box]).toBeGreaterThan(0);
  });

  it('should respond to impulses', () => {
    const box = state.createEntity();
    state.addComponent(box, Body);
    state.addComponent(box, Collider);
    state.addComponent(box, Transform);

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

    Collider.shape[box] = ColliderShape.Box;
    Collider.sizeX[box] = 1;
    Collider.sizeY[box] = 1;
    Collider.sizeZ[box] = 1;
    Collider.density[box] = 1;

    state.addComponent(box, ApplyImpulse);
    ApplyImpulse.x[box] = 5;
    ApplyImpulse.y[box] = 10;
    ApplyImpulse.z[box] = 0;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    state.removeComponent(box, ApplyImpulse);

    expect(Body.velX[box]).toBeGreaterThan(0);
    expect(Body.velY[box]).toBeGreaterThan(0);

    for (let i = 0; i < 30; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posX[box]).toBeGreaterThan(0);
    expect(Body.posY[box]).toBeGreaterThan(5);
  });

  it('should handle velocity changes', () => {
    const box = state.createEntity();
    state.addComponent(box, Body);
    state.addComponent(box, Collider);
    state.addComponent(box, Transform);

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

    Collider.shape[box] = ColliderShape.Box;
    Collider.sizeX[box] = 1;
    Collider.sizeY[box] = 1;
    Collider.sizeZ[box] = 1;
    Collider.density[box] = 1;

    state.addComponent(box, SetLinearVelocity);
    SetLinearVelocity.x[box] = 5;
    SetLinearVelocity.y[box] = 0;
    SetLinearVelocity.z[box] = 0;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(Body.velX[box]).toBe(5);
    expect(Body.velY[box]).toBe(0);
    expect(Body.velZ[box]).toBe(0);

    state.removeComponent(box, SetLinearVelocity);

    for (let i = 0; i < 30; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posX[box]).toBeGreaterThan(0);
  });

  it('should bounce with restitution', () => {
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
    Collider.restitution[floor] = 0.8;

    const ball = state.createEntity();
    state.addComponent(ball, Body);
    state.addComponent(ball, Collider);
    state.addComponent(ball, Transform);

    Transform.scaleX[ball] = 1;
    Transform.scaleY[ball] = 1;
    Transform.scaleZ[ball] = 1;

    Body.type[ball] = BodyType.Dynamic;
    Body.posY[ball] = 10;
    Body.rotW[ball] = 1;
    Body.mass[ball] = 1;
    Body.gravityScale[ball] = 1;

    Collider.shape[ball] = ColliderShape.Sphere;
    Collider.sizeX[ball] = 1;
    Collider.radius[ball] = 0.5;
    Collider.density[ball] = 1;
    Collider.restitution[ball] = 0.8;

    const worldEntities = defineQuery([PhysicsWorld])(state.world);
    if (worldEntities.length > 0) {
      PhysicsWorld.gravityY[worldEntities[0]] = -9.81;
    }

    let bounceDetected = false;
    let previousVelY = 0;

    for (let i = 0; i < 120; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      if (i > 30 && Body.velY[ball] > 0 && previousVelY < 0) {
        bounceDetected = true;
        break;
      }
      previousVelY = Body.velY[ball];
    }

    expect(bounceDetected).toBe(true);
  });

  it('should handle linear damping', () => {
    const box = state.createEntity();
    state.addComponent(box, Body);
    state.addComponent(box, Collider);
    state.addComponent(box, Transform);

    Transform.scaleX[box] = 1;
    Transform.scaleY[box] = 1;
    Transform.scaleZ[box] = 1;

    Body.type[box] = BodyType.Dynamic;
    Body.posY[box] = 5;
    Body.rotW[box] = 1;
    Body.mass[box] = 1;
    Body.gravityScale[box] = 0;
    Body.linearDamping[box] = 2;
    Body.velX[box] = 10;

    Collider.shape[box] = ColliderShape.Box;
    Collider.sizeX[box] = 1;
    Collider.sizeY[box] = 1;
    Collider.sizeZ[box] = 1;
    Collider.density[box] = 1;

    const initialVel = Body.velX[box];

    for (let i = 0; i < 60; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.velX[box]).toBeLessThan(initialVel);
    expect(Body.velX[box]).toBeGreaterThan(0);
  });
});
