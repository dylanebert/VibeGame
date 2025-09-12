import type { Plugin } from '../../core';
import { Respawn } from './components';
import { RespawnSystem } from './systems';

export const RespawnPlugin: Plugin = {
  components: {
    Respawn,
  },
  systems: [RespawnSystem],
};
