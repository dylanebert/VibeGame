import { defineComponent, Types } from 'bitecs';

export const Player = defineComponent({
  speed: Types.f32,
  jumpHeight: Types.f32,
  rotationSpeed: Types.f32,
  canJump: Types.ui8,
  isJumping: Types.ui8,
  jumpCooldown: Types.f32,
  lastGroundedTime: Types.f32,
  jumpBufferTime: Types.f32,
  cameraSensitivity: Types.f32,
  cameraZoomSensitivity: Types.f32,
  cameraEntity: Types.eid,
});
