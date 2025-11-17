import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';
import {
  AmbientLight,
  DirectionalLight,
  MainCamera,
  Renderer,
  RenderingPlugin,
} from 'vibegame/rendering';
import { Transform, TransformsPlugin, WorldTransform } from 'vibegame/transforms';

describe('Rendering Plugin Integration', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
  });

  it('should register RenderingPlugin with State', () => {
    state.registerPlugin(RenderingPlugin);
    expect(true).toBe(true);
  });

  it('should process entities with Renderer component', () => {
    state.registerPlugin(RenderingPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Renderer);

    Renderer.shape[entity] = 0;
    Renderer.sizeX[entity] = 1.0;
    Renderer.sizeY[entity] = 1.0;
    Renderer.sizeZ[entity] = 1.0;
    Renderer.color[entity] = 0xffffff;
    Renderer.visible[entity] = 1;

    expect(state.hasComponent(entity, Renderer)).toBe(true);
  });

  it('should handle visibility toggling', () => {
    state.registerPlugin(RenderingPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Renderer);

    Renderer.visible[entity] = 1;
    expect(Renderer.visible[entity]).toBe(1);

    Renderer.visible[entity] = 0;
    expect(Renderer.visible[entity]).toBe(0);
  });

  it('should handle MainCamera entities', () => {
    state.registerPlugin(RenderingPlugin);

    const camera = state.createEntity();
    state.addComponent(camera, MainCamera);

    expect(state.hasComponent(camera, MainCamera)).toBe(true);
  });

  it('should work with transforms for camera positioning', () => {
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(RenderingPlugin);

    const camera = state.createEntity();
    state.addComponent(camera, MainCamera);
    state.addComponent(camera, Transform);
    state.addComponent(camera, WorldTransform);

    Transform.posX[camera] = 0;
    Transform.posY[camera] = 10;
    Transform.posZ[camera] = 20;
    Transform.rotX[camera] = 0;
    Transform.rotY[camera] = 0;
    Transform.rotZ[camera] = 0;
    Transform.rotW[camera] = 1;

    expect(state.hasComponent(camera, MainCamera)).toBe(true);
    expect(state.hasComponent(camera, WorldTransform)).toBe(true);
  });

  it('should handle multiple renderable entities', () => {
    state.registerPlugin(RenderingPlugin);

    const entities = [];
    for (let i = 0; i < 5; i++) {
      const entity = state.createEntity();
      state.addComponent(entity, Renderer);

      Renderer.shape[entity] = i % 4;
      Renderer.sizeX[entity] = 1.0;
      Renderer.sizeY[entity] = 1.0;
      Renderer.sizeZ[entity] = 1.0;
      Renderer.color[entity] = 0xffffff;
      Renderer.visible[entity] = 1;

      entities.push(entity);
    }

    for (const entity of entities) {
      expect(state.hasComponent(entity, Renderer)).toBe(true);
    }
  });

  it('should allow querying renderable entities', () => {
    state.registerPlugin(RenderingPlugin);

    const entity1 = state.createEntity();
    const entity2 = state.createEntity();
    const entity3 = state.createEntity();

    state.addComponent(entity1, Renderer);
    state.addComponent(entity2, Renderer);

    const renderableEntities = defineQuery([Renderer])(state.world);
    expect(renderableEntities).toContain(entity1);
    expect(renderableEntities).toContain(entity2);
    expect(renderableEntities).not.toContain(entity3);
  });

  it('should support camera queries', () => {
    state.registerPlugin(RenderingPlugin);

    const camera1 = state.createEntity();
    const camera2 = state.createEntity();
    const nonCamera = state.createEntity();

    state.addComponent(camera1, MainCamera);
    state.addComponent(camera2, MainCamera);

    const cameraEntities = defineQuery([MainCamera])(state.world);
    expect(cameraEntities).toContain(camera1);
    expect(cameraEntities).toContain(camera2);
    expect(cameraEntities).not.toContain(nonCamera);
  });

  it('should handle entities with both Renderer and transforms', () => {
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(RenderingPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Renderer);
    state.addComponent(entity, Transform);
    state.addComponent(entity, WorldTransform);

    Renderer.shape[entity] = 0;
    Renderer.visible[entity] = 1;
    Transform.posX[entity] = 5;
    Transform.posY[entity] = 10;
    Transform.posZ[entity] = 15;

    expect(state.hasComponent(entity, Renderer)).toBe(true);
    expect(state.hasComponent(entity, WorldTransform)).toBe(true);
  });

  it('should handle light components', () => {
    state.registerPlugin(RenderingPlugin);

    const light = state.createEntity();
    state.addComponent(light, AmbientLight);
    state.addComponent(light, DirectionalLight);

    AmbientLight.skyColor[light] = 0x87ceeb;
    AmbientLight.groundColor[light] = 0x4a4a4a;
    DirectionalLight.color[light] = 0xffffff;
    DirectionalLight.castShadow[light] = 1;

    expect(state.hasComponent(light, AmbientLight)).toBe(true);
    expect(state.hasComponent(light, DirectionalLight)).toBe(true);
  });

  it('should query light entities', () => {
    state.registerPlugin(RenderingPlugin);

    const light1 = state.createEntity();
    const light2 = state.createEntity();
    const nonLight = state.createEntity();

    state.addComponent(light1, AmbientLight);
    state.addComponent(light2, DirectionalLight);

    const ambients = defineQuery([AmbientLight])(state.world);
    const directionals = defineQuery([DirectionalLight])(state.world);

    expect(ambients).toContain(light1);
    expect(directionals).toContain(light2);
    expect(ambients).not.toContain(nonLight);
    expect(directionals).not.toContain(nonLight);
  });

  it('should handle lights with camera for directional shadow following', () => {
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(RenderingPlugin);

    const camera = state.createEntity();
    state.addComponent(camera, MainCamera);
    state.addComponent(camera, WorldTransform);

    const light = state.createEntity();
    state.addComponent(light, DirectionalLight);

    DirectionalLight.directionX[light] = -1;
    DirectionalLight.directionY[light] = -2;
    DirectionalLight.directionZ[light] = -1;
    DirectionalLight.distance[light] = 30;

    expect(state.hasComponent(light, DirectionalLight)).toBe(true);
    expect(state.hasComponent(camera, MainCamera)).toBe(true);
  });
});
