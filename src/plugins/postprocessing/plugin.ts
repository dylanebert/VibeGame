import type { Plugin } from '../../core';
import { Bloom, Dithering, Tonemapping } from './components';
import { PostprocessingSystem, PostprocessingRenderSystem } from './systems';

export const PostprocessingPlugin: Plugin = {
  systems: [PostprocessingSystem, PostprocessingRenderSystem],
  components: {
    Bloom,
    Dithering,
    Tonemapping,
  },
  config: {
    defaults: {
      bloom: {
        intensity: 1.0,
        luminanceThreshold: 1.0,
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
