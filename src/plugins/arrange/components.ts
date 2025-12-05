import { defineComponent, Types } from 'bitecs';

export const enum Strategy {
  Horizontal = 0,
}

export const Group = defineComponent({
  strategy: Types.ui8,
  gap: Types.f32,
  weight: Types.f32,
  count: Types.ui32,
});

export const Member = defineComponent({
  group: Types.eid,
  index: Types.ui32,
});
