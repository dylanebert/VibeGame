import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';
import {
  AmbientLight,
  DirectionalLight,
  MainCamera,
  Renderer,
} from 'vibegame/rendering';

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
    state.addComponent(entity, AmbientLight);

    AmbientLight.skyColor[entity] = 0x87ceeb;
    AmbientLight.groundColor[entity] = 0x4a4a4a;
    AmbientLight.intensity[entity] = 0.6;

    expect(AmbientLight.skyColor[entity]).toBe(0x87ceeb);
    expect(AmbientLight.groundColor[entity]).toBe(0x4a4a4a);
    expect(AmbientLight.intensity[entity]).toBeCloseTo(0.6);
  });

  it('should create DirectionalLight component', () => {
    const entity = state.createEntity();
    state.addComponent(entity, DirectionalLight);

    DirectionalLight.color[entity] = 0xffffff;
    DirectionalLight.intensity[entity] = 1.0;
    DirectionalLight.castShadow[entity] = 1;
    DirectionalLight.shadowMapSize[entity] = 2048;
    DirectionalLight.directionX[entity] = -1;
    DirectionalLight.directionY[entity] = -2;
    DirectionalLight.directionZ[entity] = -1;
    DirectionalLight.distance[entity] = 30;

    expect(DirectionalLight.color[entity]).toBe(0xffffff);
    expect(DirectionalLight.intensity[entity]).toBe(1.0);
    expect(DirectionalLight.castShadow[entity]).toBe(1);
    expect(DirectionalLight.shadowMapSize[entity]).toBe(2048);
    expect(DirectionalLight.distance[entity]).toBe(30);
  });

  it('should support querying light components', () => {
    const ambientQuery = defineQuery([AmbientLight])(state.world);
    const directionalQuery = defineQuery([DirectionalLight])(state.world);

    expect(ambientQuery).toBeDefined();
    expect(directionalQuery).toBeDefined();
  });
});
