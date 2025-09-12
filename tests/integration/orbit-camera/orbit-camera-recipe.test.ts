import { State, XMLParser } from 'vibegame';
import { MainCamera, OrbitCamera, OrbitCameraPlugin } from 'vibegame';
import {
  createEntityFromRecipe,
  parseXMLToEntities,
  RecipePlugin,
} from 'vibegame';
import { Transform, TransformsPlugin, WorldTransform } from 'vibegame';
import { PlayerPlugin } from 'vibegame';
import { RenderingPlugin } from 'vibegame';
import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';

describe('OrbitCamera Recipe Integration', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(RecipePlugin);
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(OrbitCameraPlugin);
    state.registerPlugin(PlayerPlugin);
    state.registerPlugin(RenderingPlugin);
  });

  it('should create orbit camera from recipe', () => {
    const entity = createEntityFromRecipe(state, 'camera');

    expect(state.hasComponent(entity, OrbitCamera)).toBe(true);
    expect(state.hasComponent(entity, Transform)).toBe(true);
  });

  it('should override values with custom attributes', () => {
    const entity = createEntityFromRecipe(state, 'camera', {
      'orbit-camera.target': 5,
      'orbit-camera.current-distance': 15,
      'orbit-camera.target-distance': 15,
      'orbit-camera.smoothness': 0.8,
    });

    expect(OrbitCamera.target[entity]).toBe(5);
    expect(OrbitCamera.currentDistance[entity]).toBe(15);
    expect(OrbitCamera.targetDistance[entity]).toBe(15);
    expect(OrbitCamera.smoothness[entity]).toBeCloseTo(0.8);
  });

  it('should handle distance constraints in overrides', () => {
    const entity = createEntityFromRecipe(state, 'camera', {
      'orbit-camera.min-distance': 1,
      'orbit-camera.max-distance': 100,
    });

    expect(OrbitCamera.minDistance[entity]).toBe(1);
    expect(OrbitCamera.maxDistance[entity]).toBe(100);
  });

  it('should handle angle values in overrides', () => {
    const entity = createEntityFromRecipe(state, 'camera', {
      'orbit-camera.current-yaw': Math.PI / 2,
      'orbit-camera.target-yaw': Math.PI / 2,
      'orbit-camera.current-pitch': Math.PI / 6,
      'orbit-camera.target-pitch': Math.PI / 6,
    });

    expect(OrbitCamera.currentYaw[entity]).toBeCloseTo(Math.PI / 2);
    expect(OrbitCamera.targetYaw[entity]).toBeCloseTo(Math.PI / 2);
    expect(OrbitCamera.currentPitch[entity]).toBeCloseTo(Math.PI / 6);
    expect(OrbitCamera.targetPitch[entity]).toBeCloseTo(Math.PI / 6);
  });

  it('should verify recipe includes expected components', () => {
    expect(state.hasRecipe('camera')).toBe(true);

    const recipe = state.getRecipe('camera');
    expect(recipe).toBeDefined();
    expect(recipe?.components).toContain('orbit-camera');
    expect(recipe?.components).toContain('transform');
    expect(recipe?.components).toContain('world-transform');
  });

  describe('XML Declarative Approach', () => {
    it('should create default orbital camera from XML', () => {
      const xml = '<root><camera /></root>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(1);
      const cameraEntity = entities[0].entity;

      expect(state.hasComponent(cameraEntity, OrbitCamera)).toBe(true);
      expect(state.hasComponent(cameraEntity, Transform)).toBe(true);
      expect(state.hasComponent(cameraEntity, WorldTransform)).toBe(true);
      expect(state.hasComponent(cameraEntity, MainCamera)).toBe(true);

      expect(OrbitCamera.currentDistance[cameraEntity]).toBe(4);
      expect(OrbitCamera.targetDistance[cameraEntity]).toBe(4);
      expect(OrbitCamera.offsetY[cameraEntity]).toBe(1.25);
    });

    it('should create camera with distance and offset attributes', () => {
      const xml = `
        <root>
          <player pos="5 0 3" />
          <camera
            target-distance="10"
            min-distance="5"
            max-distance="20"
            offset-y="2"
          />
        </root>
      `;
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      state.scheduler.step(state, 0);

      const playerEntity = entities[0].entity;
      const cameraEntity = entities[1].entity;

      expect(OrbitCamera.target[cameraEntity]).toBe(playerEntity);
      expect(OrbitCamera.targetDistance[cameraEntity]).toBe(10);
      expect(OrbitCamera.minDistance[cameraEntity]).toBe(5);
      expect(OrbitCamera.maxDistance[cameraEntity]).toBe(20);
      expect(OrbitCamera.offsetY[cameraEntity]).toBe(2);
    });

    it('should create entity with orbit-camera using CSS-style syntax', () => {
      const xml =
        '<root><entity orbit-camera="target-distance: 15; target-yaw: 0; target-pitch: 0.5; smoothness: 0.2; offset-y: 3" transform="" main-camera="" /></root>';
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      const cameraEntity = entities[0].entity;

      expect(state.hasComponent(cameraEntity, OrbitCamera)).toBe(true);
      expect(state.hasComponent(cameraEntity, Transform)).toBe(true);
      expect(state.hasComponent(cameraEntity, MainCamera)).toBe(true);

      expect(OrbitCamera.targetDistance[cameraEntity]).toBe(15);
      expect(OrbitCamera.targetYaw[cameraEntity]).toBe(0);
      expect(OrbitCamera.targetPitch[cameraEntity]).toBe(0.5);
      expect(OrbitCamera.smoothness[cameraEntity]).toBeCloseTo(0.2, 5);
      expect(OrbitCamera.offsetY[cameraEntity]).toBe(3);
    });

    it('should handle nested camera inside world with player', () => {
      const xml = `
        <world>
          <player pos="0 0 0" />
          <camera target-distance="12" />
        </world>
      `;
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      state.scheduler.step(state, 0);

      expect(entities.length).toBe(2);

      const playerEntity = entities[0].entity;
      const cameraEntity = entities[1].entity;

      expect(OrbitCamera.target[cameraEntity]).toBe(playerEntity);
      expect(OrbitCamera.targetDistance[cameraEntity]).toBe(12);
    });

    it('should apply offset values from attributes', () => {
      const xml = `
        <root>
          <camera
            offset-x="2"
            offset-y="5"
            offset-z="-1"
          />
        </root>
      `;
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      const cameraEntity = entities[0].entity;
      expect(OrbitCamera.offsetX[cameraEntity]).toBe(2);
      expect(OrbitCamera.offsetY[cameraEntity]).toBe(5);
      expect(OrbitCamera.offsetZ[cameraEntity]).toBe(-1);
    });

    it('should handle pitch and yaw constraints', () => {
      const xml = `
        <root>
          <camera
            min-pitch="0.1"
            max-pitch="1.4"
            current-yaw="1.57"
            target-yaw="3.14"
          />
        </root>
      `;
      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      const cameraEntity = entities[0].entity;
      expect(OrbitCamera.minPitch[cameraEntity]).toBeCloseTo(0.1, 5);
      expect(OrbitCamera.maxPitch[cameraEntity]).toBeCloseTo(1.4, 5);
      expect(OrbitCamera.currentYaw[cameraEntity]).toBeCloseTo(1.57, 5);
      expect(OrbitCamera.targetYaw[cameraEntity]).toBeCloseTo(3.14, 5);
    });
  });
});
