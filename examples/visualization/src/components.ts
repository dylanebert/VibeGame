import { defineComponent, Types } from 'vibegame';

export const BreatheDriver = defineComponent({
  target: Types.eid,
  intensity: Types.f32,
  speed: Types.f32,
  amplitude: Types.f32,
});
