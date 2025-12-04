import { defineComponent, Types } from 'bitecs';

export const Line = defineComponent({
  offsetX: Types.f32,
  offsetY: Types.f32,
  offsetZ: Types.f32,
  color: Types.ui32,
  thickness: Types.f32,
  opacity: Types.f32,
  visible: Types.ui8,
  arrowStart: Types.ui8,
  arrowEnd: Types.ui8,
  arrowSize: Types.f32,
});
