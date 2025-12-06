import type { State, System } from '../../core';
import { defineQuery } from '../../core';
import { Transform } from '../transforms';
import {
  GridGroup,
  GridMember,
  HorizontalGroup,
  HorizontalMember,
  VerticalGroup,
  VerticalMember,
} from './components';
import { gridPosition, horizontalPosition, verticalPosition } from './utils';

const horizontalMemberQuery = defineQuery([HorizontalMember]);
const verticalMemberQuery = defineQuery([VerticalMember]);
const gridMemberQuery = defineQuery([GridMember]);

function lerpFactor(speed: number, dt: number): number {
  if (speed <= 0) return 1;
  return 1 - Math.exp(-speed * dt);
}

export const HorizontalArrangeSystem: System = {
  group: 'simulation',
  update(state: State): void {
    const members = horizontalMemberQuery(state.world);
    const dt = state.time.deltaTime;

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
      const speed = HorizontalGroup.speed[groupEid];
      const index = HorizontalMember.index[eid];

      const pos = horizontalPosition(count, gap, align, index);
      const t = lerpFactor(speed, dt) * blend;

      Transform.posX[eid] += (pos.x - Transform.posX[eid]) * t;
      Transform.posY[eid] += (pos.y - Transform.posY[eid]) * t;
      Transform.posZ[eid] += (pos.z - Transform.posZ[eid]) * t;
    }
  },
};

export const VerticalArrangeSystem: System = {
  group: 'simulation',
  update(state: State): void {
    const members = verticalMemberQuery(state.world);
    const dt = state.time.deltaTime;

    const groupCounts = new Map<number, number>();
    for (const eid of members) {
      const groupEid = VerticalMember.group[eid];
      const currentMax = groupCounts.get(groupEid) ?? 0;
      groupCounts.set(
        groupEid,
        Math.max(currentMax, VerticalMember.index[eid] + 1)
      );
    }

    for (const eid of members) {
      if (!state.hasComponent(eid, Transform)) continue;

      const groupEid = VerticalMember.group[eid];
      if (!state.hasComponent(groupEid, VerticalGroup)) continue;

      const blend = VerticalGroup.blend[groupEid];
      if (blend <= 0) continue;

      const count = groupCounts.get(groupEid) ?? 1;
      const gap = VerticalGroup.gap[groupEid];
      const align = VerticalGroup.align[groupEid];
      const speed = VerticalGroup.speed[groupEid];
      const index = VerticalMember.index[eid];

      const pos = verticalPosition(count, gap, align, index);
      const t = lerpFactor(speed, dt) * blend;

      Transform.posX[eid] += (pos.x - Transform.posX[eid]) * t;
      Transform.posY[eid] += (pos.y - Transform.posY[eid]) * t;
      Transform.posZ[eid] += (pos.z - Transform.posZ[eid]) * t;
    }
  },
};

export const GridArrangeSystem: System = {
  group: 'simulation',
  update(state: State): void {
    const members = gridMemberQuery(state.world);
    const dt = state.time.deltaTime;

    const groupCounts = new Map<number, number>();
    for (const eid of members) {
      const groupEid = GridMember.group[eid];
      const currentMax = groupCounts.get(groupEid) ?? 0;
      groupCounts.set(
        groupEid,
        Math.max(currentMax, GridMember.index[eid] + 1)
      );
    }

    for (const eid of members) {
      if (!state.hasComponent(eid, Transform)) continue;

      const groupEid = GridMember.group[eid];
      if (!state.hasComponent(groupEid, GridGroup)) continue;

      const blend = GridGroup.blend[groupEid];
      if (blend <= 0) continue;

      const count = groupCounts.get(groupEid) ?? 1;
      const columns = GridGroup.columns[groupEid];
      const gapX = GridGroup.gapX[groupEid];
      const gapY = GridGroup.gapY[groupEid];
      const alignX = GridGroup.alignX[groupEid];
      const alignY = GridGroup.alignY[groupEid];
      const speed = GridGroup.speed[groupEid];
      const index = GridMember.index[eid];

      const pos = gridPosition(
        columns,
        gapX,
        gapY,
        alignX,
        alignY,
        index,
        count
      );
      const t = lerpFactor(speed, dt) * blend;

      Transform.posX[eid] += (pos.x - Transform.posX[eid]) * t;
      Transform.posY[eid] += (pos.y - Transform.posY[eid]) * t;
      Transform.posZ[eid] += (pos.z - Transform.posZ[eid]) * t;
    }
  },
};
