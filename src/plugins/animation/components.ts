import { defineComponent, Types } from 'bitecs';

export const AnimatedCharacter = defineComponent({
  headEntity: Types.eid,
  torsoEntity: Types.eid,
  leftArmEntity: Types.eid,
  rightArmEntity: Types.eid,
  leftLegEntity: Types.eid,
  rightLegEntity: Types.eid,
  phase: Types.f32,
  jumpTime: Types.f32,
  fallTime: Types.f32,
  animationState: Types.ui8,
  stateTransition: Types.f32,
});

export const HasAnimator = defineComponent();
