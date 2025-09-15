import type { Plugin } from '../../core';
import {
  Ambient,
  Bloom,
  Directional,
  Dithering,
  MainCamera,
  RenderContext,
  Renderer,
  Tonemapping,
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
    Bloom,
    Dithering,
    Tonemapping,
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
      bloom: {
        intensity: 1.0,
        luminanceThreshold: 1.0,
        luminanceSmoothing: 0.03,
        mipmapBlur: 1,
        radius: 0.85,
        levels: 8,
      },
      dithering: {
        colorBits: 4,
        intensity: 1.0,
        grayscale: 0,
        scale: 1.0,
        noise: 1.0,
      },
      tonemapping: {
        mode: 7,
        middleGrey: 0.6,
        whitePoint: 4.0,
        averageLuminance: 1.0,
        adaptationRate: 1.0,
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
      tonemapping: {
        mode: {
          linear: 0,
          reinhard: 1,
          reinhard2: 2,
          'reinhard2-adaptive': 3,
          uncharted2: 4,
          'optimized-cineon': 5,
          cineon: 6,
          'aces-filmic': 7,
          agx: 8,
          neutral: 9,
        },
      },
    },
  },
};
