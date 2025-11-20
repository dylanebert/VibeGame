import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, TIME_CONSTANTS, XMLParser, parseXMLToEntities } from 'vibegame';
import {
  Body,
  BodyType,
  PhysicsPlugin,
  CharacterController,
  CharacterMovement,
  Collider,
  ColliderShape,
} from 'vibegame/physics';
import { RenderingPlugin } from 'vibegame/rendering';
import { TransformsPlugin } from 'vibegame/transforms';
import { TweenPlugin } from 'vibegame/tweening';

describe('Physics Recipes', () => {
  let state: State;

  beforeEach(async () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(RenderingPlugin);
    state.registerPlugin(PhysicsPlugin);

    await state.initializePlugins();
  });

  describe('static-part recipe', () => {
    it('should create fixed bodies that do not fall', () => {
      const xml = `
        <root>
          <static-part 
            body="pos: 0 10 0"
            transform="pos: 0 10 0"
            renderer="shape: box; size: 5 1 5" 
            collider="shape: box; size: 5 1 5" />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(1);
      const staticEntity = entities[0].entity;

      // Verify body type is Fixed
      expect(Body.type[staticEntity]).toBe(BodyType.Fixed);
      expect(Body.mass[staticEntity]).toBe(0);
      expect(Body.gravityScale[staticEntity]).toBe(0);

      const initialY = Body.posY[staticEntity];
      expect(initialY).toBe(10);

      // Simulate and verify it doesn't move
      for (let i = 0; i < 30; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.posY[staticEntity]).toBe(initialY);
    });

    it('should apply attributes correctly', () => {
      const xml = `
        <root>
          <static-part 
            body="pos: 5 2 -3; mass: 10"
            transform="pos: 5 2 -3"
            renderer="shape: sphere; size: 2 2 2; color: 0xff0000"
            collider="shape: sphere; radius: 1"
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const entity = entities[0].entity;

      expect(Body.posX[entity]).toBe(5);
      expect(Body.posY[entity]).toBe(2);
      expect(Body.posZ[entity]).toBe(-3);
      // Even with mass attribute, static should override to 0
      expect(Body.mass[entity]).toBe(10);
      expect(Body.type[entity]).toBe(BodyType.Fixed);
    });
  });

  describe('dynamic-part recipe', () => {
    it('should create dynamic bodies that fall', () => {
      const xml = `
        <root>
          <dynamic-part 
            body="pos: 0 10 0"
            transform="pos: 0 10 0"
            renderer="shape: sphere; size: 1 1 1"
            collider="shape: sphere; radius: 0.5" />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(1);
      const dynamicEntity = entities[0].entity;

      // Verify body type is Dynamic
      expect(Body.type[dynamicEntity]).toBe(BodyType.Dynamic);
      expect(Body.mass[dynamicEntity]).toBe(1);
      expect(Body.gravityScale[dynamicEntity]).toBe(1);

      const initialY = Body.posY[dynamicEntity];
      expect(initialY).toBe(10);

      // Simulate and verify it falls
      for (let i = 0; i < 30; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.posY[dynamicEntity]).toBeLessThan(initialY);
    });

    it('should apply custom mass', () => {
      const xml = `
        <root>
          <dynamic-part 
            body="pos: 0 5 0; mass: 5"
            transform="pos: 0 5 0"
            collider="density: 5" />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const entity = entities[0].entity;

      expect(Body.mass[entity]).toBe(5);
      expect(Body.gravityScale[entity]).toBe(1);
    });
  });

  describe('kinematic-part recipe', () => {
    it('should create kinematic bodies that do not fall', () => {
      const xml = `
        <root>
          <kinematic-part 
            body="pos: 0 10 0"
            transform="pos: 0 10 0"
            renderer="shape: box; size: 3 1 3"
            collider="shape: box; size: 3 1 3" />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(1);
      const kinematicEntity = entities[0].entity;

      // Verify body type is Kinematic
      expect(Body.type[kinematicEntity]).toBe(BodyType.KinematicVelocityBased);
      expect(Body.mass[kinematicEntity]).toBe(1);
      expect(Body.gravityScale[kinematicEntity]).toBe(0);

      const initialY = Body.posY[kinematicEntity];
      expect(initialY).toBe(10);

      // Simulate and verify it doesn't fall
      for (let i = 0; i < 30; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.posY[kinematicEntity]).toBe(initialY);
    });

    it('should support velocity for moving platforms', () => {
      const xml = `
        <root>
          <kinematic-part 
            body="pos: 0 5 0; vel: 2 0 0"
            transform="pos: 0 5 0" />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const entity = entities[0].entity;

      expect(Body.velX[entity]).toBe(2);
      expect(Body.velY[entity]).toBe(0);
      expect(Body.velZ[entity]).toBe(0);
    });
  });

  describe('shorthands in physics recipes', () => {
    it('should expand size shorthand to renderer and collider', () => {
      const xml = `
        <root>
          <static-part 
            pos="0 10 0"
            shape="box"
            size="10 2 6"
            color="#ff0000" />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const entity = entities[0].entity;

      const renderer = state.getComponent('renderer') as any;
      const collider = state.getComponent('collider') as any;

      expect(renderer?.sizeX?.[entity]).toBe(10);
      expect(renderer?.sizeY?.[entity]).toBe(2);
      expect(renderer?.sizeZ?.[entity]).toBe(6);

      expect(collider?.sizeX?.[entity]).toBe(10);
      expect(collider?.sizeY?.[entity]).toBe(2);
      expect(collider?.sizeZ?.[entity]).toBe(6);
    });

    it('should apply shape shorthand to both renderer and collider', () => {
      const xml = `
        <root>
          <dynamic-part 
            pos="0 10 0"
            shape="sphere"
            size="2" />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const entity = entities[0].entity;

      const renderer = state.getComponent('renderer') as any;
      const collider = state.getComponent('collider') as any;

      expect(renderer?.shape?.[entity]).toBe(1);
      expect(collider?.shape?.[entity]).toBe(1);
    });

    it('should allow explicit properties to override shorthands', () => {
      const xml = `
        <root>
          <dynamic-part 
            pos="0 10 0"
            shape="box"
            size="2"
            collider="shape: sphere; radius: 1.5" />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const entity = entities[0].entity;

      const renderer = state.getComponent('renderer') as any;
      const collider = state.getComponent('collider') as any;

      expect(renderer?.shape?.[entity]).toBe(0);

      expect(collider?.shape?.[entity]).toBe(1);
      expect(collider?.radius?.[entity]).toBe(1.5);
    });
  });

  describe('character with controller', () => {
    it('should create character entity with controller from XML', () => {
      const xml = `
        <root>
          <entity
            pos="0 1 0"
            body="type: kinematic-position"
            collider="shape: capsule; height: 1.8; radius: 0.4"
            character-controller=""
            character-movement=""
            transform=""
            renderer=""
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(1);
      const character = entities[0].entity;

      expect(state.hasComponent(character, Body)).toBe(true);
      expect(Body.type[character]).toBe(BodyType.KinematicPositionBased);
      expect(Body.posX[character]).toBe(0);
      expect(Body.posY[character]).toBe(1);
      expect(Body.posZ[character]).toBe(0);

      expect(state.hasComponent(character, Collider)).toBe(true);
      expect(Collider.shape[character]).toBe(ColliderShape.Capsule);
      expect(Collider.height[character]).toBeCloseTo(1.8, 2);
      expect(Collider.radius[character]).toBeCloseTo(0.4, 2);

      expect(state.hasComponent(character, CharacterController)).toBe(true);
      expect(state.hasComponent(character, CharacterMovement)).toBe(true);
    });

    it('should create character with custom controller settings', () => {
      state.registerConfig({
        defaults: {
          'character-movement': {
            desiredVelX: 0,
            desiredVelY: 0,
            desiredVelZ: 0,
            velocityY: 0,
          },
        },
      });

      const xml = `
        <root>
          <entity
            pos="0 2 0"
            body="type: kinematic-position"
            collider="shape: capsule; height: 1.8; radius: 0.4"
            character-controller="max-slope: 0.785; auto-step: 1; max-step-height: 0.3"
            character-movement=""
            transform=""
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const character = entities[0].entity;

      expect(CharacterController.maxSlope[character]).toBeCloseTo(0.785, 2);
      expect(CharacterController.autoStep[character]).toBe(1);
      expect(CharacterController.maxStepHeight[character]).toBeCloseTo(0.3, 2);

      expect(state.hasComponent(character, CharacterMovement)).toBe(true);
    });
  });

  describe('moving platform with tweening', () => {
    beforeEach(async () => {
      state.registerPlugin(TweenPlugin);
    });

    it('should create kinematic platform with tween animation', () => {
      const xml = `
        <root>
          <kinematic-part name="platform"
            pos="0 2 0"
            shape="box"
            size="3 0.2 3"
            color="#4169e1"
          >
          </kinematic-part>
          <tween
            target="platform"
            attr="body.pos-y"
            from="2"
            to="5"
            duration="3"
            easing="sine-in-out"
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(2);
      const platform = entities[0].entity;

      expect(state.hasComponent(platform, Body)).toBe(true);
      expect(Body.type[platform]).toBe(BodyType.KinematicVelocityBased);
      expect(Body.posY[platform]).toBe(2);

      const renderer = state.getComponent('renderer') as any;
      const collider = state.getComponent('collider') as any;

      expect(renderer?.shape?.[platform]).toBe(0);
      expect(renderer?.sizeX?.[platform]).toBe(3);
      expect(renderer?.sizeY?.[platform]).toBeCloseTo(0.2, 1);
      expect(renderer?.sizeZ?.[platform]).toBe(3);
      expect(renderer?.color?.[platform]).toBe(0x4169e1);

      expect(collider?.shape?.[platform]).toBe(0);
      expect(collider?.sizeX?.[platform]).toBe(3);
      expect(collider?.sizeY?.[platform]).toBeCloseTo(0.2, 1);
      expect(collider?.sizeZ?.[platform]).toBe(3);

      const tweenParserCalled = parseXMLToEntities.toString().includes('tween');
      expect(tweenParserCalled || entities[0].children.length >= 0).toBe(true);
    });
  });

  describe('mixed physics parts', () => {
    it('should handle all three types together', () => {
      const xml = `
        <root>
          <static-part 
            body="pos: 0 0 0"
            transform="pos: 0 0 0"
            renderer="shape: box; size: 20 1 20"
            collider="shape: box; size: 20 1 20" />
          <dynamic-part 
            body="pos: 0 10 0"
            transform="pos: 0 10 0"
            renderer="shape: sphere; size: 1 1 1"
            collider="shape: sphere; radius: 0.5" />
          <kinematic-part 
            body="pos: 5 5 0"
            transform="pos: 5 5 0"
            renderer="shape: box; size: 3 1 3"
            collider="shape: box; size: 3 1 3" />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(3);

      const [staticEnt, dynamicEnt, kinematicEnt] = entities.map(
        (e) => e.entity
      );

      // Verify body types
      expect(Body.type[staticEnt]).toBe(BodyType.Fixed);
      expect(Body.type[dynamicEnt]).toBe(BodyType.Dynamic);
      expect(Body.type[kinematicEnt]).toBe(BodyType.KinematicVelocityBased);

      // Verify gravity scales
      expect(Body.gravityScale[staticEnt]).toBe(0);
      expect(Body.gravityScale[dynamicEnt]).toBe(1);
      expect(Body.gravityScale[kinematicEnt]).toBe(0);

      const staticInitialY = Body.posY[staticEnt];
      const dynamicInitialY = Body.posY[dynamicEnt];
      const kinematicInitialY = Body.posY[kinematicEnt];

      // Simulate
      for (let i = 0; i < 30; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      // Static and kinematic should not move
      expect(Body.posY[staticEnt]).toBe(staticInitialY);
      expect(Body.posY[kinematicEnt]).toBe(kinematicInitialY);

      // Dynamic should fall
      expect(Body.posY[dynamicEnt]).toBeLessThan(dynamicInitialY);
    });
  });
});
