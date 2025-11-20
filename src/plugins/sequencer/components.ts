import { defineComponent, Types } from 'bitecs';

export const SequencedTransform = defineComponent({
  posX: Types.f32,
  posY: Types.f32,
  posZ: Types.f32,
  eulerX: Types.f32,
  eulerY: Types.f32,
  eulerZ: Types.f32,
  scaleX: Types.f32,
  scaleY: Types.f32,
  scaleZ: Types.f32,
});

export const PositionModifier = defineComponent({
  target: Types.eid,
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
});

export const RotationModifier = defineComponent({
  target: Types.eid,
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
});

export const ScaleModifier = defineComponent({
  target: Types.eid,
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
});
