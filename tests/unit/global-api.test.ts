/* eslint-disable import/no-namespace */
import { defineComponent, Types } from 'bitecs';
import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import * as GAME from 'vibegame';
import { DefaultPlugins } from 'vibegame/defaults';
import { AnimationPlugin } from 'vibegame/animation';
import { InputPlugin } from 'vibegame/input';
import { OrbitCameraPlugin } from 'vibegame/orbit-camera';
import { PhysicsPlugin } from 'vibegame/physics';
import { PlayerPlugin } from 'vibegame/player';
import { RenderingPlugin } from 'vibegame/rendering';
import { RespawnPlugin } from 'vibegame/respawn';
import { StartupPlugin } from 'vibegame/startup';
import { TransformsPlugin } from 'vibegame/transforms';
import { TweenPlugin } from 'vibegame/tweening';

describe('Global API', () => {
  beforeEach(() => {
    GAME.resetBuilder();
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
    global.document = dom.window.document as any;
    global.MutationObserver = dom.window.MutationObserver as any;
    global.requestAnimationFrame = ((cb: any) => setTimeout(cb, 16)) as any;
    global.performance = { now: () => Date.now() } as any;
  });

  it('should export all required functions', () => {
    expect(GAME.withPlugin).toBeDefined();
    expect(GAME.withoutDefaultPlugins).toBeDefined();
    expect(GAME.withSystem).toBeDefined();
    expect(GAME.withComponent).toBeDefined();
    expect(GAME.configure).toBeDefined();
    expect(GAME.run).toBeDefined();
  });

  it('should run with default configuration', async () => {
    const runtime = await GAME.run();
    expect(runtime).toBeDefined();
    expect(runtime.getState).toBeDefined();
    runtime.stop();
  });

  it('should create a new builder for each run call', async () => {
    const runtime1 = await GAME.run();
    const runtime2 = await GAME.run();

    expect(runtime1).not.toBe(runtime2);
    expect(runtime1.getState()).not.toBe(runtime2.getState());

    runtime1.stop();
    runtime2.stop();
  });

  it('should chain withoutDefaultPlugins', async () => {
    const runtime = await GAME.withoutDefaultPlugins().run();
    const state = runtime.getState();

    const transform = state.getComponent('transform');
    const renderer = state.getComponent('renderer');
    expect(transform).toBeUndefined();
    expect(renderer).toBeUndefined();

    runtime.stop();
  });

  it('should chain withPlugin', async () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    const testPlugin = {
      components: { test: TestComponent },
      systems: [],
    };

    const runtime = await GAME.withPlugin(testPlugin).run();
    const state = runtime.getState();

    const test = state.getComponent('test');
    expect(test).toBeDefined();

    runtime.stop();
  });

  it('should chain withSystem', async () => {
    let systemCalled = false;
    const testSystem = {
      update: () => {
        systemCalled = true;
      },
    };

    const runtime = await GAME.withSystem(testSystem).run();
    runtime.step();

    expect(systemCalled).toBe(true);
    runtime.stop();
  });

  it('should chain withComponent', async () => {
    const TestComponent = defineComponent({ value: Types.f32 });

    const runtime = await GAME.withComponent('custom', TestComponent).run();
    const state = runtime.getState();

    const custom = state.getComponent('custom');
    expect(custom).toBe(TestComponent);

    runtime.stop();
  });

  it('should chain configure', async () => {
    const runtime = await GAME.configure({
      autoStart: false,
      dom: false,
    }).run();

    expect(runtime).toBeDefined();
    runtime.stop();
  });

  it('should support complex chaining', async () => {
    const TestComponent = defineComponent({ x: Types.f32 });
    const testPlugin = {
      components: { plugin: defineComponent({ y: Types.f32 }) },
      systems: [],
    };
    const testSystem = {
      update: () => {},
    };

    const runtime = await GAME.withoutDefaultPlugins()
      .withPlugin(testPlugin)
      .withSystem(testSystem)
      .withComponent('test', TestComponent)
      .configure({ canvas: '#game', autoStart: false })
      .run();

    const state = runtime.getState();

    const test = state.getComponent('test');
    const plugin = state.getComponent('plugin');
    const transform = state.getComponent('transform');

    expect(test).toBeDefined();
    expect(plugin).toBeDefined();
    expect(transform).toBeUndefined();

    runtime.stop();
  });

  it('should use the same builder instance until run is called', () => {
    const builder1 = GAME.withoutDefaultPlugins();
    const builder2 = GAME.withPlugin({ components: {}, systems: [] });

    expect(builder1).toBe(builder2);
  });

  it('should handle multiple plugins in sequence', async () => {
    const plugin1 = {
      components: { comp1: defineComponent({ a: Types.f32 }) },
      systems: [],
    };
    const plugin2 = {
      components: { comp2: defineComponent({ b: Types.f32 }) },
      systems: [],
    };

    const runtime = await GAME.withPlugin(plugin1).withPlugin(plugin2).run();

    const state = runtime.getState();

    const comp1 = state.getComponent('comp1');
    const comp2 = state.getComponent('comp2');

    expect(comp1).toBeDefined();
    expect(comp2).toBeDefined();

    runtime.stop();
  });

  it('should handle multiple systems in sequence', async () => {
    let system1Called = false;
    let system2Called = false;

    const system1 = {
      update: () => {
        system1Called = true;
      },
    };
    const system2 = {
      update: () => {
        system2Called = true;
      },
    };

    const runtime = await GAME.withSystem(system1).withSystem(system2).run();

    runtime.step();

    expect(system1Called).toBe(true);
    expect(system2Called).toBe(true);

    runtime.stop();
  });

  it('should handle multiple components in sequence', async () => {
    const Component1 = defineComponent({ x: Types.f32 });
    const Component2 = defineComponent({ y: Types.f32 });

    const runtime = await GAME.withComponent('comp1', Component1)
      .withComponent('comp2', Component2)
      .run();

    const state = runtime.getState();

    const comp1 = state.getComponent('comp1');
    const comp2 = state.getComponent('comp2');

    expect(comp1).toBe(Component1);
    expect(comp2).toBe(Component2);

    runtime.stop();
  });

  it('should handle multiple configure calls', async () => {
    const runtime = await GAME.configure({ canvas: '#game' })
      .configure({ autoStart: false })
      .configure({ dom: false })
      .run();

    expect(runtime).toBeDefined();
    runtime.stop();
  });

  it('should export DefaultPlugins', () => {
    expect(DefaultPlugins).toBeDefined();
    expect(Array.isArray(DefaultPlugins)).toBe(true);
    expect(DefaultPlugins.length).toBeGreaterThan(0);
  });

  it('should export core types and utilities', () => {
    expect(GAME.State).toBeDefined();
    expect(GAME.defineComponent).toBeDefined();
    expect(GAME.Types).toBeDefined();
    expect(GAME.XMLParser).toBeDefined();
    expect(GAME.lerp).toBeDefined();
    expect(GAME.slerp).toBeDefined();
    expect(GAME.toCamelCase).toBeDefined();
    expect(GAME.toKebabCase).toBeDefined();
  });

  it('should export all plugin modules', () => {
    expect(AnimationPlugin).toBeDefined();
    expect(InputPlugin).toBeDefined();
    expect(OrbitCameraPlugin).toBeDefined();
    expect(PhysicsPlugin).toBeDefined();
    expect(PlayerPlugin).toBeDefined();
    expect(RenderingPlugin).toBeDefined();
    expect(RespawnPlugin).toBeDefined();
    expect(StartupPlugin).toBeDefined();
    expect(TransformsPlugin).toBeDefined();
    expect(TweenPlugin).toBeDefined();
  });
});
