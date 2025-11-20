import type { Plugin } from '../../core';
import { Player } from './components';
import { playerRecipe } from './recipes';
import {
  PlayerCameraLinkingSystem,
  PlayerGroundedSystem,
  PlayerMovementSystem,
} from './systems';

export const PlayerPlugin: Plugin = {
  systems: [
    PlayerCameraLinkingSystem,
    PlayerMovementSystem,
    PlayerGroundedSystem,
  ],
  recipes: [playerRecipe],
  components: {
    Player,
  },
  config: {
    defaults: {
      player: {
        speed: 5.3,
        jumpHeight: 2.3,
        rotationSpeed: 10,
        canJump: 1,
        isJumping: 0,
        jumpCooldown: 0,
        lastGroundedTime: 0,
        jumpBufferTime: -10000,
        cameraEntity: 0,
        inheritedVelX: 0,
        inheritedVelZ: 0,
      },
    },
  },
};
