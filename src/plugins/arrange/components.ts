import { defineComponent, Types } from 'bitecs';

export const enum Align {
  Left = 0,
  Center = 1,
  Right = 2,
}

export const HorizontalGroup = defineComponent({
  gap: Types.f32,
  align: Types.ui8,
  blend: Types.f32,
});

export const HorizontalMember = defineComponent({
  group: Types.eid,
  index: Types.ui32,
});
