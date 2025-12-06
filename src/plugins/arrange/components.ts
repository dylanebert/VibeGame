import { defineComponent, Types } from 'bitecs';

export const enum Align {
  Left = 0,
  Center = 1,
  Right = 2,
  Top = 3,
  Bottom = 4,
}

export const HorizontalGroup = defineComponent({
  gap: Types.f32,
  align: Types.ui8,
  blend: Types.f32,
  speed: Types.f32,
});

export const HorizontalMember = defineComponent({
  group: Types.eid,
  index: Types.ui32,
});

export const VerticalGroup = defineComponent({
  gap: Types.f32,
  align: Types.ui8,
  blend: Types.f32,
  speed: Types.f32,
});

export const VerticalMember = defineComponent({
  group: Types.eid,
  index: Types.ui32,
});

export const GridGroup = defineComponent({
  gapX: Types.f32,
  gapY: Types.f32,
  columns: Types.ui32,
  alignX: Types.ui8,
  alignY: Types.ui8,
  blend: Types.f32,
  speed: Types.f32,
});

export const GridMember = defineComponent({
  group: Types.eid,
  index: Types.ui32,
});
