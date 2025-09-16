import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import {
  Body,
  BodyType,
  CharacterController,
  CharacterMovement,
  Collider,
  ColliderShape,
  initializePhysics,
  InputState,
  OrbitCameraPlugin,
  parseXMLToEntities,
  PhysicsPlugin,
  Player,
  PlayerPlugin,
  Respawn,
  RespawnPlugin,
  State,
  TIME_CONSTANTS,
  Transform,
  TransformsPlugin,
  WorldTransform,
  XMLParser,
} from 'vibegame';

describe('Respawn Plugin', () => {
  let state: State;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(PhysicsPlugin);
    state.registerPlugin(OrbitCameraPlugin);
    state.registerPlugin(RespawnPlugin);
    state.registerPlugin(PlayerPlugin);
  });

  describe('XML Declarative Usage', () => {
    it('should automatically include respawn in player recipe', () => {
      const xml = '<world><player pos="0 5 0"></player></world>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      expect(state.hasComponent(player, Respawn)).toBe(true);
      expect(Respawn.posX[player]).toBe(0);
      expect(Respawn.posY[player]).toBe(5);
      expect(Respawn.posZ[player]).toBe(0);
    });

    it('should respawn player when falling below threshold', () => {
      const xml = '<world><player pos="0 5 0"></player></world>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      Body.posY[player] = -101;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Body.posY[player]).toBeCloseTo(5, 1);
      expect(WorldTransform.posY[player]).toBeCloseTo(5, 1);
    });

    it('should apply manual respawn component via XML', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      state.addComponent(entity, Body);
      state.addComponent(entity, Collider);
      state.addComponent(entity, Respawn);
      Respawn.posX[entity] = 0;
      Respawn.posY[entity] = 10;
      Respawn.posZ[entity] = -5;

      expect(state.hasComponent(entity, Respawn)).toBe(true);
      expect(Respawn.posX[entity]).toBe(0);
      expect(Respawn.posY[entity]).toBe(10);
      expect(Respawn.posZ[entity]).toBe(-5);
    });

    it('should set respawn position separately from transform', () => {
      const xml = '<player pos="5 3 -2" respawn="pos: 10 15 20"></player>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      expect(state.hasComponent(player, Respawn)).toBe(true);
      expect(Transform.posX[player]).toBe(5);
      expect(Transform.posY[player]).toBe(3);
      expect(Transform.posZ[player]).toBe(-2);

      expect(Respawn.posX[player]).toBe(10);
      expect(Respawn.posY[player]).toBe(15);
      expect(Respawn.posZ[player]).toBe(20);
    });
  });

  describe('Imperative Usage', () => {
    function createEntity(x = 0, y = 5, z = 0): number {
      const entity = state.createEntity();

      state.addComponent(entity, Transform, {
        posX: x,
        posY: y,
        posZ: z,
        eulerX: 0,
        eulerY: 0,
        eulerZ: 0,
      });

      state.addComponent(entity, Respawn, {
        posX: x,
        posY: y,
        posZ: z,
        eulerX: 0,
        eulerY: 0,
        eulerZ: 0,
      });

      state.addComponent(entity, WorldTransform);
      WorldTransform.posX[entity] = x;
      WorldTransform.posY[entity] = y;
      WorldTransform.posZ[entity] = z;

      return entity;
    }

    it('should create entity with respawn imperatively', () => {
      const entity = state.createEntity();

      state.addComponent(entity, Transform, {
        posX: 0,
        posY: 10,
        posZ: 0,
        eulerX: 0,
        eulerY: 0,
        eulerZ: 0,
      });

      state.addComponent(entity, Respawn, {
        posX: 0,
        posY: 10,
        posZ: 0,
        eulerX: 0,
        eulerY: 0,
        eulerZ: 0,
      });

      expect(state.hasComponent(entity, Respawn)).toBe(true);
      expect(Respawn.posY[entity]).toBe(10);
    });

    it('should update spawn point dynamically', () => {
      const entity = createEntity(0, 5, 0);

      Respawn.posX[entity] = 20;
      Respawn.posY[entity] = 5;
      Respawn.posZ[entity] = -10;

      Transform.posY[entity] = -101;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Transform.posX[entity]).toBe(20);
      expect(Transform.posY[entity]).toBe(5);
      expect(Transform.posZ[entity]).toBe(-10);
    });
  });

  describe('Respawn System Behavior', () => {
    beforeEach(() => {
      state.step();
    });

    function createPlayer(x = 0, y = 5, z = 0): number {
      const player = state.createEntity();
      state.addComponent(player, Player);
      state.addComponent(player, InputState);
      state.addComponent(player, Body);
      state.addComponent(player, Collider);
      state.addComponent(player, CharacterController);
      state.addComponent(player, CharacterMovement);
      state.addComponent(player, Transform);
      state.addComponent(player, WorldTransform);
      state.addComponent(player, Respawn);

      Player.speed[player] = 10;
      Player.jumpHeight[player] = 3;
      Player.rotationSpeed[player] = 10;
      Body.gravityScale[player] = 1;
      Player.canJump[player] = 1;
      Player.isJumping[player] = 0;
      Player.jumpCooldown[player] = 0;
      Player.lastGroundedTime[player] = -10000;
      Player.jumpBufferTime[player] = -10000;

      Body.type[player] = BodyType.KinematicPositionBased;
      Body.posX[player] = x;
      Body.posY[player] = y;
      Body.posZ[player] = z;
      Body.rotX[player] = 0;
      Body.rotY[player] = 0;
      Body.rotZ[player] = 0;
      Body.rotW[player] = 1;

      Collider.shape[player] = ColliderShape.Capsule;
      Collider.radius[player] = 0.5;
      Collider.height[player] = 1;

      CharacterController.offset[player] = 0.01;
      CharacterController.upY[player] = 1;

      CharacterMovement.velocityY[player] = 0;

      Transform.posX[player] = x;
      Transform.posY[player] = y;
      Transform.posZ[player] = z;
      Transform.rotX[player] = 0;
      Transform.rotY[player] = 0;
      Transform.rotZ[player] = 0;
      Transform.rotW[player] = 1;

      Respawn.posX[player] = x;
      Respawn.posY[player] = y;
      Respawn.posZ[player] = z;
      Respawn.eulerX[player] = 0;
      Respawn.eulerY[player] = 0;
      Respawn.eulerZ[player] = 0;

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      return player;
    }

    it('should trigger at Y=-100 threshold', () => {
      const player = createPlayer(0, 5, 0);

      Body.posY[player] = -101;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Body.posY[player]).toBeCloseTo(5, 1);
      expect(WorldTransform.posY[player]).toBeCloseTo(5, 1);
    });

    it('should not trigger above Y=-100', () => {
      const player = createPlayer(0, -99, 0);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      // Player should still be above -100 threshold
      expect(Body.posY[player]).toBeGreaterThan(-100);
    });

    it('should reset position to spawn point', () => {
      const player = createPlayer(10, 20, 30);

      Body.posX[player] = 999;
      Body.posY[player] = -101;
      Body.posZ[player] = 999;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Body.posX[player]).toBe(10);
      expect(Body.posY[player]).toBe(20);
      expect(Body.posZ[player]).toBe(30);
    });

    it('should reset all velocities', () => {
      const player = createPlayer(0, 5, 0);

      Body.velX[player] = 10;
      Body.velY[player] = -20;
      Body.velZ[player] = 5;
      CharacterMovement.velocityY[player] = -20;

      Body.posY[player] = -101;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Body.velX[player]).toBe(0);
      expect(Body.velY[player]).toBe(0);
      expect(Body.velZ[player]).toBeCloseTo(0, 1);
      expect(Math.abs(CharacterMovement.velocityY[player])).toBeLessThanOrEqual(
        2
      );
    });

    it('should clear character controller movement', () => {
      const player = createPlayer(0, 5, 0);

      CharacterController.moveX[player] = 5;
      CharacterController.moveY[player] = 10;
      CharacterController.moveZ[player] = 15;
      CharacterController.grounded[player] = 1;

      Body.posY[player] = -101;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Math.abs(CharacterController.moveX[player])).toBeLessThan(0.1);
      expect(Math.abs(CharacterController.moveY[player])).toBeLessThan(0.1);
      expect(Math.abs(CharacterController.moveZ[player])).toBeLessThan(0.1);
      expect(CharacterController.grounded[player]).toBe(0);
    });

    it('should reset player jump state', () => {
      const player = createPlayer(0, 5, 0);

      Player.isJumping[player] = 1;
      Player.canJump[player] = 0;
      Player.jumpCooldown[player] = 0.5;

      Body.posY[player] = -101;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Player.isJumping[player]).toBe(0);
      expect(Player.canJump[player]).toBe(1);
      expect(Player.jumpCooldown[player]).toBeCloseTo(0, 1);
    });

    it('should apply stored rotation on respawn', () => {
      const player = createPlayer(0, 5, 0);

      Respawn.eulerY[player] = 90;

      Body.posY[player] = -101;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Body.rotY[player]).toBeCloseTo(0.707, 0);
      expect(Body.rotW[player]).toBeCloseTo(0.707, 0);
    });
  });

  describe('Multiple Entities', () => {
    it('should handle multiple entities independently', () => {
      const xml = '<player pos="0 5 0"></player>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      const entity = state.createEntity();
      state.addComponent(entity, Transform);
      state.addComponent(entity, WorldTransform);
      state.addComponent(entity, Respawn);
      Respawn.posX[entity] = 10;
      Respawn.posY[entity] = 10;
      Respawn.posZ[entity] = 10;

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      Body.posY[player] = -101;
      Transform.posY[entity] = -101;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Transform.posX[player]).toBe(0);
      expect(Transform.posY[player]).toBe(5);
      expect(Transform.posZ[player]).toBe(0);

      expect(Transform.posX[entity]).toBe(10);
      expect(Transform.posY[entity]).toBe(10);
      expect(Transform.posZ[entity]).toBe(10);
    });

    it('should only respawn entities below threshold', () => {
      const entity1 = state.createEntity();
      state.addComponent(entity1, Transform);
      state.addComponent(entity1, WorldTransform);
      state.addComponent(entity1, Respawn);
      Respawn.posX[entity1] = 1;
      Respawn.posY[entity1] = 1;
      Respawn.posZ[entity1] = 1;
      Transform.posX[entity1] = 0;
      Transform.posY[entity1] = 0;
      Transform.posZ[entity1] = 0;

      const entity2 = state.createEntity();
      state.addComponent(entity2, Transform);
      state.addComponent(entity2, WorldTransform);
      state.addComponent(entity2, Respawn);
      Respawn.posX[entity2] = 2;
      Respawn.posY[entity2] = 2;
      Respawn.posZ[entity2] = 2;
      Transform.posX[entity2] = 2;
      Transform.posY[entity2] = 2;
      Transform.posZ[entity2] = 2;

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      Transform.posY[entity1] = -101;
      Transform.posY[entity2] = -50;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Transform.posY[entity1]).toBe(1);
      expect(Transform.posY[entity2]).toBe(-50);
    });
  });
});
