import { defineComponent, Types } from 'bitecs';

export const Text = defineComponent({
  fontSize: Types.f32,
  color: Types.ui32,
  anchorX: Types.ui8,
  anchorY: Types.ui8,
  textAlign: Types.ui8,
  maxWidth: Types.f32,
  lineHeight: Types.f32,
  dirty: Types.ui8,
});
