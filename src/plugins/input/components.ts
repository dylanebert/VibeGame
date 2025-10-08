import { defineComponent, Types } from 'bitecs';

export const InputState = defineComponent({
  tick: Types.ui32,
  buttons: Types.ui16,
  moveX: Types.f32,
  moveY: Types.f32,
  lookDeltaX: Types.f32,
  lookDeltaY: Types.f32,
  scrollDelta: Types.f32,
});

export const InputButtons = {
  JUMP: 0x0001,
  PRIMARY: 0x0002,
  SECONDARY: 0x0004,
  MOVE_FORWARD: 0x0008,
  MOVE_BACKWARD: 0x0010,
  MOVE_LEFT: 0x0020,
  MOVE_RIGHT: 0x0040,
  MOVE_UP: 0x0080,
  MOVE_DOWN: 0x0100,
  LEFT_MOUSE: 0x0200,
  RIGHT_MOUSE: 0x0400,
  MIDDLE_MOUSE: 0x0800,
} as const;
