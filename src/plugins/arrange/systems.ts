import type { State, System } from '../../core';
import { defineQuery } from '../../core';
import { Transform } from '../transforms';
import { Group, Member } from './components';
import { strategyRegistry } from './utils';

const memberQuery = defineQuery([Member]);

export const ArrangeSystem: System = {
  group: 'simulation',
  update(state: State): void {
    for (const eid of memberQuery(state.world)) {
      if (!state.hasComponent(eid, Transform)) continue;

      const groupEid = Member.group[eid];
      if (!state.hasComponent(groupEid, Group)) continue;

      const weight = Group.weight[groupEid];
      if (weight <= 0) continue;

      const strategy = strategyRegistry.get(Group.strategy[groupEid]);
      if (!strategy) continue;

      const arranged = strategy(
        Group.count[groupEid],
        Group.gap[groupEid],
        Member.index[eid]
      );

      Transform.posX[eid] = arranged.x;
      Transform.posY[eid] = arranged.y;
      Transform.posZ[eid] = arranged.z;
    }
  },
};
