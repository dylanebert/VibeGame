import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import {
  Body,
  BodyType,
  CharacterController,
  CharacterMovement,
  Collider,
  ColliderShape,
  CollisionEvents,
  InterpolatedTransform,
  PhysicsWorld,
} from 'vibegame';

describe('Physics Components', () => {
  let state: State;
  let entity: number;

  beforeEach(() => {
    state = new State();
    entity = state.createEntity();
  });

  describe('PhysicsWorld', () => {
    it('should initialize with default gravity', () => {
      state.addComponent(entity, PhysicsWorld);

      expect(PhysicsWorld.gravityX[entity]).toBe(0);
      expect(PhysicsWorld.gravityY[entity]).toBe(0);
      expect(PhysicsWorld.gravityZ[entity]).toBe(0);
    });

    it('should allow custom gravity values', () => {
      state.addComponent(entity, PhysicsWorld);

      PhysicsWorld.gravityX[entity] = 0;
      PhysicsWorld.gravityY[entity] = -9.81;
      PhysicsWorld.gravityZ[entity] = 0;

      expect(PhysicsWorld.gravityY[entity]).toBeCloseTo(-9.81);
    });
  });

  describe('Body', () => {
    it('should initialize with default values', () => {
      state.addComponent(entity, Body);

      expect(Body.type[entity]).toBe(0);
      expect(Body.mass[entity]).toBe(0);
      expect(Body.linearDamping[entity]).toBe(0);
      expect(Body.angularDamping[entity]).toBe(0);
      expect(Body.gravityScale[entity]).toBe(0);
      expect(Body.ccd[entity]).toBe(0);
      expect(Body.lockRotX[entity]).toBe(0);
      expect(Body.lockRotY[entity]).toBe(0);
      expect(Body.lockRotZ[entity]).toBe(0);
    });

    it('should support different body types', () => {
      state.addComponent(entity, Body);

      Body.type[entity] = BodyType.Dynamic;
      expect(Body.type[entity]).toBe(BodyType.Dynamic);

      Body.type[entity] = BodyType.KinematicPositionBased;
      expect(Body.type[entity]).toBe(BodyType.KinematicPositionBased);

      Body.type[entity] = BodyType.Fixed;
      expect(Body.type[entity]).toBe(BodyType.Fixed);
    });

    it('should store position and rotation', () => {
      state.addComponent(entity, Body);

      Body.posX[entity] = 10;
      Body.posY[entity] = 5;
      Body.posZ[entity] = -3;
      Body.rotW[entity] = 1;

      expect(Body.posX[entity]).toBe(10);
      expect(Body.posY[entity]).toBe(5);
      expect(Body.posZ[entity]).toBe(-3);
      expect(Body.rotW[entity]).toBe(1);
    });

    it('should store velocity values', () => {
      state.addComponent(entity, Body);

      Body.velX[entity] = 2;
      Body.velY[entity] = -1;
      Body.velZ[entity] = 0.5;

      expect(Body.velX[entity]).toBe(2);
      expect(Body.velY[entity]).toBe(-1);
      expect(Body.velZ[entity]).toBe(0.5);
    });
  });

  describe('Collider', () => {
    it('should initialize with default values', () => {
      state.addComponent(entity, Collider);

      expect(Collider.shape[entity]).toBe(0);
      expect(Collider.friction[entity]).toBe(0);
      expect(Collider.restitution[entity]).toBe(0);
      expect(Collider.density[entity]).toBe(0);
      expect(Collider.isSensor[entity]).toBe(0);
    });

    it('should support different shapes', () => {
      state.addComponent(entity, Collider);

      Collider.shape[entity] = ColliderShape.Box;
      expect(Collider.shape[entity]).toBe(ColliderShape.Box);

      Collider.shape[entity] = ColliderShape.Sphere;
      expect(Collider.shape[entity]).toBe(ColliderShape.Sphere);

      Collider.shape[entity] = ColliderShape.Capsule;
      expect(Collider.shape[entity]).toBe(ColliderShape.Capsule);
    });

    it('should store size for box colliders', () => {
      state.addComponent(entity, Collider);

      Collider.shape[entity] = ColliderShape.Box;
      Collider.sizeX[entity] = 2;
      Collider.sizeY[entity] = 4;
      Collider.sizeZ[entity] = 1;

      expect(Collider.sizeX[entity]).toBe(2);
      expect(Collider.sizeY[entity]).toBe(4);
      expect(Collider.sizeZ[entity]).toBe(1);
    });

    it('should store radius for sphere colliders', () => {
      state.addComponent(entity, Collider);

      Collider.shape[entity] = ColliderShape.Sphere;
      Collider.radius[entity] = 0.5;

      expect(Collider.radius[entity]).toBe(0.5);
    });

    it('should store physics material properties', () => {
      state.addComponent(entity, Collider);

      Collider.friction[entity] = 0.5;
      Collider.restitution[entity] = 0.8;
      Collider.density[entity] = 1.2;

      expect(Collider.friction[entity]).toBeCloseTo(0.5, 5);
      expect(Collider.restitution[entity]).toBeCloseTo(0.8, 5);
      expect(Collider.density[entity]).toBeCloseTo(1.2, 5);
    });

    it('should support collision filtering', () => {
      state.addComponent(entity, Collider);

      Collider.membershipGroups[entity] = 0x0001;
      Collider.filterGroups[entity] = 0xffff;

      expect(Collider.membershipGroups[entity]).toBe(0x0001);
      expect(Collider.filterGroups[entity]).toBe(0xffff);
    });
  });

  describe('CharacterController', () => {
    it('should initialize with default values', () => {
      state.addComponent(entity, CharacterController);

      expect(CharacterController.offset[entity]).toBe(0);
      expect(CharacterController.maxSlope[entity]).toBe(0);
      expect(CharacterController.maxSlide[entity]).toBe(0);
      expect(CharacterController.snapDist[entity]).toBe(0);
      expect(CharacterController.autoStep[entity]).toBe(0);
      expect(CharacterController.grounded[entity]).toBe(0);
    });

    it('should store movement configuration', () => {
      state.addComponent(entity, CharacterController);

      CharacterController.offset[entity] = 0.1;
      CharacterController.maxSlope[entity] = 45 * (Math.PI / 180);
      CharacterController.maxSlide[entity] = 30 * (Math.PI / 180);
      CharacterController.snapDist[entity] = 0.5;

      expect(CharacterController.offset[entity]).toBeCloseTo(0.1);
      expect(CharacterController.maxSlope[entity]).toBeCloseTo(
        45 * (Math.PI / 180)
      );
      expect(CharacterController.maxSlide[entity]).toBeCloseTo(
        30 * (Math.PI / 180)
      );
      expect(CharacterController.snapDist[entity]).toBe(0.5);
    });

    it('should store auto-step configuration', () => {
      state.addComponent(entity, CharacterController);

      CharacterController.autoStep[entity] = 1;
      CharacterController.maxStepHeight[entity] = 0.3;
      CharacterController.minStepWidth[entity] = 0.1;

      expect(CharacterController.autoStep[entity]).toBe(1);
      expect(CharacterController.maxStepHeight[entity]).toBeCloseTo(0.3, 5);
      expect(CharacterController.minStepWidth[entity]).toBeCloseTo(0.1, 5);
    });

    it('should store up direction', () => {
      state.addComponent(entity, CharacterController);

      CharacterController.upX[entity] = 0;
      CharacterController.upY[entity] = 1;
      CharacterController.upZ[entity] = 0;

      expect(CharacterController.upY[entity]).toBe(1);
    });
  });

  describe('CharacterMovement', () => {
    it('should initialize with default values', () => {
      state.addComponent(entity, CharacterMovement);

      expect(CharacterMovement.desiredVelX[entity]).toBe(0);
      expect(CharacterMovement.desiredVelY[entity]).toBe(0);
      expect(CharacterMovement.desiredVelZ[entity]).toBe(0);
      expect(CharacterMovement.actualMoveX[entity]).toBe(0);
      expect(CharacterMovement.actualMoveY[entity]).toBe(0);
      expect(CharacterMovement.actualMoveZ[entity]).toBe(0);
    });

    it('should store desired velocity', () => {
      state.addComponent(entity, CharacterMovement);

      CharacterMovement.desiredVelX[entity] = 5;
      CharacterMovement.desiredVelY[entity] = 0;
      CharacterMovement.desiredVelZ[entity] = -3;

      expect(CharacterMovement.desiredVelX[entity]).toBe(5);
      expect(CharacterMovement.desiredVelY[entity]).toBe(0);
      expect(CharacterMovement.desiredVelZ[entity]).toBe(-3);
    });

    it('should store actual movement results', () => {
      state.addComponent(entity, CharacterMovement);

      CharacterMovement.actualMoveX[entity] = 4.5;
      CharacterMovement.actualMoveY[entity] = -0.1;
      CharacterMovement.actualMoveZ[entity] = -2.8;

      expect(CharacterMovement.actualMoveX[entity]).toBeCloseTo(4.5, 5);
      expect(CharacterMovement.actualMoveY[entity]).toBeCloseTo(-0.1, 5);
      expect(CharacterMovement.actualMoveZ[entity]).toBeCloseTo(-2.8, 5);
    });
  });

  describe('InterpolatedTransform', () => {
    it('should store previous and current transforms', () => {
      state.addComponent(entity, InterpolatedTransform);

      InterpolatedTransform.prevPosX[entity] = 1;
      InterpolatedTransform.prevPosY[entity] = 2;
      InterpolatedTransform.prevPosZ[entity] = 3;
      InterpolatedTransform.posX[entity] = 2;
      InterpolatedTransform.posY[entity] = 3;
      InterpolatedTransform.posZ[entity] = 4;

      expect(InterpolatedTransform.prevPosX[entity]).toBe(1);
      expect(InterpolatedTransform.posX[entity]).toBe(2);
    });
  });

  describe('CollisionEvents', () => {
    it('should track active events', () => {
      state.addComponent(entity, CollisionEvents);

      CollisionEvents.activeEvents[entity] = 1;
      expect(CollisionEvents.activeEvents[entity]).toBe(1);
    });
  });
});
