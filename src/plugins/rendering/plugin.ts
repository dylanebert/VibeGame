import type { Plugin } from '../../core';
import {
  AmbientLight,
  DirectionalLight,
  MainCamera,
  RenderContext,
  Renderer,
} from './components';
import {
  CameraSyncSystem,
  LightSyncSystem,
  MeshInstanceSystem,
  WebGLRenderSystem,
} from './systems';

export const RenderingPlugin: Plugin = {
  systems: [
    MeshInstanceSystem,
    LightSyncSystem,
    CameraSyncSystem,
    WebGLRenderSystem,
  ],
  components: {
    Renderer,
    RenderContext,
    MainCamera,
    AmbientLight,
    DirectionalLight,
  },
  config: {
    defaults: {
      ambientLight: {
        skyColor: 0x87ceeb,
        groundColor: 0x4a4a4a,
        intensity: 0.6,
      },
      directionalLight: {
        color: 0xffffff,
        intensity: 1,
        castShadow: 1,
        shadowMapSize: 4096,
        directionX: -1,
        directionY: 2,
        directionZ: -1,
        distance: 30,
      },
      renderer: {
        visible: 1,
        sizeX: 1,
        sizeY: 1,
        sizeZ: 1,
        color: 0xffffff,
        unlit: 0,
      },
      mainCamera: {
        projection: 0,
        fov: 75,
        orthoSize: 10,
      },
    },
    enums: {
      renderer: {
        shape: {
          box: 0,
          sphere: 1,
        },
      },
      mainCamera: {
        projection: {
          perspective: 0,
          orthographic: 1,
        },
      },
    },
  },
};
