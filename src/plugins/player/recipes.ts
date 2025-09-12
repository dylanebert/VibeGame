import type { Recipe } from '../../core';
import {
  PLAYER_BODY_DEFAULTS,
  PLAYER_CHARACTER_CONTROLLER_DEFAULTS,
  PLAYER_COLLIDER_DEFAULTS,
} from './constants';

export const playerRecipe: Recipe = {
  name: 'player',
  components: [
    'player',
    'character-movement',
    'transform',
    'world-transform',
    'body',
    'collider',
    'character-controller',
    'input-state',
    'respawn',
  ],
  overrides: {
    'body.eulerY': PLAYER_BODY_DEFAULTS.eulerY,
    'body.type': PLAYER_BODY_DEFAULTS.type,
    'body.ccd': PLAYER_BODY_DEFAULTS.ccd,
    'body.lock-rot-x': PLAYER_BODY_DEFAULTS.lockRotX,
    'body.lock-rot-z': PLAYER_BODY_DEFAULTS.lockRotZ,
    'collider.shape': PLAYER_COLLIDER_DEFAULTS.shape,
    'collider.radius': PLAYER_COLLIDER_DEFAULTS.radius,
    'collider.height': PLAYER_COLLIDER_DEFAULTS.height,
    'collider.friction': PLAYER_COLLIDER_DEFAULTS.friction,
    'collider.pos-offset-y': PLAYER_COLLIDER_DEFAULTS.posOffsetY,
    'character-controller.offset': PLAYER_CHARACTER_CONTROLLER_DEFAULTS.offset,
    'character-controller.max-slope':
      PLAYER_CHARACTER_CONTROLLER_DEFAULTS.maxSlope,
    'character-controller.max-slide':
      PLAYER_CHARACTER_CONTROLLER_DEFAULTS.maxSlide,
    'character-controller.snap-dist':
      PLAYER_CHARACTER_CONTROLLER_DEFAULTS.snapDist,
    'character-controller.auto-step':
      PLAYER_CHARACTER_CONTROLLER_DEFAULTS.autoStep,
    'character-controller.max-step-height':
      PLAYER_CHARACTER_CONTROLLER_DEFAULTS.maxStepHeight,
    'character-controller.min-step-width':
      PLAYER_CHARACTER_CONTROLLER_DEFAULTS.minStepWidth,
    'character-controller.up-x': PLAYER_CHARACTER_CONTROLLER_DEFAULTS.upX,
    'character-controller.up-y': PLAYER_CHARACTER_CONTROLLER_DEFAULTS.upY,
    'character-controller.up-z': PLAYER_CHARACTER_CONTROLLER_DEFAULTS.upZ,
  },
};
