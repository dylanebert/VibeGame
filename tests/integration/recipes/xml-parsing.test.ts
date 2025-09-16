import { defineComponent, Types } from 'bitecs';
import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, XMLParser } from 'vibegame';
import { parseXMLToEntities } from 'vibegame';

describe('XML Recipe Integration', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
  });

  it('should create entities from XML', () => {
    const xml = '<root><entity></entity></root>';
    const parsed = XMLParser.parse(xml);

    const entities = parseXMLToEntities(state, parsed.root);
    expect(entities.length).toBe(1);
    expect(entities[0].entity).toBeGreaterThanOrEqual(0);
  });

  it('should handle nested entities with parent-child relationships', () => {
    const Transform = defineComponent({
      posX: Types.f32,
      posY: Types.f32,
      posZ: Types.f32,
    });
    const Parent = defineComponent({
      entity: Types.i32,
    });

    state.registerComponent('transform', Transform);
    state.registerComponent('parent', Parent);

    const xml = `
      <root>
        <entity>
          <entity></entity>
          <entity></entity>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);

    expect(entities.length).toBe(1);
    expect(entities[0].children.length).toBe(2);

    const parentEntity = entities[0].entity;
    const childEntity1 = entities[0].children[0].entity;
    const childEntity2 = entities[0].children[1].entity;

    expect(state.hasComponent(parentEntity, Parent)).toBe(false);

    expect(state.hasComponent(childEntity1, Parent)).toBe(true);
    expect(Parent.entity[childEntity1]).toBe(parentEntity);

    expect(state.hasComponent(childEntity2, Parent)).toBe(true);
    expect(Parent.entity[childEntity2]).toBe(parentEntity);

    expect(state.hasComponent(parentEntity, Transform)).toBe(true);
    expect(state.hasComponent(childEntity1, Transform)).toBe(true);
    expect(state.hasComponent(childEntity2, Transform)).toBe(true);
  });

  it('should use custom recipes from XML', () => {
    const Component = defineComponent({ x: Types.f32 });

    state.registerComponent('position', Component);
    state.registerRecipe({
      name: 'thing',
      components: ['position'],
      overrides: { 'position.x': 100 },
    });

    const xml = '<root><thing></thing></root>';
    const parsed = XMLParser.parse(xml);

    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Component)).toBe(true);
    expect(Component.x[entity]).toBe(100);
  });

  it('should apply component attributes with CSS-style syntax', () => {
    const TestComponent = defineComponent({
      value: Types.f32,
      posX: Types.f32,
      posY: Types.f32,
      posZ: Types.f32,
    });

    state.registerComponent('test', TestComponent);
    state.registerRecipe({
      name: 'entity',
      components: [],
    });

    const xml = '<root><entity test="value: 42; pos: 1 2 3"></entity></root>';
    const parsed = XMLParser.parse(xml);

    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, TestComponent)).toBe(true);
    expect(TestComponent.value[entity]).toBe(42);
    expect(TestComponent.posX[entity]).toBe(1);
    expect(TestComponent.posY[entity]).toBe(2);
    expect(TestComponent.posZ[entity]).toBe(3);
  });

  it('should apply dot notation attributes from XML', () => {
    const TestComponent = defineComponent({
      value: Types.f32,
    });

    state.registerComponent('test', TestComponent);
    state.registerRecipe({
      name: 'entity',
      components: ['test'],
    });

    const xml = '<root><entity test.value="42"></entity></root>';
    const parsed = XMLParser.parse(xml);

    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, TestComponent)).toBe(true);
    expect(TestComponent.value[entity]).toBe(42);
  });

  it('should process child elements with parsers', () => {
    let parserCalled = false;
    let parentEntity = -1;

    state.registerConfig({
      parsers: {
        custom: (parent, _element, _state) => {
          parserCalled = true;
          parentEntity = parent;
          return null;
        },
      },
    });

    const xml = `
      <root>
        <entity>
          <custom></custom>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);

    expect(parserCalled).toBe(true);
    expect(parentEntity).toBe(entities[0].entity);
  });

  it('should expand component shorthands when component is present', () => {
    const Renderer = defineComponent({
      sizeX: Types.f32,
      sizeY: Types.f32,
      sizeZ: Types.f32,
      shape: Types.i8,
    });

    state.registerComponent('renderer', Renderer);
    state.registerConfig({
      shorthands: {
        renderer: {
          size: 'size',
          shape: 'shape',
        },
      },
      defaults: {
        renderer: {
          sizeX: 1,
          sizeY: 1,
          sizeZ: 1,
          shape: 0,
        },
      },
    });

    const xml =
      '<root><entity size="2 3 4" renderer="shape: 1"></entity></root>';
    const parsed = XMLParser.parse(xml);

    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Renderer)).toBe(true);
    expect(Renderer.sizeX[entity]).toBe(2);
    expect(Renderer.sizeY[entity]).toBe(3);
    expect(Renderer.sizeZ[entity]).toBe(4);
    expect(Renderer.shape[entity]).toBe(1);
  });

  it('should auto-expand shorthands only for present components', () => {
    const Renderer = defineComponent({
      sizeX: Types.f32,
      sizeY: Types.f32,
      sizeZ: Types.f32,
    });

    state.registerComponent('renderer', Renderer);

    const xml = '<root><entity renderer="" size="2 3 4"></entity></root>';
    const parsed = XMLParser.parse(xml);

    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Renderer)).toBe(true);
    expect(Renderer.sizeX[entity]).toBe(2);
    expect(Renderer.sizeY[entity]).toBe(3);
    expect(Renderer.sizeZ[entity]).toBe(4);
  });

  it('should warn about unknown attributes for components registered after XML parsing', () => {
    const consoleWarnSpy = console.warn;
    let warning = '';
    console.warn = (msg: string) => {
      warning = msg;
    };

    const xml = '<root><entity my-component="10"></entity></root>';
    const parsed = XMLParser.parse(xml);

    parseXMLToEntities(state, parsed.root);

    expect(warning).toContain('Unknown attribute "my-component"');
    expect(warning).toContain('[entity]');

    const MyComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('my-component', MyComponent);
    state.registerConfig({
      defaults: {
        'my-component': { value: 0 },
      },
    });

    warning = '';
    const xml2 = '<root><entity my-component="value: 20"></entity></root>';
    const parsed2 = XMLParser.parse(xml2);
    const entities = parseXMLToEntities(state, parsed2.root);

    expect(warning).toBe('');
    expect(state.hasComponent(entities[0].entity, MyComponent)).toBe(true);
    expect(MyComponent.value[entities[0].entity]).toBe(20);

    console.warn = consoleWarnSpy;
  });

  it('should handle component registration before and after recipe registration', () => {
    const MyComponent = defineComponent({ value: Types.f32 });

    const xml = '<root><entity my-component="value: 42"></entity></root>';
    const parsed = XMLParser.parse(xml);

    const consoleWarnSpy = console.warn;
    let warning = '';
    console.warn = (msg: string) => {
      warning = msg;
    };

    parseXMLToEntities(state, parsed.root);
    expect(warning).toContain('Unknown attribute "my-component"');

    state.registerComponent('my-component', MyComponent);

    warning = '';
    const parsed2 = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed2.root);

    expect(warning).toBe('');
    expect(state.hasComponent(entities[0].entity, MyComponent)).toBe(true);
    expect(MyComponent.value[entities[0].entity]).toBe(42);

    console.warn = consoleWarnSpy;
  });

  it('should handle vector broadcast for single values', () => {
    const Transform = defineComponent({
      scaleX: Types.f32,
      scaleY: Types.f32,
      scaleZ: Types.f32,
    });

    state.registerComponent('transform', Transform);
    state.registerConfig({
      defaults: {
        transform: {
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
        },
      },
    });

    const xml = '<root><entity transform="scale: 2"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.scaleX[entity]).toBe(2);
    expect(Transform.scaleY[entity]).toBe(2);
    expect(Transform.scaleZ[entity]).toBe(2);
  });

  it('should convert euler angles to quaternion', () => {
    const Transform = defineComponent({
      rotX: Types.f32,
      rotY: Types.f32,
      rotZ: Types.f32,
      rotW: Types.f32,
      eulerX: Types.f32,
      eulerY: Types.f32,
      eulerZ: Types.f32,
    });

    state.registerComponent('transform', Transform);
    state.registerConfig({
      defaults: {
        transform: {
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          rotW: 1,
          eulerX: 0,
          eulerY: 0,
          eulerZ: 0,
        },
      },
    });

    const xml = '<root><entity transform="euler: 0 90 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.eulerX[entity]).toBe(0);
    expect(Transform.eulerY[entity]).toBe(90);
    expect(Transform.eulerZ[entity]).toBe(0);
    expect(Transform.rotX[entity]).toBeCloseTo(0, 5);
    expect(Transform.rotY[entity]).toBeCloseTo(0.7071, 3);
    expect(Transform.rotZ[entity]).toBeCloseTo(0, 5);
    expect(Transform.rotW[entity]).toBeCloseTo(0.7071, 3);
  });

  it('should handle rotation as alias for euler', () => {
    const Transform = defineComponent({
      rotX: Types.f32,
      rotY: Types.f32,
      rotZ: Types.f32,
      rotW: Types.f32,
      eulerX: Types.f32,
      eulerY: Types.f32,
      eulerZ: Types.f32,
    });

    state.registerComponent('transform', Transform);
    state.registerConfig({
      defaults: {
        transform: {
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          rotW: 1,
          eulerX: 0,
          eulerY: 0,
          eulerZ: 0,
        },
      },
    });

    const xml = '<root><entity transform="rotation: 0 90 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.eulerY[entity]).toBe(90);
    expect(Transform.rotY[entity]).toBeCloseTo(0.7071, 3);
    expect(Transform.rotW[entity]).toBeCloseTo(0.7071, 3);
  });

  it('should parse multiple properties in component string', () => {
    const Transform = defineComponent({
      posX: Types.f32,
      posY: Types.f32,
      posZ: Types.f32,
      rotX: Types.f32,
      rotY: Types.f32,
      rotZ: Types.f32,
      rotW: Types.f32,
      eulerX: Types.f32,
      eulerY: Types.f32,
      eulerZ: Types.f32,
      scaleX: Types.f32,
      scaleY: Types.f32,
      scaleZ: Types.f32,
    });

    state.registerComponent('transform', Transform);
    state.registerConfig({
      defaults: {
        transform: {
          posX: 0,
          posY: 0,
          posZ: 0,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          rotW: 1,
          eulerX: 0,
          eulerY: 0,
          eulerZ: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
        },
      },
    });

    const xml =
      '<root><entity transform="pos: 0 5 0; euler: 0 45 0; scale: 1.5"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.posX[entity]).toBe(0);
    expect(Transform.posY[entity]).toBe(5);
    expect(Transform.posZ[entity]).toBe(0);
    expect(Transform.eulerY[entity]).toBe(45);
    expect(Transform.rotY[entity]).toBeCloseTo(0.3827, 3);
    expect(Transform.rotW[entity]).toBeCloseTo(0.9239, 3);
    expect(Transform.scaleX[entity]).toBe(1.5);
    expect(Transform.scaleY[entity]).toBe(1.5);
    expect(Transform.scaleZ[entity]).toBe(1.5);
  });

  it('should handle enum values in body component', () => {
    const Body = defineComponent({
      type: Types.i8,
    });

    state.registerComponent('body', Body);
    state.registerConfig({
      enums: {
        body: {
          type: {
            static: 0,
            dynamic: 1,
            kinematic: 2,
          },
        },
      },
      defaults: {
        body: {
          type: 0,
        },
      },
    });

    const xml = '<root><entity body="type: dynamic"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Body)).toBe(true);
    expect(Body.type[entity]).toBe(1);
  });

  it('should demonstrate order-of-operations issue from example/index.html', () => {
    const consoleWarnSpy = console.warn;
    let warning = '';
    console.warn = (msg: string) => {
      warning = msg;
    };

    const xml = '<root><entity my-component="10"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    expect(warning).toContain('[entity] Unknown attribute "my-component"');
    expect(warning).toContain('Available: id, parent');

    const MyComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('my-component', MyComponent);
    state.registerConfig({
      defaults: {
        'my-component': { value: 0 },
      },
    });

    warning = '';
    const xml2 = '<root><entity my-component="value: 10"></entity></root>';
    const parsed2 = XMLParser.parse(xml2);
    const entities = parseXMLToEntities(state, parsed2.root);

    expect(warning).toBe('');
    expect(state.hasComponent(entities[0].entity, MyComponent)).toBe(true);
    expect(MyComponent.value[entities[0].entity]).toBe(10);

    console.warn = consoleWarnSpy;
  });
});
