import { defineComponent, Types } from 'bitecs';

export const InputState = defineComponent({
  moveX: Types.f32,
  moveY: Types.f32,
  moveZ: Types.f32,

  lookX: Types.f32,
  lookY: Types.f32,
  scrollDelta: Types.f32,

  jump: Types.ui8,
  primaryAction: Types.ui8,
  secondaryAction: Types.ui8,

  leftMouse: Types.ui8,
  rightMouse: Types.ui8,
  middleMouse: Types.ui8,

  jumpBufferTime: Types.f32,
  primaryBufferTime: Types.f32,
  secondaryBufferTime: Types.f32,
});
