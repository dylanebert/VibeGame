import { beforeEach, describe, expect, it } from 'bun:test';
import { State, TIME_CONSTANTS } from 'vibegame';
import {
  Body,
  BodyType,
  Collider,
  ColliderShape,
  KinematicMove,
  KinematicRotate,
  PhysicsPlugin,
} from 'vibegame/physics';
import { Transform } from 'vibegame/transforms';

describe('Kinematic Bodies Integration', () => {
  let state: State;

  beforeEach(async () => {
    state = new State();
    state.registerPlugin(PhysicsPlugin);

    await state.initializePlugins();
  });

  it('should move kinematic bodies to target positions', () => {
    const platform = state.createEntity();
    state.addComponent(platform, Body);
    state.addComponent(platform, Collider);
    state.addComponent(platform, Transform);

    Transform.scaleX[platform] = 1;
    Transform.scaleY[platform] = 1;
    Transform.scaleZ[platform] = 1;

    Body.type[platform] = BodyType.KinematicPositionBased;
    Body.posX[platform] = 0;
    Body.posY[platform] = 0;
    Body.posZ[platform] = 0;
    Body.rotW[platform] = 1;

    Collider.shape[platform] = ColliderShape.Box;
    Collider.sizeX[platform] = 4;
    Collider.sizeY[platform] = 1;
    Collider.sizeZ[platform] = 4;

    state.addComponent(platform, KinematicMove);
    KinematicMove.x[platform] = 5;
    KinematicMove.y[platform] = 3;
    KinematicMove.z[platform] = -2;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(Body.posX[platform]).toBeCloseTo(5);
    expect(Body.posY[platform]).toBeCloseTo(3);
    expect(Body.posZ[platform]).toBeCloseTo(-2);

    state.removeComponent(platform, KinematicMove);
  });

  it('should rotate kinematic bodies', () => {
    const platform = state.createEntity();
    state.addComponent(platform, Body);
    state.addComponent(platform, Collider);
    state.addComponent(platform, Transform);

    Transform.scaleX[platform] = 1;
    Transform.scaleY[platform] = 1;
    Transform.scaleZ[platform] = 1;

    Body.type[platform] = BodyType.KinematicPositionBased;
    Body.posX[platform] = 0;
    Body.posY[platform] = 0;
    Body.posZ[platform] = 0;
    Body.rotX[platform] = 0;
    Body.rotY[platform] = 0;
    Body.rotZ[platform] = 0;
    Body.rotW[platform] = 1;

    Collider.shape[platform] = ColliderShape.Box;
    Collider.sizeX[platform] = 4;
    Collider.sizeY[platform] = 1;
    Collider.sizeZ[platform] = 4;

    state.addComponent(platform, KinematicRotate);
    KinematicRotate.x[platform] = 0;
    KinematicRotate.y[platform] = 0.707;
    KinematicRotate.z[platform] = 0;
    KinematicRotate.w[platform] = 0.707;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(Body.rotY[platform]).toBeCloseTo(0.707, 2);
    expect(Body.rotW[platform]).toBeCloseTo(0.707, 2);

    state.removeComponent(platform, KinematicRotate);
  });

  it('should push dynamic bodies with kinematic movement', () => {
    const platform = state.createEntity();
    state.addComponent(platform, Body);
    state.addComponent(platform, Collider);
    state.addComponent(platform, Transform);

    Transform.scaleX[platform] = 1;
    Transform.scaleY[platform] = 1;
    Transform.scaleZ[platform] = 1;

    Body.type[platform] = BodyType.KinematicPositionBased;
    Body.posX[platform] = 0;
    Body.posY[platform] = 0;
    Body.posZ[platform] = 0;
    Body.rotW[platform] = 1;

    Collider.shape[platform] = ColliderShape.Box;
    Collider.sizeX[platform] = 4;
    Collider.sizeY[platform] = 1;
    Collider.sizeZ[platform] = 4;

    const box = state.createEntity();
    state.addComponent(box, Body);
    state.addComponent(box, Collider);
    state.addComponent(box, Transform);

    Transform.scaleX[box] = 1;
    Transform.scaleY[box] = 1;
    Transform.scaleZ[box] = 1;

    Body.type[box] = BodyType.Dynamic;
    Body.posX[box] = 0;
    Body.posY[box] = 1;
    Body.posZ[box] = 0;
    Body.rotW[box] = 1;
    Body.mass[box] = 1;
    Body.gravityScale[box] = 0;

    Collider.shape[box] = ColliderShape.Box;
    Collider.sizeX[box] = 1;
    Collider.sizeY[box] = 1;
    Collider.sizeZ[box] = 1;
    Collider.density[box] = 1;

    const initialBoxY = Body.posY[box];

    state.addComponent(platform, KinematicMove);
    KinematicMove.x[platform] = 0;
    KinematicMove.y[platform] = 2;
    KinematicMove.z[platform] = 0;

    for (let i = 0; i < 10; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posY[platform]).toBeCloseTo(2);
    expect(Body.posY[box]).toBeGreaterThan(initialBoxY);
  });

  it('should handle velocity-based kinematic bodies', () => {
    const platform = state.createEntity();
    state.addComponent(platform, Body);
    state.addComponent(platform, Collider);
    state.addComponent(platform, Transform);

    Transform.scaleX[platform] = 1;
    Transform.scaleY[platform] = 1;
    Transform.scaleZ[platform] = 1;

    Body.type[platform] = BodyType.KinematicVelocityBased;
    Body.posX[platform] = 0;
    Body.posY[platform] = 0;
    Body.posZ[platform] = 0;
    Body.rotW[platform] = 1;
    Body.velX[platform] = 5;
    Body.velY[platform] = 0;
    Body.velZ[platform] = 0;

    Collider.shape[platform] = ColliderShape.Box;
    Collider.sizeX[platform] = 4;
    Collider.sizeY[platform] = 1;
    Collider.sizeZ[platform] = 4;

    const initialX = Body.posX[platform];

    for (let i = 0; i < 10; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posX[platform]).toBeGreaterThan(initialX);
    expect(Body.velX[platform]).toBe(5);
  });

  it('should maintain position when no movement is applied', () => {
    const platform = state.createEntity();
    state.addComponent(platform, Body);
    state.addComponent(platform, Collider);
    state.addComponent(platform, Transform);

    Transform.scaleX[platform] = 1;
    Transform.scaleY[platform] = 1;
    Transform.scaleZ[platform] = 1;

    Body.type[platform] = BodyType.KinematicPositionBased;
    Body.posX[platform] = 5;
    Body.posY[platform] = 10;
    Body.posZ[platform] = -3;
    Body.rotW[platform] = 1;

    Collider.shape[platform] = ColliderShape.Box;
    Collider.sizeX[platform] = 4;
    Collider.sizeY[platform] = 1;
    Collider.sizeZ[platform] = 4;

    for (let i = 0; i < 10; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posX[platform]).toBe(5);
    expect(Body.posY[platform]).toBe(10);
    expect(Body.posZ[platform]).toBe(-3);
  });
});
