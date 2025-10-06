import * as GAME from 'vibegame';
import { Particle } from './components';
import { Systems } from './systems';

export const LorenzPlugin: GAME.Plugin = {
  systems: Systems,
  components: { Particle },
};
