import { defineComponent, Types } from 'bitecs';

export const OrbitCamera = defineComponent({
  target: Types.eid,
  currentYaw: Types.f32,
  currentPitch: Types.f32,
  currentDistance: Types.f32,
  targetYaw: Types.f32,
  targetPitch: Types.f32,
  targetDistance: Types.f32,
  minDistance: Types.f32,
  maxDistance: Types.f32,
  minPitch: Types.f32,
  maxPitch: Types.f32,
  smoothness: Types.f32,
  offsetX: Types.f32,
  offsetY: Types.f32,
  offsetZ: Types.f32,
});
