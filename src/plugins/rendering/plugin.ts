import type { Plugin } from '../../core';
import {
  Ambient,
  Directional,
  MainCamera,
  RenderContext,
  Renderer,
} from './components';
import {
  ambientLightRecipe,
  directionalLightRecipe,
  lightRecipe,
} from './recipes';
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
  recipes: [ambientLightRecipe, directionalLightRecipe, lightRecipe],
  components: {
    Renderer,
    RenderContext,
    MainCamera,
    Ambient,
    Directional,
  },
  config: {
    defaults: {
      renderer: {
        visible: 1,
        sizeX: 1,
        sizeY: 1,
        sizeZ: 1,
        color: 0xffffff,
      },
    },
    enums: {
      renderer: {
        shape: {
          box: 0,
          sphere: 1,
          cylinder: 2,
          plane: 3,
        },
      },
    },
  },
};
