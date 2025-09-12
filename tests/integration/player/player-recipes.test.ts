import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, XMLParser, parseXMLToEntities } from 'vibegame';
import { RecipePlugin, createEntityFromRecipe } from 'vibegame';
import {
  Player,
  PlayerPlugin,
  CharacterMovement,
  InputState,
  InputPlugin,
} from 'vibegame';
import {
  Body,
  BodyType,
  CharacterController,
  Collider,
  ColliderShape,
  initializePhysics,
  PhysicsPlugin,
} from 'vibegame';
import { Transform, TransformsPlugin, WorldTransform } from 'vibegame';
import { Respawn, RespawnPlugin } from 'vibegame';

describe('Player Recipes and XML', () => {
  let state: State;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(RecipePlugin);
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(PhysicsPlugin);
    state.registerPlugin(RespawnPlugin);
    state.registerPlugin(InputPlugin);
    state.registerPlugin(PlayerPlugin);
  });

  describe('Basic Player Usage (XML)', () => {
    it('should create player with default values', () => {
      const xml = '<root><player /></root>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      expect(state.hasComponent(player, Player)).toBe(true);
      expect(state.hasComponent(player, CharacterMovement)).toBe(true);
      expect(state.hasComponent(player, Transform)).toBe(true);
      expect(state.hasComponent(player, WorldTransform)).toBe(true);
      expect(state.hasComponent(player, Body)).toBe(true);
      expect(state.hasComponent(player, Collider)).toBe(true);
      expect(state.hasComponent(player, CharacterController)).toBe(true);
      expect(state.hasComponent(player, InputState)).toBe(true);
      expect(state.hasComponent(player, Respawn)).toBe(true);

      expect(Player.speed[player]).toBeCloseTo(5.3);
      expect(Player.jumpHeight[player]).toBeCloseTo(2.3);
      expect(Player.rotationSpeed[player]).toBe(10);
      expect(Player.canJump[player]).toBe(1);
      expect(Player.isJumping[player]).toBe(0);
      expect(Player.jumpCooldown[player]).toBe(0);
      expect(Player.lastGroundedTime[player]).toBe(0);
      expect(Player.jumpBufferTime[player]).toBe(-10000);
      expect(Player.cameraSensitivity[player]).toBeCloseTo(0.007);
      expect(Player.cameraZoomSensitivity[player]).toBe(1.5);
      expect(Player.cameraEntity[player]).toBe(0);
    });

    it('should create player with custom position, speed and jump height', () => {
      const xml =
        '<root><player pos="0 2 0" speed="6" jump-height="3" /></root>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      expect(Transform.posX[player]).toBe(0);
      expect(Transform.posY[player]).toBe(2);
      expect(Transform.posZ[player]).toBe(0);
      expect(Player.speed[player]).toBe(6);
      expect(Player.jumpHeight[player]).toBe(3);
    });
  });

  describe('Custom Player Configuration (XML)', () => {
    it('should create player with all custom attributes', () => {
      const xml = `
        <root>
          <player 
            pos="5 1 -10"
            speed="8"
            jump-height="4"
            rotation-speed="15"
            camera-sensitivity="0.005"
          />
        </root>
      `;
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      expect(Transform.posX[player]).toBe(5);
      expect(Transform.posY[player]).toBe(1);
      expect(Transform.posZ[player]).toBe(-10);
      expect(Player.speed[player]).toBe(8);
      expect(Player.jumpHeight[player]).toBe(4);
      expect(Player.rotationSpeed[player]).toBe(15);
      expect(Player.cameraSensitivity[player]).toBeCloseTo(0.005);
    });

    it('should handle CSS-style syntax for player attributes', () => {
      const xml = `
        <root>
          <player player="speed: 7; jump-height: 3.5; camera-zoom-sensitivity: 2" />
        </root>
      `;
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      expect(Player.speed[player]).toBe(7);
      expect(Player.jumpHeight[player]).toBe(3.5);
      expect(Player.cameraZoomSensitivity[player]).toBe(2);
    });

    it('should handle dot notation for player attributes', () => {
      const xml = `
        <root>
          <player 
            player.speed="10"
            player.jump-height="5"
            player.rotation-speed="12"
            player.camera-sensitivity="0.01"
          />
        </root>
      `;
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      expect(Player.speed[player]).toBe(10);
      expect(Player.jumpHeight[player]).toBe(5);
      expect(Player.rotationSpeed[player]).toBe(12);
      expect(Player.cameraSensitivity[player]).toBeCloseTo(0.01);
    });
  });

  describe('Player Recipe Defaults', () => {
    it('should have correct default body configuration', () => {
      const entity = createEntityFromRecipe(state, 'player');

      expect(Body.type[entity]).toBe(BodyType.KinematicPositionBased);
      expect(Body.mass[entity]).toBe(1);
      expect(Body.linearDamping[entity]).toBe(0);
      expect(Body.angularDamping[entity]).toBe(0);
      expect(Body.gravityScale[entity]).toBe(1);
      expect(Body.ccd[entity]).toBe(1);
      expect(Body.lockRotX[entity]).toBe(1);
      expect(Body.lockRotY[entity]).toBe(0);
      expect(Body.lockRotZ[entity]).toBe(1);
    });

    it('should have correct default collider configuration', () => {
      const entity = createEntityFromRecipe(state, 'player');

      expect(Collider.shape[entity]).toBe(ColliderShape.Capsule);
      expect(Collider.radius[entity]).toBeCloseTo(0.3);
      expect(Collider.height[entity]).toBeCloseTo(0.9);
      expect(Collider.friction[entity]).toBe(0);
      expect(Collider.restitution[entity]).toBe(0);
      expect(Collider.density[entity]).toBe(1);
      expect(Collider.posOffsetY[entity]).toBeCloseTo(0.75);
    });

    it('should have correct default character controller configuration', () => {
      const entity = createEntityFromRecipe(state, 'player');

      expect(CharacterController.offset[entity]).toBeCloseTo(0.08);
      expect(CharacterController.maxSlope[entity]).toBeCloseTo(Math.PI / 4);
      expect(CharacterController.maxSlide[entity]).toBeCloseTo(
        30 * (Math.PI / 180)
      );
      expect(CharacterController.snapDist[entity]).toBeCloseTo(0.5);
      expect(CharacterController.autoStep[entity]).toBe(1);
      expect(CharacterController.maxStepHeight[entity]).toBeCloseTo(0.3);
      expect(CharacterController.minStepWidth[entity]).toBeCloseTo(0.05);
    });

    it('should have correct default transform values', () => {
      const entity = createEntityFromRecipe(state, 'player');

      expect(Transform.posX[entity]).toBe(0);
      expect(Transform.posY[entity]).toBe(0);
      expect(Transform.posZ[entity]).toBe(0);
      expect(Transform.rotX[entity]).toBe(0);
      expect(Transform.rotY[entity]).toBe(0);
      expect(Transform.rotZ[entity]).toBe(0);
      expect(Transform.rotW[entity]).toBe(1);
      expect(Transform.scaleX[entity]).toBe(1);
      expect(Transform.scaleY[entity]).toBe(1);
      expect(Transform.scaleZ[entity]).toBe(1);
    });

    it('should have correct default respawn values', () => {
      const entity = createEntityFromRecipe(state, 'player');

      expect(Respawn.posX[entity]).toBe(0);
      expect(Respawn.posY[entity]).toBe(0);
      expect(Respawn.posZ[entity]).toBe(0);
      expect(Respawn.eulerX[entity]).toBe(0);
      expect(Respawn.eulerY[entity]).toBe(0);
      expect(Respawn.eulerZ[entity]).toBe(0);
    });
  });

  describe('Creating Player Programmatically', () => {
    it('should create player entity with recipe components', () => {
      const player = state.createEntity();

      state.addComponent(player, Player, {
        speed: 7,
        jumpHeight: 3.5,
        cameraSensitivity: 0.01,
      });

      state.addComponent(player, Transform, { posY: 5 });
      state.addComponent(player, Body, {
        type: BodyType.KinematicPositionBased,
      });
      state.addComponent(player, CharacterController);
      state.addComponent(player, InputState);

      expect(state.hasComponent(player, Player)).toBe(true);
      expect(state.hasComponent(player, Transform)).toBe(true);
      expect(state.hasComponent(player, Body)).toBe(true);
      expect(state.hasComponent(player, CharacterController)).toBe(true);
      expect(state.hasComponent(player, InputState)).toBe(true);

      expect(Player.speed[player]).toBe(7);
      expect(Player.jumpHeight[player]).toBe(3.5);
      expect(Player.cameraSensitivity[player]).toBeCloseTo(0.01);
      expect(Transform.posY[player]).toBe(5);
      expect(Body.type[player]).toBe(BodyType.KinematicPositionBased);
    });

    it('should handle missing components gracefully', () => {
      const player = state.createEntity();

      state.addComponent(player, Player);
      state.addComponent(player, Transform);

      expect(state.hasComponent(player, Player)).toBe(true);
      expect(state.hasComponent(player, Transform)).toBe(true);
      expect(state.hasComponent(player, Body)).toBe(false);
      expect(state.hasComponent(player, CharacterController)).toBe(false);
    });
  });

  describe('Player Recipe with Overrides', () => {
    it('should override default values using recipe', () => {
      const entity = createEntityFromRecipe(state, 'player', {
        'player.speed': 12,
        'player.jump-height': 6,
        'player.rotation-speed': 20,
        'transform.pos-y': 10,
        'body.gravity-scale': 0.5,
      });

      expect(Player.speed[entity]).toBe(12);
      expect(Player.jumpHeight[entity]).toBe(6);
      expect(Player.rotationSpeed[entity]).toBe(20);
      expect(Transform.posY[entity]).toBe(10);
      expect(Body.gravityScale[entity]).toBe(0.5);
    });

    it('should handle transform position override', () => {
      const entity = createEntityFromRecipe(state, 'player', {
        'transform.pos-x': 5,
        'transform.pos-y': 10,
        'transform.pos-z': -3,
      });

      expect(Transform.posX[entity]).toBe(5);
      expect(Transform.posY[entity]).toBe(10);
      expect(Transform.posZ[entity]).toBe(-3);
    });

    it('should handle collider customization', () => {
      const entity = createEntityFromRecipe(state, 'player', {
        'collider.radius': 0.5,
        'collider.height': 1.5,
        'collider.friction': 0.3,
      });

      expect(Collider.radius[entity]).toBeCloseTo(0.5);
      expect(Collider.height[entity]).toBeCloseTo(1.5);
      expect(Collider.friction[entity]).toBeCloseTo(0.3);
    });
  });

  describe('Multiple Players', () => {
    it('should handle multiple players with different configurations', () => {
      const xml = `
        <root>
          <player pos="0 0 0" speed="5" />
          <player pos="10 0 10" speed="10" jump-height="5" />
        </root>
      `;
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(2);

      const player1 = entities[0].entity;
      const player2 = entities[1].entity;

      expect(Transform.posX[player1]).toBe(0);
      expect(Transform.posZ[player1]).toBe(0);
      expect(Player.speed[player1]).toBe(5);
      expect(Player.jumpHeight[player1]).toBeCloseTo(2.3);

      expect(Transform.posX[player2]).toBe(10);
      expect(Transform.posZ[player2]).toBe(10);
      expect(Player.speed[player2]).toBe(10);
      expect(Player.jumpHeight[player2]).toBe(5);
    });
  });

  describe('Nested Player Entities', () => {
    it('should handle player as child entity', () => {
      const xml = `
        <root>
          <entity>
            <player speed="7" />
          </entity>
        </root>
      `;
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(1);
      expect(entities[0].children.length).toBe(1);

      const player = entities[0].children[0].entity;
      expect(state.hasComponent(player, Player)).toBe(true);
      expect(Player.speed[player]).toBe(7);
    });
  });
});
