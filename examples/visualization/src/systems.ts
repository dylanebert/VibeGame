import type { State, System } from 'vibegame';
import { defineQuery } from 'vibegame';
import { Transform } from 'vibegame/transforms';
import { BreatheDriver } from './components';

const breatheQuery = defineQuery([BreatheDriver]);

const baseScaleRegistry = new Map<number, { x: number; y: number; z: number }>();

export const BreatheDriverApplySystem: System = {
  group: 'draw',
  first: true,
  update(state: State): void {
    const time = state.time.elapsed;

    for (const driverEid of breatheQuery(state.world)) {
      const targetEid = BreatheDriver.target[driverEid];
      if (!state.hasComponent(targetEid, Transform)) continue;

      baseScaleRegistry.set(driverEid, {
        x: Transform.scaleX[targetEid],
        y: Transform.scaleY[targetEid],
        z: Transform.scaleZ[targetEid],
      });

      const intensity = BreatheDriver.intensity[driverEid];
      const speed = BreatheDriver.speed[driverEid];
      const amplitude = BreatheDriver.amplitude[driverEid];

      const oscillation = Math.sin(time * speed) * amplitude * intensity;
      const multiplier = 1 + oscillation;

      Transform.scaleX[targetEid] *= multiplier;
      Transform.scaleY[targetEid] *= multiplier;
      Transform.scaleZ[targetEid] *= multiplier;
    }
  },
};

export const BreatheDriverRestoreSystem: System = {
  group: 'draw',
  last: true,
  update(state: State): void {
    for (const driverEid of breatheQuery(state.world)) {
      const targetEid = BreatheDriver.target[driverEid];
      const base = baseScaleRegistry.get(driverEid);
      if (!base) continue;

      Transform.scaleX[targetEid] = base.x;
      Transform.scaleY[targetEid] = base.y;
      Transform.scaleZ[targetEid] = base.z;
    }
  },
};
