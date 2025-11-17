import * as GAME from 'vibegame';
import { Transform } from 'vibegame/transforms';
import { Particle } from './components';
import { initializeLorenz, updateLorenz } from './utils';

const COUNT = 5000;

const LorenzSetupSystem: GAME.System = {
  group: 'setup',
  setup(state: GAME.State) {
    for (let i = 0; i < COUNT; i++) {
      const eid = state.createEntity();
      initializeLorenz(state, eid);
    }
  },
};

const query = GAME.defineQuery([Particle, Transform]);

const LorenzUpdateSystem: GAME.System = {
  group: 'fixed',
  update(state: GAME.State) {
    const entities = query(state.world);
    for (const eid of entities) {
      updateLorenz(state, eid);
    }
  },
};

export const Systems = [LorenzSetupSystem, LorenzUpdateSystem];
