import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, TIME_CONSTANTS, XMLParser, defineQuery } from 'vibegame';
import {
  ApplyForce,
  ApplyImpulse,
  Body,
  BodyType,
  Collider,
  ColliderShape,
  CollisionEvents,
  initializePhysics,
  PhysicsPlugin,
  TouchedEvent,
} from 'vibegame';
import { RecipePlugin, parseXMLToEntities } from 'vibegame';
import { RenderingPlugin } from 'vibegame';
import { TransformsPlugin } from 'vibegame';

describe('Physics XML Declarative API', () => {
  let state: State;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(RenderingPlugin);
    state.registerPlugin(PhysicsPlugin);
    state.registerPlugin(RecipePlugin);
  });

  describe('physics properties via XML', () => {
    it('should create dynamic body with custom mass and restitution', () => {
      const xml = `
        <root>
          <dynamic-part
            pos="0 5 0"
            shape="sphere"
            radius="0.5"
            mass="2"
            restitution="0.8"
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const ball = entities[0].entity;

      expect(Body.type[ball]).toBe(BodyType.Dynamic);
      expect(Body.mass[ball]).toBe(2);
      expect(Body.posY[ball]).toBe(5);

      const collider = state.getComponent('collider') as any;
      expect(collider?.restitution?.[ball]).toBeCloseTo(0.8, 2);
    });

    it('should create kinematic body with velocity', () => {
      const xml = `
        <root>
          <kinematic-part
            pos="0 5 0"
            shape="box"
            size="3 1 3"
            body="vel: 2 0 0"
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const platform = entities[0].entity;

      expect(Body.type[platform]).toBe(BodyType.KinematicVelocityBased);
      expect(Body.velX[platform]).toBe(2);
      expect(Body.velY[platform]).toBe(0);
      expect(Body.velZ[platform]).toBe(0);
    });

    it('should create static floor with collision properties', () => {
      const xml = `
        <root>
          <static-part
            pos="0 -0.5 0"
            shape="box"
            size="20 1 20"
            friction="0.7"
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const floor = entities[0].entity;

      expect(Body.type[floor]).toBe(BodyType.Fixed);

      const collider = state.getComponent('collider') as any;
      expect(collider?.friction?.[floor]).toBeCloseTo(0.7, 2);
      expect(collider?.sizeX?.[floor]).toBe(20);
      expect(collider?.sizeY?.[floor]).toBe(1);
      expect(collider?.sizeZ?.[floor]).toBe(20);
    });
  });

  describe('collision setup via XML', () => {
    it('should create entities with collision detection setup', () => {
      state.registerConfig({
        defaults: {
          'collision-events': {
            activeEvents: 1,
          },
        },
      });

      const xml = `
        <root>
          <dynamic-part
            pos="0 10 0"
            shape="box"
            size="1"
          />
          <static-part
            pos="0 0 0"
            shape="box"
            size="10 1 10"
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const [box, floor] = entities.map((e) => e.entity);

      expect(Body.type[box]).toBe(BodyType.Dynamic);
      expect(Body.type[floor]).toBe(BodyType.Fixed);

      state.addComponent(box, CollisionEvents);
      state.addComponent(floor, CollisionEvents);

      let collisionDetected = false;

      for (let i = 0; i < 60; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

        const touchedEvents = defineQuery([TouchedEvent])(state.world);
        if (touchedEvents.length > 0) {
          collisionDetected = true;
          break;
        }
      }

      expect(collisionDetected).toBe(true);
    });
  });

  describe('mixed declarative and imperative', () => {
    it('should create entity via XML and apply forces imperatively', () => {
      const xml = `
        <root>
          <dynamic-part
            pos="0 5 0"
            shape="sphere"
            radius="0.5"
            mass="1"
            gravity-scale="0"
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const ball = entities[0].entity;

      expect(Body.type[ball]).toBe(BodyType.Dynamic);

      state.addComponent(ball, ApplyImpulse, {
        x: 0,
        y: 30,
        z: 0,
      });

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(Body.velY[ball]).toBeGreaterThan(0);

      state.removeComponent(ball, ApplyImpulse);
      state.addComponent(ball, ApplyForce, {
        x: 5,
        y: 0,
        z: 0,
      });

      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.velX[ball]).toBeGreaterThan(0);
    });

    it('should handle collision response imperatively for XML entities', () => {
      const xml = `
        <root>
          <dynamic-part
            pos="0 10 0"
            shape="box"
            size="1"
          />
          <static-part
            pos="0 0 0"
            shape="box"
            size="10 1 10"
          />
        </root>
      `;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);
      const box = entities[0].entity;

      state.addComponent(box, CollisionEvents);

      let bounced = false;

      for (let i = 0; i < 60; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

        const touchedEvents = defineQuery([TouchedEvent])(state.world);
        for (const entity of touchedEvents) {
          if (entity === box && !bounced) {
            state.addComponent(entity, ApplyImpulse, {
              x: 0,
              y: 20,
              z: 0,
            });
            bounced = true;
          }
        }
      }

      expect(bounced).toBe(true);
      expect(Body.posY[box]).toBeGreaterThan(0);
    });
  });

  describe('initializePhysics requirement', () => {
    it('should require initializePhysics to be called before use', async () => {
      expect(initializePhysics).toBeDefined();

      await initializePhysics();

      const testState = new State();
      testState.registerPlugin(TransformsPlugin);
      testState.registerPlugin(PhysicsPlugin);

      const entity = testState.createEntity();
      testState.addComponent(entity, Body);
      testState.addComponent(entity, Collider);

      Body.type[entity] = BodyType.Dynamic;
      Body.posY[entity] = 10;
      Body.rotW[entity] = 1;
      Body.mass[entity] = 1;
      Body.gravityScale[entity] = 1;

      Collider.shape[entity] = ColliderShape.Box;
      Collider.sizeX[entity] = 1;
      Collider.sizeY[entity] = 1;
      Collider.sizeZ[entity] = 1;
      Collider.density[entity] = 1;

      testState.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      testState.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      const initialY = Body.posY[entity];

      for (let i = 0; i < 60; i++) {
        testState.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.posY[entity]).toBeLessThan(initialY);
    });
  });
});
