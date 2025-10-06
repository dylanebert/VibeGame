import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';
import { Ambient, Directional, MainCamera, Renderer } from 'vibegame';

describe('Rendering Components', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
  });

  it('should create Renderer component with proper field access', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Renderer);

    Renderer.shape[entity] = 0; // BOX
    Renderer.sizeX[entity] = 2.0;
    Renderer.sizeY[entity] = 3.0;
    Renderer.sizeZ[entity] = 1.5;
    Renderer.color[entity] = 0xff0000;
    Renderer.visible[entity] = 1;

    expect(Renderer.shape[entity]).toBe(0);
    expect(Renderer.sizeX[entity]).toBe(2.0);
    expect(Renderer.sizeY[entity]).toBe(3.0);
    expect(Renderer.sizeZ[entity]).toBe(1.5);
    expect(Renderer.color[entity]).toBe(0xff0000);
    expect(Renderer.visible[entity]).toBe(1);
  });

  it('should handle different shape types', () => {
    const box = state.createEntity();
    const sphere = state.createEntity();

    state.addComponent(box, Renderer);
    state.addComponent(sphere, Renderer);

    Renderer.shape[box] = 0; // BOX
    Renderer.shape[sphere] = 1; // SPHERE

    expect(Renderer.shape[box]).toBe(0);
    expect(Renderer.shape[sphere]).toBe(1);
  });

  it('should handle visibility states', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Renderer);

    Renderer.visible[entity] = 1;
    expect(Renderer.visible[entity]).toBe(1);

    Renderer.visible[entity] = 0;
    expect(Renderer.visible[entity]).toBe(0);
  });

  it('should create MainCamera component', () => {
    const entity = state.createEntity();
    state.addComponent(entity, MainCamera);

    expect(state.hasComponent(entity, MainCamera)).toBe(true);
  });

  it('should support component queries', () => {
    const rendererQuery = defineQuery([Renderer])(state.world);
    const cameraQuery = defineQuery([MainCamera])(state.world);
    const combinedQuery = defineQuery([Renderer, MainCamera])(state.world);

    expect(rendererQuery).toBeDefined();
    expect(cameraQuery).toBeDefined();
    expect(combinedQuery).toBeDefined();
  });

  it('should handle multiple entities with Renderer component', () => {
    const entity1 = state.createEntity();
    const entity2 = state.createEntity();
    const entity3 = state.createEntity();

    state.addComponent(entity1, Renderer);
    state.addComponent(entity2, Renderer);
    state.addComponent(entity3, Renderer);

    Renderer.color[entity1] = 0xff0000;
    Renderer.color[entity2] = 0x00ff00;
    Renderer.color[entity3] = 0x0000ff;

    expect(Renderer.color[entity1]).toBe(0xff0000);
    expect(Renderer.color[entity2]).toBe(0x00ff00);
    expect(Renderer.color[entity3]).toBe(0x0000ff);
  });

  it('should create HemisphereLight component', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Ambient);

    Ambient.skyColor[entity] = 0x87ceeb;
    Ambient.groundColor[entity] = 0x4a4a4a;
    Ambient.intensity[entity] = 0.6;

    expect(Ambient.skyColor[entity]).toBe(0x87ceeb);
    expect(Ambient.groundColor[entity]).toBe(0x4a4a4a);
    expect(Ambient.intensity[entity]).toBeCloseTo(0.6);
  });

  it('should create DirectionalLight component', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Directional);

    Directional.color[entity] = 0xffffff;
    Directional.intensity[entity] = 1.0;
    Directional.castShadow[entity] = 1;
    Directional.shadowMapSize[entity] = 2048;
    Directional.directionX[entity] = -1;
    Directional.directionY[entity] = -2;
    Directional.directionZ[entity] = -1;
    Directional.distance[entity] = 30;

    expect(Directional.color[entity]).toBe(0xffffff);
    expect(Directional.intensity[entity]).toBe(1.0);
    expect(Directional.castShadow[entity]).toBe(1);
    expect(Directional.shadowMapSize[entity]).toBe(2048);
    expect(Directional.distance[entity]).toBe(30);
  });

  it('should support querying light components', () => {
    const ambientQuery = defineQuery([Ambient])(state.world);
    const directionalQuery = defineQuery([Directional])(state.world);

    expect(ambientQuery).toBeDefined();
    expect(directionalQuery).toBeDefined();
  });
});
