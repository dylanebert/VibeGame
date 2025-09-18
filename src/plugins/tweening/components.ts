import { defineComponent, Types } from 'bitecs';

export const Tween = defineComponent({
  duration: Types.f32,
  elapsed: Types.f32,
  easingIndex: Types.ui8,
  loopMode: Types.ui8,
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
