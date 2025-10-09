import type { Plugin } from '../../core';
import { Respawn, Respawning } from './components';
import {
  RespawnCleanupSystem,
  RespawnPhysicsSystem,
  RespawnPlayerSystem,
  RespawnPositionSystem,
  RespawnTriggerSystem,
} from './systems';

export const RespawnPlugin: Plugin = {
  components: {
    Respawn,
    Respawning,
  },
  systems: [
    RespawnTriggerSystem,
    RespawnPositionSystem,
    RespawnPhysicsSystem,
    RespawnPlayerSystem,
    RespawnCleanupSystem,
  ],
};
