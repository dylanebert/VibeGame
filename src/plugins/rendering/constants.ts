export const AMBIENT_DEFAULTS = {
  skyColor: 0x87ceeb,
  groundColor: 0x4a4a4a,
  intensity: 0.6,
} as const;

export const DIRECTIONAL_DEFAULTS = {
  color: 0xffffff,
  intensity: 1,
  castShadow: 1,
  shadowMapSize: 4096,
  directionX: -1,
  directionY: 2,
  directionZ: -1,
  distance: 30,
} as const;
