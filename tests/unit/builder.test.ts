import { defineComponent, Types } from 'bitecs';
import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, TIME_CONSTANTS } from 'vibegame';

describe('GameBuilder', () => {
  let builder: any;
  let GameBuilder: any;

  beforeEach(async () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
    global.document = dom.window.document as any;
    global.MutationObserver = dom.window.MutationObserver as any;
    global.requestAnimationFrame = ((cb: any) => setTimeout(cb, 16)) as any;
    global.performance = { now: () => Date.now() } as any;

    const builderModule = await import('../../src/builder');
    GameBuilder = builderModule.GameBuilder;
    builder = new GameBuilder();
  });

  it('should create a new builder instance', () => {
    expect(builder).toBeDefined();
    expect(builder).toBeInstanceOf(GameBuilder);
  });

  it('should accept options in constructor', () => {
    const customBuilder = new GameBuilder({
      canvas: '#game-canvas',
      autoStart: false,
      dom: false,
    });
    expect(customBuilder).toBeDefined();
  });

  it('should disable default plugins with withoutDefaultPlugins', () => {
    const result = builder.withoutDefaultPlugins();
    expect(result).toBe(builder);
  });

  it('should add a single plugin with withPlugin', () => {
    const testPlugin = {
      components: {},
      systems: [],
    };

    const result = builder.withPlugin(testPlugin);
    expect(result).toBe(builder);
  });

  it('should add multiple plugins with withPlugins', () => {
    const plugin1 = { components: {}, systems: [] };
    const plugin2 = { components: {}, systems: [] };

    const result = builder.withPlugins(plugin1, plugin2);
    expect(result).toBe(builder);
  });

  it('should add a single system with withSystem', () => {
    const testSystem = {
      update: () => {},
    };

    const result = builder.withSystem(testSystem);
    expect(result).toBe(builder);
  });

  it('should add multiple systems with withSystems', () => {
    const system1 = { update: () => {} };
    const system2 = { update: () => {} };

    const result = builder.withSystems(system1, system2);
    expect(result).toBe(builder);
  });

  it('should register a component with withComponent', () => {
    const TestComponent = defineComponent({
      value: Types.f32,
    });

    const result = builder.withComponent('test', TestComponent);
    expect(result).toBe(builder);
  });

  it('should add a recipe with withRecipe', () => {
    const recipe = {
      name: 'enemy',
      components: ['transform', 'health'],
    };

    const result = builder.withRecipe(recipe);
    expect(result).toBe(builder);
  });

  it('should add config with withConfig', () => {
    const config = {
      defaults: {
        test: { value: 0 },
      },
    };

    const result = builder.withConfig(config);
    expect(result).toBe(builder);
  });

  it('should configure options with configure', () => {
    const result = builder.configure({
      canvas: '#game',
      autoStart: false,
    });
    expect(result).toBe(builder);
  });

  it('should merge options when configure is called multiple times', () => {
    builder.configure({ canvas: '#game' }).configure({ autoStart: false });

    const runtime = builder.build();
    expect(runtime).toBeDefined();
  });

  it('should support method chaining', () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    const testPlugin = { components: {}, systems: [] };
    const testSystem = { update: () => {} };
    const testRecipe = { name: 'test', components: [] };
    const testConfig = { defaults: {} };

    const result = builder
      .withoutDefaultPlugins()
      .withPlugin(testPlugin)
      .withSystem(testSystem)
      .withComponent('test', TestComponent)
      .withRecipe(testRecipe)
      .withConfig(testConfig)
      .configure({ canvas: '#game' });

    expect(result).toBe(builder);
  });

  it('should build a GameRuntime instance', () => {
    const runtime = builder.build();
    expect(runtime).toBeDefined();
    expect(runtime.getState).toBeDefined();
    expect(runtime.start).toBeDefined();
    expect(runtime.stop).toBeDefined();
    expect(runtime.step).toBeDefined();
  });

  it('should build and run a GameRuntime instance', async () => {
    const runtime = await builder.run();
    expect(runtime).toBeDefined();
    expect(runtime.getState).toBeDefined();
    runtime.stop();
  });

  it('should register plugins with state when building', () => {
    let pluginRegistered = false;
    const testPlugin = {
      components: {},
      systems: [
        {
          setup: () => {
            pluginRegistered = true;
          },
        },
      ],
    };

    builder.withPlugin(testPlugin);
    const runtime = builder.build();
    const state = runtime.getState();

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    expect(pluginRegistered).toBe(true);
  });

  it('should register systems with state when building', () => {
    let systemCalled = false;
    const testSystem = {
      update: () => {
        systemCalled = true;
      },
    };

    builder.withSystem(testSystem);
    const runtime = builder.build();
    const state = runtime.getState();

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    expect(systemCalled).toBe(true);
  });

  it('should register components with state when building', () => {
    const TestComponent = defineComponent({ value: Types.f32 });

    builder.withComponent('test-component', TestComponent);
    const runtime = builder.build();
    const state = runtime.getState();

    const registeredComponent = state.getComponent('test-component');
    expect(registeredComponent).toBe(TestComponent);

    const componentNames = state.getComponentNames();
    expect(componentNames).toContain('test-component');
  });

  it('should register recipes with state when building', () => {
    const recipe = {
      name: 'player',
      components: ['transform'],
    };

    builder.withRecipe(recipe);
    const runtime = builder.build();
    const state = runtime.getState();

    const playerRecipe = state.getRecipe('player');
    expect(playerRecipe).toBeDefined();
    expect(playerRecipe?.components).toEqual(['transform']);

    const recipeNames = state.getRecipeNames();
    expect(recipeNames.has('player')).toBe(true);
  });

  it('should register config with state when building', () => {
    const config = {
      defaults: {
        'test-component': { value: 42 },
      },
    };

    builder.withConfig(config);
    const runtime = builder.build();
    const state = runtime.getState() as State;

    const defaults = state.config.getDefaults('test-component');
    expect(defaults).toEqual({ value: 42 });
  });

  it('should include default plugins by default', () => {
    const runtime = builder.build();
    const state = runtime.getState();

    const transform = state.getComponent('transform');
    const renderer = state.getComponent('renderer');
    expect(transform).toBeDefined();
    expect(renderer).toBeDefined();
  });

  it('should exclude default plugins when withoutDefaultPlugins is called', () => {
    builder.withoutDefaultPlugins();
    const runtime = builder.build();
    const state = runtime.getState();

    const transform = state.getComponent('transform');
    const renderer = state.getComponent('renderer');
    expect(transform).toBeUndefined();
    expect(renderer).toBeUndefined();
  });

  it('should handle complex plugin with all features', () => {
    const ComplexComponent = defineComponent({
      x: Types.f32,
      y: Types.f32,
    });

    let systemSetupCalled = false;
    let systemUpdateCalled = false;

    const complexPlugin = {
      components: {
        complex: ComplexComponent,
      },
      systems: [
        {
          setup: () => {
            systemSetupCalled = true;
          },
          update: () => {
            systemUpdateCalled = true;
          },
        },
      ],
      recipes: [
        {
          name: 'complex-entity',
          components: ['complex'],
          overrides: { 'complex.x': 10, 'complex.y': 20 },
        },
      ],
      config: {
        defaults: {
          complex: { x: 0, y: 0 },
        },
      },
    };

    builder.withPlugin(complexPlugin);
    const runtime = builder.build();
    const state = runtime.getState();

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(systemSetupCalled).toBe(true);
    expect(systemUpdateCalled).toBe(true);

    const complexComponent = state.getComponent('complex');
    expect(complexComponent).toBeDefined();

    const complexRecipe = state.getRecipe('complex-entity');
    expect(complexRecipe).toBeDefined();
    expect(complexRecipe?.overrides).toEqual({
      'complex.x': 10,
      'complex.y': 20,
    });
  });
});
