import { defineComponent, Types } from 'bitecs';

export const enum ShakerMode {
  Additive = 0,
  Multiplicative = 1,
}

export const Shaker = defineComponent({
  target: Types.eid,
  value: Types.f32,
  intensity: Types.f32,
  mode: Types.ui8,
});

export const Tween = defineComponent({
  duration: Types.f32,
  elapsed: Types.f32,
  easingIndex: Types.ui8,
});

export const TweenValue = defineComponent({
  source: Types.ui32,
  target: Types.ui32,
  componentId: Types.ui32,
  fieldIndex: Types.ui32,
  from: Types.f32,
  to: Types.f32,
  value: Types.f32,
});

export const KinematicTween = defineComponent({
  tweenEntity: Types.ui32,
  targetEntity: Types.ui32,
  axis: Types.ui8,
  from: Types.f32,
  to: Types.f32,
  lastPosition: Types.f32,
  targetPosition: Types.f32,
});

export const KinematicRotationTween = defineComponent({
  tweenEntity: Types.ui32,
  targetEntity: Types.ui32,
  axis: Types.ui8,
  from: Types.f32,
  to: Types.f32,
  lastRotation: Types.f32,
  targetRotation: Types.f32,
});

export const enum SequenceState {
  Idle = 0,
  Playing = 1,
}

export const Sequence = defineComponent({
  state: Types.ui8,
  currentIndex: Types.ui32,
  itemCount: Types.ui32,
  pauseRemaining: Types.f32,
});

export const enum TransformShakerType {
  Position = 0,
  Scale = 1,
  Rotation = 2,
}

export const enum TransformShakerAxes {
  X = 1,
  Y = 2,
  Z = 4,
  XY = 3,
  XZ = 5,
  YZ = 6,
  XYZ = 7,
}

export const TransformShaker = defineComponent({
  target: Types.eid,
  type: Types.ui8,
  axes: Types.ui8,
  value: Types.f32,
  intensity: Types.f32,
  mode: Types.ui8,
});
