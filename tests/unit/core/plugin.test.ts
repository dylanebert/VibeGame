import { beforeEach, describe, expect, it } from 'bun:test';
import { defineComponent, Types } from 'bitecs';
import type { ParsedElement, Plugin } from 'vibegame';
import { State, TIME_CONSTANTS } from 'vibegame';

describe('Plugin System', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
  });

  it('should register plugin components', () => {
    const TestComponent = defineComponent({
      value: Types.f32,
    });

    const plugin: Plugin = {
      components: {
        TestComponent,
      },
    };

    state.registerPlugin(plugin);

    const entity = state.createEntity();
    state.addComponent(entity, TestComponent);
    expect(state.hasComponent(entity, TestComponent)).toBe(true);
  });

  it('should register plugin systems', () => {
    let systemRan = false;

    const plugin: Plugin = {
      systems: [
        {
          group: 'simulation',
          update: () => {
            systemRan = true;
          },
        },
      ],
    };

    state.registerPlugin(plugin);
    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(systemRan).toBe(true);
  });

  it('should register plugin parsers', () => {
    const testParser = () => null;

    const plugin: Plugin = {
      config: {
        parsers: {
          'test-element': testParser,
        },
      },
    };

    state.registerPlugin(plugin);

    const parser = state.getParser('test-element');
    expect(parser).toBe(testParser);
  });

  it('should register plugin with complete config', () => {
    const Health = defineComponent({
      current: Types.f32,
      max: Types.f32,
    });

    const plugin: Plugin = {
      components: { health: Health },
      recipes: [
        {
          name: 'enemy',
          components: ['health'],
          overrides: { 'health.max': 50 },
        },
      ],
      config: {
        defaults: {
          health: { current: 100, max: 100 },
        },
        enums: {
          health: {
            difficulty: { easy: 50, normal: 100, hard: 200 },
          },
        },
        validations: [],
      },
    };

    state.registerPlugin(plugin);

    const entity = state.createEntity();
    state.addComponent(entity, Health);
    expect(Health.current[entity]).toBe(100);
    expect(Health.max[entity]).toBe(100);

    const recipe = state.getRecipe('enemy');
    expect(recipe).toBeDefined();
    expect(recipe?.overrides?.['health.max']).toBe(50);
  });

  it('should register complete plugins', () => {
    const Component = defineComponent({ x: Types.f32 });
    let systemRan = false;

    const plugin: Plugin = {
      components: { Component },
      systems: [
        {
          group: 'simulation',
          update: () => {
            systemRan = true;
          },
        },
      ],
      config: {
        parsers: {
          element: () => null,
        },
      },
    };

    state.registerPlugin(plugin);

    const entity = state.createEntity();
    state.addComponent(entity, Component);
    expect(state.hasComponent(entity, Component)).toBe(true);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    expect(systemRan).toBe(true);

    expect(state.getParser('element')).toBeDefined();
  });

  it('should register custom parser via plugin config', () => {
    let parserCalled = false;
    let parentEntity = -1;
    let elementReceived: any = null;
    let stateReceived: any = null;

    const customParser = (entity: number, element: any, state: any) => {
      parserCalled = true;
      parentEntity = entity;
      elementReceived = element;
      stateReceived = state;
    };

    const plugin: Plugin = {
      config: {
        parsers: {
          'my-tag': customParser,
        },
      },
    };

    state.registerPlugin(plugin);

    const parser = state.getParser('my-tag');
    expect(parser).toBe(customParser);

    const testEntity = 42;
    const testElement: ParsedElement = {
      tagName: 'my-tag',
      attributes: {},
      children: [],
    };
    parser?.(testEntity, testElement, state);

    expect(parserCalled).toBe(true);
    expect(parentEntity).toBe(testEntity);
    expect(elementReceived).toBe(testElement);
    expect(stateReceived).toBe(state);
  });
});
