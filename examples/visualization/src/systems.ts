import type { State, System } from 'vibegame';
import { defineQuery } from 'vibegame';
import { Transform } from 'vibegame/transforms';
import { BreatheDriver, Breathe } from './components';

const driverQuery = defineQuery([BreatheDriver]);
const breatheQuery = defineQuery([Breathe, Transform]);

const BREATHE_SPEED = 2;
const BREATHE_AMPLITUDE = 0.2;

export const BreatheSystem: System = {
  group: 'simulation',
  update(state: State): void {
    const time = state.time.elapsed;

    const drivers = driverQuery(state.world);
    if (drivers.length === 0) return;

    const driverValue = BreatheDriver.value[drivers[0]];

    const oscillation = Math.sin(time * BREATHE_SPEED) * BREATHE_AMPLITUDE * driverValue;
    const scale = 1 + oscillation;

    for (const eid of breatheQuery(state.world)) {
      Transform.scaleX[eid] = scale;
      Transform.scaleY[eid] = scale;
      Transform.scaleZ[eid] = scale;
    }
  },
};
