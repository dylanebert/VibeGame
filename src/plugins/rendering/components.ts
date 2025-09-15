import { defineComponent, Types } from 'bitecs';

export const Renderer = defineComponent({
  shape: Types.ui8,
  sizeX: Types.f32,
  sizeY: Types.f32,
  sizeZ: Types.f32,
  color: Types.ui32,
  visible: Types.ui8,
});

export const RenderContext = defineComponent({
  clearColor: Types.ui32,
  hasCanvas: Types.ui8,
});

export const MainCamera = defineComponent();

export const Ambient = defineComponent({
  skyColor: Types.ui32,
  groundColor: Types.ui32,
  intensity: Types.f32,
});

export const Directional = defineComponent({
  color: Types.ui32,
  intensity: Types.f32,
  castShadow: Types.ui8,
  shadowMapSize: Types.ui32,
  directionX: Types.f32,
  directionY: Types.f32,
  directionZ: Types.f32,
  distance: Types.f32,
});

export const Bloom = defineComponent({
  intensity: Types.f32,
  luminanceThreshold: Types.f32,
  luminanceSmoothing: Types.f32,
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
