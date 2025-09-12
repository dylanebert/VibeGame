import { Types, defineComponent } from 'bitecs';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, TIME_CONSTANTS, defineQuery } from 'vibegame';

describe('GameRuntime', () => {
  let runtime: any;
  let state: State;
  let dom: JSDOM;
  let GameRuntime: any;

  beforeEach(async () => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
    global.document = dom.window.document as any;
    global.window = dom.window as any;
    global.MutationObserver = dom.window.MutationObserver as any;
    global.Node = dom.window.Node as any;
    global.HTMLElement = dom.window.HTMLElement as any;
    global.requestAnimationFrame = ((cb: any) => setTimeout(cb, 16)) as any;
    global.performance = { now: () => Date.now() } as any;

    const runtimeModule = await import('../../src/runtime');
    GameRuntime = runtimeModule.GameRuntime;
    state = new State();
    runtime = new GameRuntime(state);
  });

  afterEach(() => {
    runtime.stop();
  });

  it('should create a runtime instance', () => {
    expect(runtime).toBeDefined();
    expect(runtime).toBeInstanceOf(GameRuntime);
  });

  it('should accept options in constructor', () => {
    const customRuntime = new GameRuntime(state, {
      canvas: '#game',
      autoStart: false,
      dom: false,
    });
    expect(customRuntime).toBeDefined();
  });

  it('should start the runtime', async () => {
    await runtime.start();
    expect(true).toBe(true);
  });

  it('should not start twice', async () => {
    await runtime.start();
    await runtime.start();
    expect(true).toBe(true);
  });

  it('should stop the runtime', async () => {
    await runtime.start();
    runtime.stop();
    expect(true).toBe(true);
  });

  it('should step the simulation', () => {
    let updateCalled = false;
    state.registerSystem({
      update: () => {
        updateCalled = true;
      },
    });

    runtime.step();
    expect(updateCalled).toBe(true);
  });

  it('should step with custom delta time', () => {
    let receivedDelta = 0;
    state.registerSystem({
      update: (state) => {
        receivedDelta = state.time.deltaTime;
      },
    });

    runtime.step(TIME_CONSTANTS.DEFAULT_DELTA * 2);
    expect(receivedDelta).toBe(TIME_CONSTANTS.DEFAULT_DELTA * 2);
  });

  it('should step with default delta time', () => {
    let receivedDelta = 0;
    state.registerSystem({
      update: (state) => {
        receivedDelta = state.time.deltaTime;
      },
    });

    runtime.step();
    expect(receivedDelta).toBeGreaterThan(0);
  });

  it('should return the state', () => {
    const returnedState = runtime.getState();
    expect(returnedState).toBe(state);
  });

  it('should start animation loop when autoStart is true', async () => {
    let frameCount = 0;
    state.registerSystem({
      update: () => {
        frameCount++;
      },
    });

    const autoRuntime = new GameRuntime(state, { autoStart: true });
    await autoRuntime.start();

    await new Promise((resolve) => setTimeout(resolve, 50));
    autoRuntime.stop();

    expect(frameCount).toBeGreaterThan(0);
  });

  it('should not start animation loop when autoStart is false', async () => {
    let frameCount = 0;
    state.registerSystem({
      update: () => {
        frameCount++;
      },
    });

    const noAutoRuntime = new GameRuntime(state, { autoStart: false });
    await noAutoRuntime.start();
    const initialFrameCount = frameCount;

    await new Promise((resolve) => setTimeout(resolve, 50));
    noAutoRuntime.stop();

    expect(frameCount).toBe(initialFrameCount);
  });

  it('should not process DOM when dom is false', async () => {
    document.body.innerHTML = '<world></world>';

    const noDomRuntime = new GameRuntime(state, { dom: false });
    await noDomRuntime.start();

    const worldElement = document.querySelector('world') as HTMLElement;
    expect(worldElement?.style.display).not.toBe('none');

    noDomRuntime.stop();
  });

  it('should process world elements in DOM', async () => {
    document.body.innerHTML = '<world></world>';

    state.registerRecipe({ name: 'world', components: [] });
    await runtime.start();

    const worldElement = document.querySelector('world') as HTMLElement;
    expect(worldElement?.style.display).toBe('none');
  });

  it('should process world element with canvas attribute', async () => {
    document.body.innerHTML = `
      <canvas id="game-canvas"></canvas>
      <world canvas="#game-canvas"></world>
    `;

    state.registerRecipe({ name: 'world', components: [] });
    await runtime.start();

    const worldElement = document.querySelector('world') as HTMLElement;
    expect(worldElement?.style.display).toBe('none');
  });

  it('should process world element with sky attribute', async () => {
    document.body.innerHTML = `
      <canvas id="game-canvas"></canvas>
      <world canvas="#game-canvas" sky="#87CEEB"></world>
    `;

    state.registerRecipe({ name: 'world', components: [] });
    await runtime.start();

    const worldElement = document.querySelector('world') as HTMLElement;
    expect(worldElement?.style.display).toBe('none');
  });

  it('should process world content with entities', async () => {
    const TestComponent = defineComponent({ value: Types.f32 });
    state.registerComponent('test', TestComponent);
    state.registerRecipe({
      name: 'entity',
      components: ['test'],
    });

    document.body.innerHTML = `
      <world>
        <entity test="value: 42"></entity>
      </world>
    `;

    await runtime.start();

    const entities = defineQuery([TestComponent])(state.world);
    expect(entities.length).toBeGreaterThan(0);
  });

  it('should setup mutation observer for dynamic world elements', async () => {
    await runtime.start();

    const newWorld = document.createElement('world');
    document.body.appendChild(newWorld);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(newWorld.style.display).toBe('none');
  });

  it('should observe nested world elements added dynamically', async () => {
    await runtime.start();

    const container = document.createElement('div');
    container.innerHTML = '<world></world>';
    document.body.appendChild(container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const worldElement = container.querySelector('world') as HTMLElement;
    expect(worldElement?.style.display).toBe('none');
  });

  it('should disconnect mutation observer on stop', async () => {
    await runtime.start();
    runtime.stop();

    const newWorld = document.createElement('world');
    document.body.appendChild(newWorld);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(newWorld.style.display).not.toBe('none');
  });

  it('should stop animation loop when runtime is stopped', async () => {
    let frameCount = 0;
    let maxFrames = 0;

    state.registerSystem({
      update: () => {
        frameCount++;
      },
    });

    await runtime.start();

    await new Promise((resolve) => setTimeout(resolve, 50));
    runtime.stop();
    maxFrames = frameCount;

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(frameCount).toBe(maxFrames);
  });

  it('should validate XML structure in development mode', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    document.body.innerHTML =
      '<world><entity><nested></entity></nested></world>';

    let errorThrown = false;
    try {
      await runtime.start();
    } catch {
      errorThrown = true;
    }

    expect(errorThrown).toBe(true);

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should not validate XML structure in production mode', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    document.body.innerHTML =
      '<world><entity><nested></entity></nested></world>';

    let errorLogged = false;
    const originalError = console.error;
    console.error = () => {
      errorLogged = true;
    };

    await runtime.start();

    console.error = originalError;
    expect(errorLogged).toBe(true);

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should handle multiple world elements', async () => {
    document.body.innerHTML = `
      <world></world>
      <world></world>
    `;

    state.registerRecipe({ name: 'world', components: [] });
    await runtime.start();

    const worldElements = document.querySelectorAll('world');
    worldElements.forEach((element) => {
      expect((element as HTMLElement).style.display).toBe('none');
    });
  });

  it('should process complex nested XML content', async () => {
    const Transform = defineComponent({
      posX: Types.f32,
      posY: Types.f32,
      posZ: Types.f32,
    });

    state.registerComponent('transform', Transform);
    state.registerRecipe({
      name: 'entity',
      components: ['transform'],
    });

    document.body.innerHTML = `
      <world>
        <entity transform="pos: 1 2 3">
          <entity transform="pos: 4 5 6"></entity>
        </entity>
      </world>
    `;

    await runtime.start();

    const entities = defineQuery([Transform])(state.world);
    expect(entities.length).toBe(2);
  });
});
