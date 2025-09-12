import { defineComponent, Types } from 'bitecs';

export const Transform = defineComponent({
  posX: Types.f32,
  posY: Types.f32,
  posZ: Types.f32,
  rotX: Types.f32,
  rotY: Types.f32,
  rotZ: Types.f32,
  rotW: Types.f32,
  eulerX: Types.f32,
  eulerY: Types.f32,
  eulerZ: Types.f32,
  scaleX: Types.f32,
  scaleY: Types.f32,
  scaleZ: Types.f32,
});

export const WorldTransform = defineComponent({
  posX: Types.f32,
  posY: Types.f32,
  posZ: Types.f32,
  rotX: Types.f32,
  rotY: Types.f32,
  rotZ: Types.f32,
  rotW: Types.f32,
  eulerX: Types.f32,
  eulerY: Types.f32,
  eulerZ: Types.f32,
  scaleX: Types.f32,
  scaleY: Types.f32,
  scaleZ: Types.f32,
});
