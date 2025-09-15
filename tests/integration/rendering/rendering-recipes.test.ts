import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, XMLParser, defineQuery } from 'vibegame';
import {
  Ambient,
  Directional,
  MainCamera,
  Renderer,
  RenderContext,
  RenderingPlugin,
  setCanvasElement,
} from 'vibegame';
import { Transform, TransformsPlugin } from 'vibegame';
import { RecipePlugin, parseXMLToEntities } from 'vibegame';

describe('Rendering Recipes', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(RenderingPlugin);
    state.registerPlugin(RecipePlugin);
  });

  describe('Basic Rendering Setup', () => {
    it('should handle root element with canvas and sky attributes', () => {
      const xml = `<root canvas="#game-canvas" sky="#87ceeb"><light></light><entity renderer="shape: box"></entity></root>`;

      const parsed = XMLParser.parse(xml);
      const rootElement = parsed.root;

      expect(rootElement).toBeDefined();
      expect(rootElement.attributes.canvas).toBe('#game-canvas');
      expect(rootElement.attributes.sky).toBe(0x87ceeb);

      const entities = parseXMLToEntities(state, rootElement);
      expect(entities.length).toBe(2);
    });
  });

  describe('Custom Lighting', () => {
    it('should create separate ambient and directional lights', () => {
      const xml = `<root><ambient-light sky-color="#ffd4a3" ground-color="#808080" intensity="0.4" /><directional-light color="#ffffff" intensity="1.5" direction-x="-1" direction-y="3" direction-z="-0.5" cast-shadow="1" shadow-map-size="2048" /></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(2);

      const ambientEntity = entities[0].entity;
      expect(state.hasComponent(ambientEntity, Ambient)).toBe(true);
      expect(state.hasComponent(ambientEntity, Directional)).toBe(false);
      expect(Ambient.skyColor[ambientEntity]).toBe(0xffd4a3);
      expect(Ambient.groundColor[ambientEntity]).toBe(0x808080);
      expect(Ambient.intensity[ambientEntity]).toBeCloseTo(0.4);

      const directionalEntity = entities[1].entity;
      expect(state.hasComponent(directionalEntity, Directional)).toBe(true);
      expect(state.hasComponent(directionalEntity, Ambient)).toBe(false);
      expect(Directional.color[directionalEntity]).toBe(0xffffff);
      expect(Directional.intensity[directionalEntity]).toBe(1.5);
      expect(Directional.directionX[directionalEntity]).toBe(-1);
      expect(Directional.directionY[directionalEntity]).toBe(3);
      expect(Directional.directionZ[directionalEntity]).toBe(-0.5);
      expect(Directional.castShadow[directionalEntity]).toBe(1);
      expect(Directional.shadowMapSize[directionalEntity]).toBe(2048);
    });
  });

  describe('Imperative Usage', () => {
    it('should create rendered entity programmatically', () => {
      const entity = state.createEntity();

      state.addComponent(entity, Transform, {
        posX: 0,
        posY: 5,
        posZ: 0,
      });

      state.addComponent(entity, Renderer, {
        shape: 1,
        sizeX: 2,
        sizeY: 2,
        sizeZ: 2,
        color: 0xff00ff,
        visible: 1,
      });

      expect(state.hasComponent(entity, Transform)).toBe(true);
      expect(state.hasComponent(entity, Renderer)).toBe(true);
      expect(Transform.posX[entity]).toBe(0);
      expect(Transform.posY[entity]).toBe(5);
      expect(Transform.posZ[entity]).toBe(0);
      expect(Renderer.shape[entity]).toBe(1);
      expect(Renderer.sizeX[entity]).toBe(2);
      expect(Renderer.sizeY[entity]).toBe(2);
      expect(Renderer.sizeZ[entity]).toBe(2);
      expect(Renderer.color[entity]).toBe(0xff00ff);
      expect(Renderer.visible[entity]).toBe(1);
    });

    it('should set canvas for rendering context', () => {
      const contextEntity = state.createEntity();
      state.addComponent(contextEntity, RenderContext);

      const mockCanvas = {
        getContext: () => null,
        width: 800,
        height: 600,
      } as unknown as HTMLCanvasElement;

      setCanvasElement(contextEntity, mockCanvas);

      expect(state.hasComponent(contextEntity, RenderContext)).toBe(true);
    });
  });

  describe('Shape Types', () => {
    it('should handle shape enums in XML', () => {
      const xml = `<root><entity renderer="shape: sphere"></entity><entity renderer="shape: box"></entity><entity renderer="shape: cylinder"></entity><entity renderer="shape: plane"></entity></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(4);
      expect(Renderer.shape[entities[0].entity]).toBe(1);
      expect(Renderer.shape[entities[1].entity]).toBe(0);
      expect(Renderer.shape[entities[2].entity]).toBe(2);
      expect(Renderer.shape[entities[3].entity]).toBe(3);
    });

    it('should handle numeric shape values', () => {
      const xml = `<root><entity renderer="shape: 0"></entity><entity renderer="shape: 1"></entity><entity renderer="shape: 2"></entity><entity renderer="shape: 3"></entity></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(4);
      expect(Renderer.shape[entities[0].entity]).toBe(0);
      expect(Renderer.shape[entities[1].entity]).toBe(1);
      expect(Renderer.shape[entities[2].entity]).toBe(2);
      expect(Renderer.shape[entities[3].entity]).toBe(3);
    });

    it('should use shape enum programmatically', () => {
      const shapes = {
        box: 0,
        sphere: 1,
        cylinder: 2,
        plane: 3,
      };

      const boxEntity = state.createEntity();
      state.addComponent(boxEntity, Renderer);
      Renderer.shape[boxEntity] = shapes.box;
      expect(Renderer.shape[boxEntity]).toBe(0);

      const sphereEntity = state.createEntity();
      state.addComponent(sphereEntity, Renderer);
      Renderer.shape[sphereEntity] = shapes.sphere;
      expect(Renderer.shape[sphereEntity]).toBe(1);
    });
  });

  describe('Visibility Control', () => {
    it('should handle visibility in XML', () => {
      const xml = `<root><entity renderer="visible: 0"></entity><entity renderer="visible: 1"></entity></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(2);
      expect(Renderer.visible[entities[0].entity]).toBe(0);
      expect(Renderer.visible[entities[1].entity]).toBe(1);
    });

    it('should toggle visibility programmatically', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Renderer);

      Renderer.visible[entity] = 0;
      expect(Renderer.visible[entity]).toBe(0);

      Renderer.visible[entity] = 1;
      expect(Renderer.visible[entity]).toBe(1);
    });

    it('should handle initially hidden entities', () => {
      const xml = `<root><entity renderer="shape: box; color: 0xff0000; visible: 0" transform="pos: 0 0 0" /></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      const entity = entities[0].entity;
      expect(state.hasComponent(entity, Renderer)).toBe(true);
      expect(Renderer.visible[entity]).toBe(0);
      expect(Renderer.shape[entity]).toBe(0);
      expect(Renderer.color[entity]).toBe(0xff0000);
    });
  });

  describe('Size and Color Properties', () => {
    it('should handle size shorthand expansion', () => {
      const xml = `<root><entity renderer="size: 2 3 4"></entity><entity renderer="size: 5"></entity></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      const entity1 = entities[0].entity;
      expect(Renderer.sizeX[entity1]).toBe(2);
      expect(Renderer.sizeY[entity1]).toBe(3);
      expect(Renderer.sizeZ[entity1]).toBe(4);

      const entity2 = entities[1].entity;
      expect(Renderer.sizeX[entity2]).toBe(5);
      expect(Renderer.sizeY[entity2]).toBe(5);
      expect(Renderer.sizeZ[entity2]).toBe(5);
    });

    it('should handle mixed properties in renderer string', () => {
      const xml = `<root><entity renderer="shape: sphere; size: 2 2 2; color: 0x00ff00; visible: 1"></entity></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      const entity = entities[0].entity;
      expect(Renderer.shape[entity]).toBe(1);
      expect(Renderer.sizeX[entity]).toBe(2);
      expect(Renderer.sizeY[entity]).toBe(2);
      expect(Renderer.sizeZ[entity]).toBe(2);
      expect(Renderer.color[entity]).toBe(0x00ff00);
      expect(Renderer.visible[entity]).toBe(1);
    });

    it('should apply default values when not specified', () => {
      const xml = `<root><entity renderer="shape: box"></entity></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      const entity = entities[0].entity;
      expect(Renderer.shape[entity]).toBe(0);
      expect(Renderer.sizeX[entity]).toBe(1);
      expect(Renderer.sizeY[entity]).toBe(1);
      expect(Renderer.sizeZ[entity]).toBe(1);
      expect(Renderer.color[entity]).toBe(0xffffff);
      expect(Renderer.visible[entity]).toBe(1);
    });
  });

  describe('MainCamera Component', () => {
    it('should create camera entity from XML', () => {
      const xml = `<root><entity main-camera="" transform="pos: 0 10 20" /></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      const cameraEntity = entities[0].entity;
      expect(state.hasComponent(cameraEntity, MainCamera)).toBe(true);
      expect(state.hasComponent(cameraEntity, Transform)).toBe(true);
      expect(Transform.posX[cameraEntity]).toBe(0);
      expect(Transform.posY[cameraEntity]).toBe(10);
      expect(Transform.posZ[cameraEntity]).toBe(20);
    });

    it('should handle multiple cameras', () => {
      const camera1 = state.createEntity();
      const camera2 = state.createEntity();

      state.addComponent(camera1, MainCamera);
      state.addComponent(camera2, MainCamera);

      const cameras = defineQuery([MainCamera])(state.world);
      expect(cameras).toContain(camera1);
      expect(cameras).toContain(camera2);
    });
  });

  describe('Complex Scenes', () => {
    it('should create complete scene with multiple elements', () => {
      const xml = `<root><light></light><entity main-camera="" transform="pos: 0 5 10; euler: -15 0 0" /><entity renderer="shape: box; size: 10 1 10; color: 0x808080" transform="pos: 0 -0.5 0" /><entity renderer="shape: sphere; size: 1; color: 0xff0000" transform="pos: -3 1 0" /><entity renderer="shape: cylinder; size: 1 3 1; color: 0x00ff00" transform="pos: 0 1.5 0" /><entity renderer="shape: box; size: 1.5; color: 0x0000ff" transform="pos: 3 0.75 0" /></root>`;

      const parsed = XMLParser.parse(xml);
      const entities = parseXMLToEntities(state, parsed.root);

      expect(entities.length).toBe(6);

      const lightEntity = entities[0].entity;
      expect(state.hasComponent(lightEntity, Ambient)).toBe(true);
      expect(state.hasComponent(lightEntity, Directional)).toBe(true);

      const cameraEntity = entities[1].entity;
      expect(state.hasComponent(cameraEntity, MainCamera)).toBe(true);
      expect(Transform.posY[cameraEntity]).toBe(5);
      expect(Transform.posZ[cameraEntity]).toBe(10);
      expect(Transform.eulerX[cameraEntity]).toBe(-15);

      const floorEntity = entities[2].entity;
      expect(Renderer.shape[floorEntity]).toBe(0);
      expect(Renderer.sizeX[floorEntity]).toBe(10);
      expect(Renderer.sizeY[floorEntity]).toBe(1);
      expect(Renderer.sizeZ[floorEntity]).toBe(10);
      expect(Renderer.color[floorEntity]).toBe(0x808080);

      const sphereEntity = entities[3].entity;
      expect(Renderer.shape[sphereEntity]).toBe(1);
      expect(Renderer.color[sphereEntity]).toBe(0xff0000);
      expect(Transform.posX[sphereEntity]).toBe(-3);

      const cylinderEntity = entities[4].entity;
      expect(Renderer.shape[cylinderEntity]).toBe(2);
      expect(Renderer.sizeY[cylinderEntity]).toBe(3);
      expect(Renderer.color[cylinderEntity]).toBe(0x00ff00);

      const boxEntity = entities[5].entity;
      expect(Renderer.shape[boxEntity]).toBe(0);
      expect(Renderer.sizeX[boxEntity]).toBe(1.5);
      expect(Renderer.sizeY[boxEntity]).toBe(1.5);
      expect(Renderer.sizeZ[boxEntity]).toBe(1.5);
      expect(Renderer.color[boxEntity]).toBe(0x0000ff);
    });
  });

  describe('Render Context', () => {
    it('should query render context entities', () => {
      const context1 = state.createEntity();
      const context2 = state.createEntity();
      const nonContext = state.createEntity();

      state.addComponent(context1, RenderContext);
      state.addComponent(context2, RenderContext);

      const contexts = defineQuery([RenderContext])(state.world);
      expect(contexts).toContain(context1);
      expect(contexts).toContain(context2);
      expect(contexts).not.toContain(nonContext);
    });

    it('should handle render context with clear color', () => {
      const context = state.createEntity();
      state.addComponent(context, RenderContext);

      RenderContext.clearColor[context] = 0x87ceeb;
      RenderContext.hasCanvas[context] = 0;

      expect(RenderContext.clearColor[context]).toBe(0x87ceeb);
      expect(RenderContext.hasCanvas[context]).toBe(0);

      const mockCanvas = {} as HTMLCanvasElement;
      setCanvasElement(context, mockCanvas);
      RenderContext.hasCanvas[context] = 1;

      expect(RenderContext.hasCanvas[context]).toBe(1);
    });
  });
});
