import type { Plugin } from '../../core';
import { Player } from './components';
import { PLAYER_DEFAULTS } from './constants';
import { playerRecipe } from './recipes';
import {
  PlayerCameraLinkingSystem,
  PlayerCameraControlSystem,
  PlayerGroundedSystem,
  PlayerMovementSystem,
} from './systems';

export const PlayerPlugin: Plugin = {
  systems: [
    PlayerCameraLinkingSystem,
    PlayerCameraControlSystem,
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
        speed: PLAYER_DEFAULTS.speed,
        jumpHeight: PLAYER_DEFAULTS.jumpHeight,
        rotationSpeed: PLAYER_DEFAULTS.rotationSpeed,
        canJump: PLAYER_DEFAULTS.canJump,
        isJumping: PLAYER_DEFAULTS.isJumping,
        jumpCooldown: PLAYER_DEFAULTS.jumpCooldown,
        lastGroundedTime: PLAYER_DEFAULTS.lastGroundedTime,
        jumpBufferTime: PLAYER_DEFAULTS.jumpBufferTime,
        cameraSensitivity: PLAYER_DEFAULTS.cameraSensitivity,
        cameraZoomSensitivity: PLAYER_DEFAULTS.cameraZoomSensitivity,
        cameraEntity: PLAYER_DEFAULTS.cameraEntity,
      },
    },
  },
};
