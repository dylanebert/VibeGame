/* eslint-disable import/no-namespace */
import { defineComponent, Types } from 'bitecs';
import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import * as GAME from 'vibegame';

describe('Builder-Runtime Integration', () => {
  beforeEach(() => {
    GAME.resetBuilder();
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
    global.document = dom.window.document as any;
    global.window = dom.window as any;
    global.MutationObserver = dom.window.MutationObserver as any;
    global.Node = dom.window.Node as any;
    global.HTMLElement = dom.window.HTMLElement as any;
    global.requestAnimationFrame = ((cb: any) => setTimeout(cb, 16)) as any;
    global.performance = { now: () => Date.now() } as any;
  });

  describe('Basic Usage Example', () => {
    it('should run with simple defaults', async () => {
      const runtime = await GAME.run();

      expect(runtime).toBeDefined();
      expect(runtime.getState).toBeDefined();
      expect(runtime.start).toBeDefined();
      expect(runtime.stop).toBeDefined();
      expect(runtime.step).toBeDefined();

      const state = runtime.getState();

      expect(state.getComponent('transform')).toBeDefined();
      expect(state.getComponent('renderer')).toBeDefined();
      expect(state.getComponent('body')).toBeDefined();

      runtime.stop();
    });
  });

  describe('Custom Configuration Example', () => {
    it('should configure without defaults', async () => {
      const MyCustomPlugin: GAME.Plugin = {
        components: {
          custom: defineComponent({ value: Types.f32 }),
        },
        systems: [
          {
            update: () => {},
          },
        ],
      };

      document.body.innerHTML = '<canvas id="game-canvas"></canvas>';

      const runtime = await GAME.withoutDefaultPlugins()
        .withPlugin(GAME.RenderingPlugin)
        .withPlugin(GAME.PhysicsPlugin)
        .withPlugin(MyCustomPlugin)
        .configure({
          canvas: '#game-canvas',
          autoStart: true,
        })
        .run();

      const state = runtime.getState();

      expect(state.getComponent('transform')).toBeUndefined();
      expect(state.getComponent('renderer')).toBeDefined();
      expect(state.getComponent('body')).toBeDefined();
      expect(state.getComponent('custom')).toBeDefined();

      expect(state.getComponent('animation-mixer')).toBeUndefined();
      expect(state.getComponent('input')).toBeUndefined();

      runtime.stop();
    });
  });

  describe('Complex Configuration Example', () => {
    it('should configure with multiple components and systems', async () => {
      const HealthComponent = defineComponent({ value: Types.f32 });
      const EnemyComponent = defineComponent({ type: Types.ui8 });

      let customSystemCalled = false;
      const CustomSystem: GAME.System = {
        update: () => {
          customSystemCalled = true;
        },
      };

      const CustomPlugin: GAME.Plugin = {
        components: {
          enemy: EnemyComponent,
        },
        systems: [],
      };

      document.body.innerHTML = '<canvas id="game"></canvas>';

      const runtime = await GAME.withPlugin(CustomPlugin)
        .withSystem(CustomSystem)
        .withComponent('health', HealthComponent)
        .configure({ canvas: '#game' })
        .run();

      const state = runtime.getState();

      expect(state.getComponent('health')).toBe(HealthComponent);
      expect(state.getComponent('enemy')).toBeDefined();

      runtime.stop();
      runtime.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);
      expect(customSystemCalled).toBe(true);
    });
  });

  describe('Custom Plugin Example', () => {
    it('should create and use custom plugin', async () => {
      const MyPlugin: GAME.Plugin = {
        components: {
          MyComponent: GAME.defineComponent({
            value: GAME.Types.f32,
          }),
        },
        systems: [
          {
            update: (state) => {
              const MyComponent = state.getComponent('MyComponent');
              if (!MyComponent) return;

              const entities = GAME.defineQuery([MyComponent])(state.world);
              for (const eid of entities) {
                (MyComponent as any).value[eid] += state.time.deltaTime;
              }
            },
          },
        ],
        config: {
          defaults: {
            MyComponent: { value: 0 },
          },
        },
      };

      const runtime = await GAME.withoutDefaultPlugins()
        .withPlugin(MyPlugin)
        .run();

      const state = runtime.getState();
      const MyComponent = state.getComponent('MyComponent');

      expect(MyComponent).toBeDefined();
      if (!MyComponent) throw new Error('MyComponent not found');

      const entity = state.createEntity();
      state.addComponent(entity, MyComponent);
      (MyComponent as any).value[entity] = 0;

      expect((MyComponent as any).value[entity]).toBe(0);

      runtime.step(0.5);

      expect((MyComponent as any).value[entity]).toBeCloseTo(0.5, 5);

      runtime.stop();
    });
  });

  describe('XML World Processing', () => {
    it('should process declarative XML entities', async () => {
      const TestComponent = defineComponent({
        x: Types.f32,
        y: Types.f32,
      });

      const state = new GAME.State();
      state.registerPlugin(GAME.RecipePlugin);
      state.registerPlugin(GAME.TransformsPlugin);
      state.registerComponent('test', TestComponent);
      state.registerRecipe({
        name: 'entity',
        components: ['transform', 'test'],
      });

      document.body.innerHTML = `
        <canvas id="game"></canvas>
        <world canvas="#game">
          <entity transform="pos: 10 20 30" test="x: 5; y: 10">
            <entity transform="pos: 1 2 3"></entity>
          </entity>
        </world>
      `;

      const { GameRuntime } = await import('../../src/runtime');
      const runtime = new GameRuntime(state, { canvas: '#game' });
      await runtime.start();

      const Transform = state.getComponent('transform');
      if (!Transform) throw new Error('Transform component not found');
      const entities = GAME.defineQuery([Transform])(state.world);

      expect(entities.length).toBe(2);

      const testEntities = GAME.defineQuery([TestComponent])(state.world);
      expect(testEntities.length).toBeGreaterThan(0);

      const parentEntity = testEntities.find((e) => TestComponent.x[e] === 5);
      expect(parentEntity).toBeDefined();
      if (parentEntity !== undefined) {
        expect(TestComponent.x[parentEntity]).toBe(5);
        expect(TestComponent.y[parentEntity]).toBe(10);
      }

      runtime.stop();
    });
  });

  describe('Complete Integration Flow', () => {
    it('should handle full game setup with all features', async () => {
      let frameCount = 0;
      let setupCalled = false;
      let cleanupCalled = false;

      const GameComponent = defineComponent({
        score: Types.ui32,
        lives: Types.ui8,
      });

      const GameSystem: GAME.System = {
        setup: () => {
          setupCalled = true;
        },
        update: () => {
          frameCount++;
        },
        dispose: () => {
          cleanupCalled = true;
        },
      };

      const GamePlugin: GAME.Plugin = {
        components: {
          game: GameComponent,
        },
        systems: [GameSystem],
        recipes: [
          {
            name: 'player',
            components: ['transform', 'game'],
            overrides: {
              'game.lives': 3,
              'game.score': 0,
            },
          },
        ],
        config: {
          defaults: {
            game: {
              score: 0,
              lives: 1,
            },
          },
        },
      };

      document.body.innerHTML = `
        <canvas id="game-canvas"></canvas>
        <world canvas="#game-canvas" sky="#87CEEB">
          <player transform="pos: 0 0 0"></player>
        </world>
      `;

      const runtime = await GAME.withoutDefaultPlugins()
        .withPlugin(GAME.RecipePlugin)
        .withPlugin(GAME.TransformsPlugin)
        .withPlugin(GamePlugin)
        .configure({
          canvas: '#game-canvas',
          autoStart: false,
          dom: true,
        })
        .run();

      expect(setupCalled).toBe(true);

      const state = runtime.getState();
      const playerEntities = GAME.defineQuery([GameComponent])(state.world);
      expect(playerEntities.length).toBe(1);

      const player = playerEntities[0];
      expect(GameComponent.lives[player]).toBe(3);
      expect(GameComponent.score[player]).toBe(0);

      const initialFrameCount = frameCount;
      runtime.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);
      runtime.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);
      expect(frameCount - initialFrameCount).toBe(2);

      runtime.stop();

      state.dispose();
      expect(cleanupCalled).toBe(true);
    });
  });

  describe('Plugin Order and Dependencies', () => {
    it('should maintain plugin registration order', async () => {
      const order: string[] = [];

      const Plugin1: GAME.Plugin = {
        components: {},
        systems: [
          {
            setup: () => {
              order.push('plugin1');
            },
          },
        ],
      };

      const Plugin2: GAME.Plugin = {
        components: {},
        systems: [
          {
            setup: () => {
              order.push('plugin2');
            },
          },
        ],
      };

      const Plugin3: GAME.Plugin = {
        components: {},
        systems: [
          {
            setup: () => {
              order.push('plugin3');
            },
          },
        ],
      };

      const runtime = await GAME.withoutDefaultPlugins()
        .withPlugin(Plugin1)
        .withPlugin(Plugin2)
        .withPlugin(Plugin3)
        .run();

      runtime.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(order).toEqual(['plugin1', 'plugin2', 'plugin3']);

      runtime.stop();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid XML gracefully', async () => {
      document.body.innerHTML = `
        <world>
          <unknown-element transform="invalid syntax">
            <unclosed>
          </unknown-element>
        </world>
      `;

      let errorLogged = false;
      const originalError = console.error;
      console.error = () => {
        errorLogged = true;
      };

      try {
        const runtime = await GAME.run();
        runtime.stop();
      } catch {
        errorLogged = true;
      }

      expect(errorLogged).toBe(true);

      console.error = originalError;
    });

    it('should handle missing canvas selector', async () => {
      document.body.innerHTML = '';

      const runtime = await GAME.configure({ dom: false }).run();
      expect(runtime).toBeDefined();
      runtime.stop();
    });
  });

  describe('Manual Runtime Control', () => {
    it('should allow manual stepping without auto-start', async () => {
      let frameCount = 0;

      const CounterSystem: GAME.System = {
        update: () => {
          frameCount++;
        },
      };

      const runtime = await GAME.withSystem(CounterSystem)
        .configure({ autoStart: false })
        .run();

      const initialCount = frameCount;

      runtime.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);
      expect(frameCount).toBe(initialCount + 1);

      runtime.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);
      expect(frameCount).toBe(initialCount + 2);

      runtime.step(GAME.TIME_CONSTANTS.DEFAULT_DELTA);
      expect(frameCount).toBe(initialCount + 3);

      runtime.stop();
    });
  });

  describe('Multiple Runtime Instances', () => {
    it('should support multiple independent runtimes', async () => {
      document.body.innerHTML = '';

      let runtime1UpdateCount = 0;
      let runtime2UpdateCount = 0;

      const System1: GAME.System = {
        update: () => {
          runtime1UpdateCount++;
        },
      };

      const System2: GAME.System = {
        update: () => {
          runtime2UpdateCount++;
        },
      };

      const runtime1 = await GAME.withoutDefaultPlugins()
        .withSystem(System1)
        .configure({ autoStart: false, dom: false })
        .run();

      const initial1 = runtime1UpdateCount;

      const runtime2 = await GAME.withoutDefaultPlugins()
        .withSystem(System2)
        .configure({ autoStart: false, dom: false })
        .run();

      const initial2 = runtime2UpdateCount;

      runtime1.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);
      runtime1.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);

      runtime2.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(runtime1UpdateCount).toBeGreaterThanOrEqual(initial1 + 2);
      expect(runtime2UpdateCount).toBeGreaterThanOrEqual(initial2 + 1);

      runtime1.stop();
      runtime2.stop();
    });
  });
});
