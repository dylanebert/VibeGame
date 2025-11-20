import { defineComponent, Types } from 'bitecs';

export const Bloom = defineComponent({
  intensity: Types.f32,
  luminanceThreshold: Types.f32,
  mipmapBlur: Types.ui8,
  radius: Types.f32,
  levels: Types.ui8,
});

export const Dithering = defineComponent({
  colorBits: Types.ui8,
  intensity: Types.f32,
  grayscale: Types.ui8,
  scale: Types.f32,
  noise: Types.f32,
});

export const Tonemapping = defineComponent({
  mode: Types.ui8,
  middleGrey: Types.f32,
  whitePoint: Types.f32,
  averageLuminance: Types.f32,
  adaptationRate: Types.f32,
});
