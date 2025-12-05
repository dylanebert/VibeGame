import type { State, System } from '../../core';
import { defineQuery } from '../../core';
import { Transform } from '../transforms';
import { HorizontalGroup, HorizontalMember } from './components';
import { horizontalPosition } from './utils';

const memberQuery = defineQuery([HorizontalMember]);

export const HorizontalArrangeSystem: System = {
  group: 'simulation',
  update(state: State): void {
    const members = memberQuery(state.world);

    const groupCounts = new Map<number, number>();
    for (const eid of members) {
      const groupEid = HorizontalMember.group[eid];
      const currentMax = groupCounts.get(groupEid) ?? 0;
      groupCounts.set(
        groupEid,
        Math.max(currentMax, HorizontalMember.index[eid] + 1)
      );
    }

    for (const eid of members) {
      if (!state.hasComponent(eid, Transform)) continue;

      const groupEid = HorizontalMember.group[eid];
      if (!state.hasComponent(groupEid, HorizontalGroup)) continue;

      const blend = HorizontalGroup.blend[groupEid];
      if (blend <= 0) continue;

      const count = groupCounts.get(groupEid) ?? 1;
      const gap = HorizontalGroup.gap[groupEid];
      const align = HorizontalGroup.align[groupEid];
      const index = HorizontalMember.index[eid];

      const pos = horizontalPosition(count, gap, align, index);

      Transform.posX[eid] = pos.x;
      Transform.posY[eid] = pos.y;
      Transform.posZ[eid] = pos.z;
    }
  },
};
