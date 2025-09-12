import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import {
  AnimatedCharacter,
  AnimationPlugin,
  CharacterController,
  parseXMLToEntities,
  PhysicsPlugin,
  RecipePlugin,
  State,
  Transform,
  TransformsPlugin,
  XMLParser,
  defineQuery,
} from 'vibegame';

describe('Animation Plugin', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(PhysicsPlugin);
    state.registerPlugin(RecipePlugin);
    state.registerPlugin(AnimationPlugin);
  });

  describe('Component Registration', () => {
    it('should register AnimatedCharacter component', () => {
      const component = state.getComponent('animated-character');
      expect(component).toBe(AnimatedCharacter);
    });
  });

  describe('Imperative Usage', () => {
    it('should add AnimatedCharacter to a player entity', () => {
      const player = state.createEntity();
      state.addComponent(player, AnimatedCharacter);
      state.addComponent(player, CharacterController);
      state.addComponent(player, Transform);

      expect(state.hasComponent(player, AnimatedCharacter)).toBe(true);
      expect(state.hasComponent(player, CharacterController)).toBe(true);
      expect(state.hasComponent(player, Transform)).toBe(true);
    });

    it('should initialize with default animation state values', () => {
      const player = state.createEntity();
      state.addComponent(player, AnimatedCharacter);

      expect(AnimatedCharacter.animationState[player]).toBe(0);
      expect(AnimatedCharacter.phase[player]).toBe(0);
      expect(AnimatedCharacter.jumpTime[player]).toBe(0);
      expect(AnimatedCharacter.fallTime[player]).toBe(0);
      expect(AnimatedCharacter.stateTransition[player]).toBe(0);
    });

    it('should allow querying animated characters', () => {
      const player1 = state.createEntity();
      const player2 = state.createEntity();
      const nonPlayer = state.createEntity();

      state.addComponent(player1, AnimatedCharacter);
      state.addComponent(player2, AnimatedCharacter);

      const characters = defineQuery([AnimatedCharacter])(state.world);
      expect(characters.length).toBe(2);
      expect(characters).toContain(player1);
      expect(characters).toContain(player2);
      expect(characters).not.toContain(nonPlayer);
    });

    it('should track animation state changes', () => {
      const player = state.createEntity();
      state.addComponent(player, AnimatedCharacter);

      AnimatedCharacter.animationState[player] = 1;
      expect(AnimatedCharacter.animationState[player]).toBe(1);

      AnimatedCharacter.animationState[player] = 2;
      AnimatedCharacter.jumpTime[player] = 0.25;
      expect(AnimatedCharacter.animationState[player]).toBe(2);
      expect(AnimatedCharacter.jumpTime[player]).toBeCloseTo(0.25, 5);

      AnimatedCharacter.animationState[player] = 3;
      AnimatedCharacter.fallTime[player] = 0.5;
      expect(AnimatedCharacter.animationState[player]).toBe(3);
      expect(AnimatedCharacter.fallTime[player]).toBeCloseTo(0.5, 5);

      AnimatedCharacter.animationState[player] = 4;
      AnimatedCharacter.stateTransition[player] = 0.15;
      expect(AnimatedCharacter.animationState[player]).toBe(4);
      expect(AnimatedCharacter.stateTransition[player]).toBeCloseTo(0.15, 5);
    });

    it('should track walk cycle phase', () => {
      const player = state.createEntity();
      state.addComponent(player, AnimatedCharacter);

      AnimatedCharacter.phase[player] = 0.5;
      expect(AnimatedCharacter.phase[player]).toBeCloseTo(0.5, 5);

      AnimatedCharacter.phase[player] = 1.0;
      expect(AnimatedCharacter.phase[player]).toBeCloseTo(1.0, 5);
    });

    it('should work with multiple animated characters', () => {
      const players = [];
      for (let i = 0; i < 5; i++) {
        const player = state.createEntity();
        state.addComponent(player, AnimatedCharacter);
        state.addComponent(player, Transform);
        players.push(player);
      }

      const characters = defineQuery([AnimatedCharacter])(state.world);
      expect(characters.length).toBe(5);

      for (const player of players) {
        expect(state.hasComponent(player, AnimatedCharacter)).toBe(true);
      }
    });
  });

  describe('XML Declaration', () => {
    it('should create animated character from XML', () => {
      state.registerRecipe({
        name: 'entity',
        components: [],
      });

      const xml =
        '<root><entity animated-character="" transform="pos: 0 2 0"></entity></root>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      expect(state.hasComponent(player, AnimatedCharacter)).toBe(true);
      expect(state.hasComponent(player, Transform)).toBe(true);
      expect(Transform.posY[player]).toBe(2);
    });

    it('should create animated character with character controller from XML', () => {
      state.registerRecipe({
        name: 'entity',
        components: [],
      });

      const xml =
        '<root><entity animated-character="" character-controller="" transform="pos: 0 2 0"></entity></root>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const player = entities[0].entity;

      expect(state.hasComponent(player, AnimatedCharacter)).toBe(true);
      expect(state.hasComponent(player, CharacterController)).toBe(true);
      expect(state.hasComponent(player, Transform)).toBe(true);
      expect(Transform.posY[player]).toBe(2);
    });

    it('should handle multiple animated characters in XML', () => {
      state.registerRecipe({
        name: 'entity',
        components: [],
      });

      const xml = `<root>
        <entity animated-character="" transform="pos: 0 0 0"></entity>
        <entity animated-character="" transform="pos: 5 0 0"></entity>
        <entity animated-character="" transform="pos: 10 0 0"></entity>
      </root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(3);

      for (const entityInfo of entities) {
        expect(state.hasComponent(entityInfo.entity, AnimatedCharacter)).toBe(
          true
        );
        expect(state.hasComponent(entityInfo.entity, Transform)).toBe(true);
      }

      expect(Transform.posX[entities[0].entity]).toBe(0);
      expect(Transform.posX[entities[1].entity]).toBe(5);
      expect(Transform.posX[entities[2].entity]).toBe(10);
    });
  });

  describe('Animation State System', () => {
    it('should allow checking animation state in custom systems', () => {
      const player = state.createEntity();
      state.addComponent(player, AnimatedCharacter);

      AnimatedCharacter.animationState[player] = 2;

      const characters = defineQuery([AnimatedCharacter])(state.world);
      let jumpingCount = 0;
      for (const entity of characters) {
        const animState = AnimatedCharacter.animationState[entity];
        if (animState === 2) {
          jumpingCount++;
        }
      }

      expect(jumpingCount).toBe(1);
    });

    it('should support all animation states', () => {
      const player = state.createEntity();
      state.addComponent(player, AnimatedCharacter);

      const states = {
        IDLE: 0,
        WALKING: 1,
        JUMPING: 2,
        FALLING: 3,
        LANDING: 4,
      };

      for (const [_name, value] of Object.entries(states)) {
        AnimatedCharacter.animationState[player] = value;
        expect(AnimatedCharacter.animationState[player]).toBe(value);
      }
    });
  });

  describe('Integration with Physics', () => {
    it('should work with CharacterController', () => {
      const player = state.createEntity();
      state.addComponent(player, AnimatedCharacter);
      state.addComponent(player, CharacterController);
      state.addComponent(player, Transform);

      expect(state.hasComponent(player, AnimatedCharacter)).toBe(true);
      expect(state.hasComponent(player, CharacterController)).toBe(true);

      CharacterController.grounded[player] = 1;
      expect(CharacterController.grounded[player]).toBe(1);

      AnimatedCharacter.animationState[player] = 1;
      expect(AnimatedCharacter.animationState[player]).toBe(1);
    });
  });
});
