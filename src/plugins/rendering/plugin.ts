import type { Plugin } from '../../core';
import {
  Ambient,
  Directional,
  MainCamera,
  RenderContext,
  Renderer,
} from './components';
import { AMBIENT_DEFAULTS, DIRECTIONAL_DEFAULTS } from './constants';
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
      ambient: {
        skyColor: AMBIENT_DEFAULTS.skyColor,
        groundColor: AMBIENT_DEFAULTS.groundColor,
        intensity: AMBIENT_DEFAULTS.intensity,
      },
      directional: {
        color: DIRECTIONAL_DEFAULTS.color,
        intensity: DIRECTIONAL_DEFAULTS.intensity,
        castShadow: DIRECTIONAL_DEFAULTS.castShadow,
        shadowMapSize: DIRECTIONAL_DEFAULTS.shadowMapSize,
        directionX: DIRECTIONAL_DEFAULTS.directionX,
        directionY: DIRECTIONAL_DEFAULTS.directionY,
        directionZ: DIRECTIONAL_DEFAULTS.directionZ,
        distance: DIRECTIONAL_DEFAULTS.distance,
      },
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
        },
      },
    },
  },
};
