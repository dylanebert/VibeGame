import { Types } from 'bitecs';
import { defineComponent } from '../../core';

export const Respawn = defineComponent({
  posX: Types.f32,
  posY: Types.f32,
  posZ: Types.f32,
  eulerX: Types.f32,
  eulerY: Types.f32,
  eulerZ: Types.f32,
});
