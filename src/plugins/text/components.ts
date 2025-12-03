import { defineComponent, Types } from 'bitecs';

export const Paragraph = defineComponent({
  gap: Types.f32,
  align: Types.ui8,
  anchorX: Types.ui8,
  anchorY: Types.ui8,
  damping: Types.f32,
});

export const Word = defineComponent({
  fontSize: Types.f32,
  color: Types.ui32,
  letterSpacing: Types.f32,
  lineHeight: Types.f32,
  outlineWidth: Types.f32,
  outlineColor: Types.ui32,
  outlineBlur: Types.f32,
  outlineOffsetX: Types.f32,
  outlineOffsetY: Types.f32,
  outlineOpacity: Types.f32,
  strokeWidth: Types.f32,
  strokeColor: Types.ui32,
  strokeOpacity: Types.f32,
  fillOpacity: Types.f32,
  curveRadius: Types.f32,
  width: Types.f32,
  dirty: Types.ui8,
});

export enum Align {
  Left = 0,
  Center = 1,
  Right = 2,
}
