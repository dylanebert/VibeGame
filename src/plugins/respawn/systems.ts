import { defineQuery, type System } from '../../core';
import { WorldTransform } from '../transforms';
import { Respawn } from './components';
import { respawnEntity } from './utils';

// Query definitions
const respawnQuery = defineQuery([Respawn, WorldTransform]);

export const RespawnSystem: System = {
  group: 'simulation',
  update: (state) => {
    const respawns = respawnQuery(state.world);

    for (const entity of respawns) {
      if (WorldTransform.posY[entity] < -100) {
        respawnEntity(state, entity);
      }
    }
  },
};
